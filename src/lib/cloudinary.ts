import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface UploadResult {
  url: string
  publicId: string
  width: number
  height: number
  format: string
  bytes: number
}

export interface UploadOptions {
  folder: string
  transformation?: Record<string, unknown>
  tags?: string[]
}

/**
 * Upload an image to Cloudinary
 * @param imageData - Base64 encoded image data or a URL
 * @param options - Upload options
 */
export async function uploadImage(
  imageData: string,
  options: UploadOptions
): Promise<UploadResult> {
  try {
    const result = await cloudinary.uploader.upload(imageData, {
      folder: options.folder,
      transformation: options.transformation,
      tags: options.tags,
      resource_type: 'image',
      // Optimize for web delivery
      quality: 'auto',
      fetch_format: 'auto',
    })

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw new Error('Failed to upload image to Cloudinary')
  }
}

/**
 * Upload multiple images to Cloudinary
 * @param images - Array of base64 encoded images
 * @param options - Upload options
 */
export async function uploadMultipleImages(
  images: string[],
  options: UploadOptions
): Promise<UploadResult[]> {
  const results = await Promise.all(
    images.map((image) => uploadImage(image, options))
  )
  return results
}

/**
 * Delete an image from Cloudinary
 * @param publicId - The public ID of the image to delete
 */
export async function deleteImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId)
  } catch (error) {
    console.error('Cloudinary delete error:', error)
    throw new Error('Failed to delete image from Cloudinary')
  }
}

/**
 * Delete multiple images from Cloudinary
 * @param publicIds - Array of public IDs to delete
 */
export async function deleteMultipleImages(publicIds: string[]): Promise<void> {
  try {
    await cloudinary.api.delete_resources(publicIds)
  } catch (error) {
    console.error('Cloudinary bulk delete error:', error)
    throw new Error('Failed to delete images from Cloudinary')
  }
}

/**
 * Get a transformation URL for an existing image
 * @param publicId - The public ID of the image
 * @param options - Transformation options
 */
export function getTransformedUrl(
  publicId: string,
  options: {
    width?: number
    height?: number
    crop?: string
    quality?: string | number
  }
): string {
  return cloudinary.url(publicId, {
    transformation: [
      {
        width: options.width,
        height: options.height,
        crop: options.crop || 'fill',
        quality: options.quality || 'auto',
        fetch_format: 'auto',
      },
    ],
  })
}

// Re-export for advanced usage
export { cloudinary }
