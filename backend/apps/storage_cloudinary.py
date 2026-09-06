"""Stockage Cloudinary pour les fichiers du club (photos, affiches, documents).

Pourquoi : l'hébergement Render gratuit efface le disque local à chaque
redémarrage → les images uploadées disparaissaient (404) alors que la base
(Neon) gardait leur chemin. Cloudinary garde les fichiers en permanence.

Actif uniquement si CLOUDINARY_CLOUD_NAME est défini dans l'environnement
(Render → Environment, jamais dans le repo). Sinon : disque local (dev).

Fonctionnement transparent : aucun changement dans les vues/serializers.
_save() téléverse et renvoie l'URL de livraison comme « nom » ; .url()
la redonne telle quelle (le front la passe telle quelle via urlMedia()).
"""
import os
import re
import uuid

from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible


def _client():
    import cloudinary
    import cloudinary.uploader  # noqa: F401 (enregistre cloudinary.uploader)
    if os.environ.get('CLOUDINARY_URL'):
        # Chaîne complète cloudinary://cle:secret@nom (copier-coller unique,
        # moins d'erreur de recopie que 3 variables séparées).
        cloudinary.config(secure=True)
    else:
        cloudinary.config(
            cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME', ''),
            api_key=os.environ.get('CLOUDINARY_API_KEY', ''),
            api_secret=os.environ.get('CLOUDINARY_API_SECRET', ''),
            secure=True,
        )
    return cloudinary


def _public_id_depuis_url(url):
    """Retrouve le public_id Cloudinary depuis une URL de livraison."""
    m = re.search(r'/upload/(?:v\d+/)?(.+?)(?:\.[a-zA-Z0-9]+)?$', url or '')
    return m.group(1) if m else None


@deconstructible
class StockageCloudinary(Storage):
    def _open(self, name, mode='rb'):
        # Les fichiers se lisent via leur URL (jamais via Django).
        raise NotImplementedError('Lecture via .url() (CDN Cloudinary).')

    def _save(self, name, content):
        cloudinary = _client()
        dossier = (os.path.dirname(name or '') or 'emsp').replace(os.sep, '/')
        base, ext = os.path.splitext(os.path.basename(name or 'fichier'))
        public_id = f"{dossier}/{base}_{uuid.uuid4().hex[:8]}"
        res = cloudinary.uploader.upload(
            content,
            public_id=public_id,
            resource_type='auto',
            unique_filename=False,
            overwrite=True,
        )
        return res.get('secure_url') or res.get('url') or name

    def delete(self, name):
        if not name or not str(name).startswith('http'):
            return
        try:
            cloudinary = _client()
            public_id = _public_id_depuis_url(str(name))
            if public_id:
                cloudinary.uploader.destroy(public_id, resource_type='image')
                cloudinary.uploader.destroy(public_id, resource_type='raw')
        except Exception:
            pass  # suppression best-effort : jamais bloquer le club

    def exists(self, name):
        return False  # chaque upload a un nom unique (uuid)

    def url(self, name):
        if name and str(name).startswith('http'):
            return str(name)
        from django.conf import settings
        return (settings.MEDIA_URL or '/media/') + str(name or '')

    def get_available_name(self, name, max_length=None):
        return name
