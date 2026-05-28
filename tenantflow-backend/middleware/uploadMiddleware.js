import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images, videos, and audio
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /\.(jpeg|jpg|png|gif|mp4|mov|avi|webm|pdf|mp3|wav|m4a|aac|ogg|flac)$/i;
  const extname = allowedExtensions.test(file.originalname.toLowerCase());
  
  // Check MIME type
  const isImage = file.mimetype.startsWith('image/');
  const isVideo = file.mimetype.startsWith('video/');
  const isAudio = file.mimetype.startsWith('audio/');
  const isPDF = file.mimetype === 'application/pdf';
  
  if (extname && (isImage || isVideo || isAudio || isPDF)) {
    return cb(null, true);
  } else {
    cb(new Error("Only image, video, audio, and PDF files are allowed"));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

export default upload;
