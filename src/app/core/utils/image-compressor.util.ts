export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0 to 1.0 (default 0.85)
  mimeType?: 'image/webp' | 'image/jpeg';
}

/**
 * Compresses an image file on the client side using HTML5 Canvas.
 * Converts to WebP format with high-quality bicubic downscaling.
 * Visually lossless while reducing 4MB-10MB camera shots down to ~80-150 KB.
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 1400,
    maxHeight = 1400,
    quality = 0.85,
    mimeType = 'image/webp'
  } = options;

  // 1. Skip non-raster or non-image files
  if (!file.type || !file.type.startsWith('image/')) {
    return file;
  }

  // Skip SVGs and Icons (lossless vector/icons)
  if (file.type.includes('svg') || file.type.includes('ico') || file.name.endsWith('.svg') || file.name.endsWith('.ico')) {
    return file;
  }

  // 2. Load image onto HTMLImageElement
  return new Promise<File>((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Don't upscale smaller images
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Create offscreen canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback to original if canvas context unavailable
        resolve(file);
        return;
      }

      // Premium rendering settings for crisp food photos
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Attempt WebP export first
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            // If WebP export failed, fallback to JPEG
            canvas.toBlob(
              (fallbackBlob) => {
                if (!fallbackBlob || fallbackBlob.size >= file.size) {
                  resolve(file);
                  return;
                }
                const newName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
                resolve(new File([fallbackBlob], newName, { type: 'image/jpeg' }));
              },
              'image/jpeg',
              quality
            );
            return;
          }

          // If compression didn't save space (rare), keep original
          if (blob.size >= file.size) {
            resolve(file);
            return;
          }

          // Generate .webp file
          const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
          const compressedFile = new File([blob], cleanName, { type: 'image/webp' });

          const savedPercent = Math.round(((file.size - blob.size) / file.size) * 100);
          console.log(
            `[ImageCompressor] "${file.name}" (${(file.size / 1024).toFixed(1)} KB) -> "${cleanName}" (${(blob.size / 1024).toFixed(1)} KB) [${savedPercent}% saved]`
          );

          resolve(compressedFile);
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // Fallback on error
      resolve(file);
    };

    img.src = objectUrl;
  });
}
