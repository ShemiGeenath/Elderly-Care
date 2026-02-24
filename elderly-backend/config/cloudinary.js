// config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure storage for profile photos
const profilePhotoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'eldercare/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }],
    public_id: (req, file) => `profile-${req.user.id}-${Date.now()}`
  }
});

// Configure storage for cover photos
const coverPhotoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'eldercare/covers',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 1500, height: 500, crop: 'limit' }],
    public_id: (req, file) => `cover-${req.user.id}-${Date.now()}`
  }
});

// Configure storage for post media
const postMediaStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'eldercare/posts',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov'],
    resource_type: 'auto',
    public_id: (req, file) => `post-${req.user.id}-${Date.now()}`
  }
});

// Create multer upload instances
const uploadProfilePhoto = multer({ storage: profilePhotoStorage });
const uploadCoverPhoto = multer({ storage: coverPhotoStorage });
const uploadPostMedia = multer({ storage: postMediaStorage });

module.exports = {
  cloudinary,
  uploadProfilePhoto,
  uploadCoverPhoto,
  uploadPostMedia
};