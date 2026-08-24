import cloudinary from "../config/cloudinary.js";
import { Readable } from "stream";

/**
 * Uploads user profile image buffer to Cloudinary media storage
 * @param {Buffer} fileBuffer Image binary buffer
 * @param {string} fileName Target public identifier name
 */
export const uploadProfileImage = async (fileBuffer, fileName) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "edutracker/profiles",
        public_id: fileName,
        resource_type: "auto",
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          reject(error);
        } else {
          console.log("Cloudinary upload success:", result.secure_url);
          resolve(result);
        }
      }
    );

    // Convert buffer to stream and pipe directly to Cloudinary
    const readable = Readable.from(fileBuffer);
    readable.pipe(stream);
  });
};

/**
 * Deletes an existing profile image asset from Cloudinary
 * @param {string} publicId Cloudinary public image ID
 */
export const deleteProfileImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Image deleted from Cloudinary:", publicId);
    return result;
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    throw error;
  }
};
