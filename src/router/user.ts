import express from 'express'
import multer from 'multer'

// Auth
import { authMiddleware } from '../auth/authMiddleware'
import { deleteProfileImage, updateProfile, updateProfileImage, updateProfilePassword } from '../controllers/user'

const router = express.Router()

// Set up Multer for handling file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, 'src/uploads') // 'uploads' is the folder where files will be saved
  },
  filename: (_req, file, cb) => {
    cb(null, file.originalname)
  },
})

const upload = multer({ storage: storage })

router.delete('/profile-photo/:id', authMiddleware, deleteProfileImage)
router.put('/profile/:id', authMiddleware, upload.none(), updateProfile)
router.put('/profile-password/:id', authMiddleware, upload.none(), updateProfilePassword)
router.post('/profile-photo/:id', authMiddleware, upload.single('image'), updateProfileImage)

export default router