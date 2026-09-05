"""Bootstrap accès prod : mot de passe initial aux comptes seed sans mdp
+ rôle ADMIN au Président (P1). Ne touche JAMAIS aux comptes existants
avec mot de passe (remplit les trous uniquement — rejouable)."""
from django.db import migrations


SEED_EMAILS = [
    'ivo.abdoul@emsp.int',
    'nassirou.saley@emsp.int',
    'abba.kakazara@emsp.int',
    'silue.foungnigue@emsp.int',
    'cisse.djenin@emsp.int',
    'ouattara.ibrahim@emsp.int',
    'saidou.samba@emsp.int',
    'savadogo.razakim@emsp.int',
    'karidoula.sie@emsp.int',
    'ateliers@emsp.int',
]


def bootstrap_acces(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    Role = apps.get_model('accounts', 'Role')
    for email in SEED_EMAILS:
        try:
            u = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            continue
        # Modèle historique : pas de has_usable_password() → les mdp
        # inutilisables commencent par '!' (set_unusable_password).
        if not (u.password or '').startswith('!'):
            continue
        u.set_password('ITClub2026!')
        u.save(update_fields=['password'])
    # Rôle ADMIN au Président (transférable ensuite via backoffice Admin)
    try:
        p1 = User.objects.get(email__iexact='ivo.abdoul@emsp.int')
        Role.objects.update_or_create(
            code='ADMIN', defaults={'titulaire': p1})
    except User.DoesNotExist:
        pass


class Migration(migrations.Migration):
    dependencies = [('accounts', '0004_user_points')]
    operations = [migrations.RunPython(bootstrap_acces, migrations.RunPython.noop)]
