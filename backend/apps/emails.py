"""Envoi d'emails transactionnels via Brevo (doc 02 D10, doc 04 §7).

- Transport : API REST Brevo (api.brevo.com) en stdlib (urllib), sans dépendance.
  Brevo remplace Resend (04/09/2026) : gratuit 300 mails/jour, IP joignable
  depuis ce réseau (Resend/Cloudflare coupait le TLS depuis l'EMSP).
- Clé lue depuis BREVO_API_KEY (jamais dans le repo). Resend ignoré.
- Sans clé : log-only, les vues restent fonctionnelles (fail-open).
- Chaque envoi (ou tentative) est tracé en Notification (audit + in-app).
- Les préférences du profil (User.notif_prefs) sont respectées par type.
"""
import json
import logging
import urllib.request
import urllib.error

from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)

BREVO_API = 'https://api.brevo.com/v3/smtp/email'


class EmailError(Exception):
    """Échec d'envoi (clé invalide, réseau, destinataire refusé…)."""


def _notif_model():
    from apps.notifications.models import Notification
    return Notification


def wants_email(user, notif_type):
    """Préférences du profil : absent = accepté (doc 02 D10)."""
    if user is None or notif_type is None:
        return True
    try:
        prefs = getattr(user, 'notif_prefs', None) or {}
        return prefs.get(notif_type, True) is not False
    except Exception:
        return True


def _tracer(type_notif, titre, message, email, user=None, objet_id='', envoye=True, resend_id=''):
    try:
        return _notif_model().objects.create(
            type=type_notif or 'annonce', titre=titre[:140], message=message or '',
            destinataire=user, destinataire_email=email or '',
            objet_id=str(objet_id or ''), envoye=envoye, resend_id=resend_id or '',
        )
    except Exception as exc:  # la trace ne doit jamais casser l'envoi
        logger.warning('Notification non tracée (%s): %s', titre, exc)
        return None


