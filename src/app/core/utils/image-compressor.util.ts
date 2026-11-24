export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxBytes?: number;
  mimeType?: 'image/webp' | 'image/jpeg';
  enabled?: boolean;
}

const DEFAULT_MAX_BYTES = 150 * 1024;
const HIGH_QUALITY_STEPS = [0.92, 0.88, 0.84, 0.8, 0.76];
const FALLBACK_QUALITY_STEPS = [0.7, 0.64, 0.58];
const WEB_SAFE_TYPES = new Set(['image/webp', 'image/jpeg', 'image/png', 'image/avif', 'image/gif']);

/**
 * Compresses and converts an image only if it exceeds `maxBytes`,
 * preserving visual quality by prioritizing resolution balance over aggressive quality loss.
 */
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

  // Skip compression completely when the original web-safe image is already within the allowed limit.
  if (file.size <= maxBytes && WEB_SAFE_TYPES.has(file.type.toLowerCase())) {
    return file;
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

    const startQuality = Math.min(0.96, Math.max(0.76, quality));
    const highQualities = [...new Set([startQuality, ...HIGH_QUALITY_STEPS.filter(q => q <= startQuality)])];

    while (Math.max(width, height) >= 32) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('تعذر تجهيز الصورة للضغط.');
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(image, 0, 0, width, height);

      const candidateQualities = Math.max(width, height) <= 600
        ? [...highQualities, ...FALLBACK_QUALITY_STEPS]
        : highQualities;

      for (const candidateQuality of candidateQualities) {
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mimeType, candidateQuality));
        if (!blob) continue;
        if (blob.size <= maxBytes) {
          const extension = blob.type === 'image/jpeg' ? '.jpg' : '.webp';
          const name = file.name.replace(/\.[^/.]+$/, '') + extension;
          return new File([blob], name, { type: blob.type, lastModified: file.lastModified });
        }
      }

      // Gently downscale dimensions while keeping high visual quality
      width = Math.max(1, Math.floor(width * 0.85));
      height = Math.max(1, Math.floor(height * 0.85));
    }

    throw new Error(`تعذر ضغط الصورة إلى ${Math.round(maxBytes / 1024)} كيلوبايت. جرّب صورة أبسط.`);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
