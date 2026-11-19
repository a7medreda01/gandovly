export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxBytes?: number;
  mimeType?: 'image/webp' | 'image/jpeg';
  enabled?: boolean;
}

const DEFAULT_MAX_BYTES = 150 * 1024;
const QUALITY_STEPS = [0.9, 0.84, 0.78, 0.72, 0.66, 0.6, 0.54, 0.48, 0.42, 0.36, 0.3];

/** Downscales and encodes an upload until it fits the storage ceiling. */
export async function compressImage(file: File, options: CompressionOptions = {}): Promise<File> {
  const {
    maxWidth = 1400,
    maxHeight = 1400,
    maxBytes = DEFAULT_MAX_BYTES,
    quality = 0.9,
    mimeType = 'image/webp',
    enabled = true
  } = options;

  if (enabled === false) {
    return file;
  }

  if (!file.type.startsWith('image/') || /svg|ico/i.test(file.type) || /\.(svg|ico)$/i.test(file.name)) {
    throw new Error('يرجى اختيار صورة نقطية PNG أو JPEG أو WebP.');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('تعذر قراءة الصورة.'));
      element.src = objectUrl;
    });

    let width = image.naturalWidth;
    let height = image.naturalHeight;
    if (!width || !height) throw new Error('أبعاد الصورة غير صالحة.');
    const initialScale = Math.min(1, maxWidth / width, maxHeight / height);
    width = Math.max(1, Math.round(width * initialScale));
    height = Math.max(1, Math.round(height * initialScale));

    while (Math.max(width, height) >= 32) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('تعذر تجهيز الصورة للضغط.');
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(image, 0, 0, width, height);

      const startQuality = Math.min(0.98, Math.max(0.3, quality));
      const qualities = [...new Set(QUALITY_STEPS.map(step => Math.max(0.24, startQuality - (0.9 - step))))];
      for (const candidateQuality of qualities) {
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mimeType, candidateQuality));
        if (!blob) continue;
        if (blob.size <= maxBytes) {
          const extension = blob.type === 'image/jpeg' ? '.jpg' : '.webp';
          const name = file.name.replace(/\.[^/.]+$/, '') + extension;
          return new File([blob], name, { type: blob.type, lastModified: file.lastModified });
        }
      }

      width = Math.max(1, Math.floor(width * 0.82));
      height = Math.max(1, Math.floor(height * 0.82));
    }

    throw new Error(`تعذر ضغط الصورة إلى ${Math.round(maxBytes / 1024)} كيلوبايت. جرّب صورة أبسط.`);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
