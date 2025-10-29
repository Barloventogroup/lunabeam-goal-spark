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

    // Use Base64 to ensure we get JPEG format that works in browsers
    const photo = await Camera.getPhoto({
      source: CameraSource.Photos,
      resultType: CameraResultType.Base64,
      quality: 85,
      correctOrientation: true,
      allowEditing: false,
    });

    if (!photo.base64String) {
      throw new Error('no_photo_data');
    }

    // Convert base64 to blob - this will be JPEG format
    const base64Response = await fetch(`data:image/jpeg;base64,${photo.base64String}`);
    const blob = await base64Response.blob();

    return { blob, ext: 'jpg' };
  } catch (error) {
    throw error;
  }
}
