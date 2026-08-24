import multer from "multer";

// Use in-memory buffer storage for direct upload to Cloudinary
const storage = multer.memoryStorage();

 //Filter uploaded files to allow only image mime types

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

 //Multer upload middleware with 5MB file size limit
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

export default upload;
