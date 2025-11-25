const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class CloudinaryService {
  /**
   * Upload image to Cloudinary
   * @param {string} base64Image - Base64 encoded image string
   * @param {string} folder - Folder name in Cloudinary (default: 'products')
   * @returns {Promise<object>} - Upload result with url and public_id
   */
  async uploadImage(base64Image, folder = "products") {
    try {
      const result = await cloudinary.uploader.upload(base64Image, {
        folder: folder,
        resource_type: "image",
        transformation: [
          { width: 800, height: 800, crop: "limit" }, // Max 800x800
          { quality: "auto" }, // Auto quality
          { fetch_format: "auto" }, // Auto format (webp jika support)
        ],
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new Error("Gagal mengupload gambar");
    }
  }

  /**
   * Upload image from buffer (multer)
   * @param {Buffer} buffer - Image buffer from multer
   * @param {string} folder - Folder name in Cloudinary (default: 'products')
   * @returns {Promise<object>} - Upload result with url and public_id
   */
  async uploadFromBuffer(buffer, folder = "products") {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: "image",
          transformation: [
            { width: 800, height: 800, crop: "limit" },
            { quality: "auto" },
            { fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(new Error("Gagal mengupload gambar"));
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        }
      );

      uploadStream.end(buffer);
    });
  }

  /**
   * Delete image from Cloudinary
   * @param {string} publicId - Public ID of the image
   * @returns {Promise<object>} - Delete result
   */
  async deleteImage(publicId) {
    try {
      if (!publicId) return null;

      const result = await cloudinary.uploader.destroy(publicId);
      return result;
    } catch (error) {
      console.error("Cloudinary delete error:", error);
      // Don't throw error, just log it
      return null;
    }
  }

  /**
   * Extract public_id from Cloudinary URL
   * @param {string} imageUrl - Cloudinary image URL
   * @returns {string|null} - Public ID or null
   */
  extractPublicId(imageUrl) {
    try {
      if (!imageUrl || !imageUrl.includes("cloudinary.com")) {
        return null;
      }

      // Example URL: https://res.cloudinary.com/demo/image/upload/v1234567890/products/abc123.jpg
      // Extract: products/abc123
      const parts = imageUrl.split("/upload/");
      if (parts.length < 2) return null;

      const pathParts = parts[1].split("/");
      // Remove version (v1234567890) if exists
      const relevantParts = pathParts.filter(
        (part) => !part.startsWith("v") || isNaN(part.substring(1))
      );

      // Join folder and filename, remove extension
      const publicId = relevantParts.join("/").replace(/\.[^/.]+$/, "");
      return publicId;
    } catch (error) {
      console.error("Error extracting public_id:", error);
      return null;
    }
  }

  /**
   * Replace image: delete old and upload new
   * @param {string} newBase64Image - New base64 image
   * @param {string} oldImageUrl - Old Cloudinary URL to delete
   * @param {string} folder - Folder name
   * @returns {Promise<object>} - New image data
   */
  async replaceImage(newBase64Image, oldImageUrl, folder = "products") {
    try {
      // Upload new image first
      const newImage = await this.uploadImage(newBase64Image, folder);

      // Delete old image if exists
      if (oldImageUrl) {
        const oldPublicId = this.extractPublicId(oldImageUrl);
        if (oldPublicId) {
          await this.deleteImage(oldPublicId);
        }
      }

      return newImage;
    } catch (error) {
      throw error;
    }
  }
  /**
   * Replace image from buffer: delete old and upload new
   * @param {Buffer} buffer - New image buffer
   * @param {string} oldImageUrl - Old Cloudinary URL to delete
   * @param {string} folder - Folder name
   * @returns {Promise<object>} - New image data
   */
  async replaceImageFromBuffer(buffer, oldImageUrl, folder = "products") {
    try {
      // Upload new image first
      const newImage = await this.uploadFromBuffer(buffer, folder);

      // Delete old image if exists
      if (oldImageUrl) {
        const oldPublicId = this.extractPublicId(oldImageUrl);
        if (oldPublicId) {
          await this.deleteImage(oldPublicId);
        }
      }

      return newImage;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new CloudinaryService();