def send_email(to, subject, template, context=None, notif_type=None,
               user=None, objet_id='', reply_to=None):
    """Envoie un template via Brevo. Retourne un dict (messageId, skipped ou error).

    - prefs refusées → {'skipped': 'prefs'} (tracé, envoye=False)
    - pas de clé → {'skipped': 'no-key'} (tracé, envoye=False)
    - erreur Brevo → lève EmailError (la vue décide : fail-open recommandé)
    """
    context = {'frontend_url': settings.FRONTEND_URL, **(context or {})}
    to = (to or '').strip()
    if not to:
        raise EmailError('destinataire vide')
    if user is not None and not wants_email(user, notif_type):
        logger.info('Email %s ignoré (préférences %s)', to, notif_type)
        _tracer(notif_type, subject, '', to, user, objet_id, envoye=False)
        return {'skipped': 'prefs'}

    html = render_to_string(f'emails/{template}', context)
    text = strip_tags(html)
    cle = settings.BREVO_API_KEY
    trace = _tracer(notif_type, subject, text[:500], to, user, objet_id,
                    envoye=bool(cle))

    if not cle:
        logger.warning('BREVO_API_KEY absente — email log-only vers %s (%s)', to, subject)
        return {'skipped': 'no-key'}

    # Contrat Brevo : expéditeur structuré {name, email}
    m = settings.BREVO_FROM
    expediteur = {'email': m, 'name': 'IT-CLUB EMSP'}
    payload = {
        'sender': expediteur,
        'to': [{'email': to}],
        'subject': subject,
        'htmlContent': html,
        'textContent': text,
    }
    if reply_to:
        payload['replyTo'] = {'email': reply_to}
    req = urllib.request.Request(
        BREVO_API,
        data=json.dumps(payload).encode('utf-8'),
        headers={'api-key': cle,
                 'Content-Type': 'application/json',
                 'accept': 'application/json',
                 'User-Agent': 'IT-CLUB-EMSP/1.0 (+https://emsp.int)'},
        method='POST',
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode('utf-8', 'replace')[:300]
        if trace is not None:
            try:
                trace.envoye = False
                trace.save(update_fields=['envoye'])
            except Exception:
                pass
        raise EmailError(f'Brevo {exc.code}: {detail}')
    except Exception as exc:
        if trace is not None:
            try:
                trace.envoye = False
                trace.save(update_fields=['envoye'])
            except Exception:
                pass
        raise EmailError(f'réseau Brevo: {exc}')
    brevo_id = data.get('messageId', '')
    # met à jour la trace avec l'id Brevo (colonne resend_id réutilisée)
    try:
        n = _notif_model().objects.filter(
            destinataire_email=to, titre=subject[:140]).order_by('-cree_le').first()
        if n is not None:
            n.resend_id = brevo_id
            n.save(update_fields=['resend_id'])
    except Exception as exc:
        logger.warning('Trace Brevo non mise à jour: %s', exc)
    logger.info('Email envoyé à %s via Brevo (%s)', to, brevo_id)
    return {'id': brevo_id}


# ── Extraction depuis le formulaire dynamique (donnees JSON) ──
def email_de_candidature(c):
    d = c.donnees or {}
    for k in ('email', 'e-mail', 'courriel', 'mail', 'adresse_email'):
        v = (d.get(k) or '').strip() if isinstance(d.get(k), str) else ''
        if v:
            return v
    return ''


def nom_de_candidature(c):
    d = c.donnees or {}
    prenom = str(d.get('prenom') or d.get('prénom') or '').strip()
    nom = str(d.get('nom') or '').strip()
    plein = f'{prenom} {nom}'.strip()
    return plein or 'futur membre'


def _cellules_noms(c):
    try:
        return ', '.join(c.cellules_souhaitees.values_list('nom', flat=True)) or 'à définir'
    except Exception:
        return 'à définir'


# ── Envois métier (un par cas doc 02 D10 + doc 04 §7) ──
def send_candidature_recue(c):
    email = email_de_candidature(c)
    return send_email(email, '[IT-CLUB EMSP] Candidature bien reçue',
                      'candidature_recue.html',
                      {'nom': nom_de_candidature(c), 'cellules': _cellules_noms(c)},
                      notif_type='candidature', objet_id=c.pk)


def send_candidature_validee(c, user):
    return send_email(user.email, '[IT-CLUB EMSP] Bienvenue dans le club !',
                      'candidature_validee.html',
                      {'nom': user.get_full_name() or user.username, 'cellules': _cellules_noms(c)},
                      notif_type='candidature', user=user, objet_id=c.pk)


def send_candidature_refusee(c):
    email = email_de_candidature(c)
    return send_email(email, '[IT-CLUB EMSP] Suite de ta candidature',
                      'candidature_refusee.html',
                      {'nom': nom_de_candidature(c)},
                      notif_type='candidature', objet_id=c.pk)


def send_inscription_confirmee(inscription):
    evt, m = inscription.evenement, inscription.membre
    return send_email(m.email, f'[IT-CLUB EMSP] Inscription confirmée — {evt.titre}',
                      'inscription_confirmee.html',
                      {'nom': m.get_full_name() or m.username, 'evt': evt},
                      notif_type='inscription', user=m, objet_id=evt.pk)


def send_liste_attente(inscription, position):
    evt, m = inscription.evenement, inscription.membre
    return send_email(m.email, f'[IT-CLUB EMSP] Liste d’attente — {evt.titre}',
                      'liste_attente.html',
                      {'nom': m.get_full_name() or m.username, 'evt': evt, 'position': position},
                      notif_type='inscription', user=m, objet_id=evt.pk)


def send_promotion(inscription):
    evt, m = inscription.evenement, inscription.membre
    return send_email(m.email, f'[IT-CLUB EMSP] Une place s’est libérée — {evt.titre}',
                      'promotion_liste_attente.html',
                      {'nom': m.get_full_name() or m.username, 'evt': evt},
                      notif_type='promotion', user=m, objet_id=evt.pk)


def send_rappel(membre, evt, echeance):
    return send_email(membre.email, f'[IT-CLUB EMSP] Rappel {echeance} — {evt.titre}',
                      'rappel_evenement.html',
                      {'nom': membre.get_full_name() or membre.username, 'evt': evt, 'echeance': echeance},
                      notif_type='rappel', user=membre, objet_id=f'{evt.pk}:{echeance}')


def send_convocation(email, nom, titre, date_str, lieu, ordre_du_jour, rappel=False):
    sujet = f'[IT-CLUB EMSP] {"Rappel H-48h — " if rappel else "Convocation — "}{titre}'
    return send_email(email, sujet, 'convocation_reunion.html',
                      {'nom': nom, 'titre': titre, 'date_str': date_str,
                       'lieu': lieu, 'ordre_du_jour': ordre_du_jour, 'rappel': rappel},
                      notif_type='convocation', objet_id=titre)


def send_satisfaction(membre, evt):
    return send_email(membre.email, f'[IT-CLUB EMSP] Ton avis compte — {evt.titre}',
                      'satisfaction_post_activite.html',
                      {'nom': membre.get_full_name() or membre.username, 'evt': evt},
                      notif_type='satisfaction', user=membre, objet_id=evt.pk)


def send_recap_hebdo(membre, evenements):
    return send_email(membre.email, '[IT-CLUB EMSP] Ta semaine au club',
                      'recap_hebdo.html',
                      {'nom': membre.get_full_name() or membre.username, 'evenements': evenements},
                      notif_type='recap', user=membre)


def send_annonce(email, nom, actualite, user=None):
    return send_email(email, f'[IT-CLUB EMSP] {actualite.titre}',
                      'annonce_publiee.html',
                      {'nom': nom, 'actu': actualite},
                      notif_type='annonce', user=user, objet_id=actualite.pk)
