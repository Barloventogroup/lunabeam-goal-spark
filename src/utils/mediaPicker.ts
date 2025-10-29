import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export async function pickAvatarBlob(): Promise<{ blob: Blob; ext: string } | null> {
  if (!Capacitor.isNativePlatform()) {
    return null;
  }

  try {
    const perms = await Camera.checkPermissions();
    
    if (perms.photos !== 'granted' && perms.photos !== 'limited') {
      const req = await Camera.requestPermissions({ permissions: ['photos'] });
      if (req.photos !== 'granted' && req.photos !== 'limited') {
        throw new Error('photos_denied');
      }
    }

    const photo = await Camera.getPhoto({
      source: CameraSource.Photos,
      resultType: CameraResultType.Uri,
      quality: 85,
      correctOrientation: true,
      allowEditing: false,
    });

    const url = photo.webPath || photo.path;
    if (!url) {
      throw new Error('no_photo_url');
    }

    const res = await fetch(url);
    const blob = await res.blob();

    // Prefer JPEG for broad browser support
    const ext = 'jpg';
    return { blob, ext };
  } catch (error) {
    throw error;
  }
}
