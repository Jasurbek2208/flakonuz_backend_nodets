import express from 'express'
import multer from 'multer';

// Auth middleware
import { authMiddleware } from '../auth/authMiddleware'

import { getAboutSettings, sendFeedback, updateAboutSettings, getCompanyNews, getCurrentCompanyNews, deleteCurrentNews, deleteManyCompanyNews, editCurrentCompanyNews, addCurrentCompanyNews, getStatistics } from '../controllers/about'

const router = express.Router()

// Set up Multer for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'src/uploads') // 'uploads' is the folder where files will be saved
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  },
})

const upload = multer({ storage: storage })

// About routes
router.get('/', getAboutSettings)
router.post('/feedback', upload.none(), sendFeedback)
router.put('/update/:id', authMiddleware, upload.none(), updateAboutSettings)

// Company news routes
router.get('/news/list', getCompanyNews)
router.get('/news/:id', getCurrentCompanyNews)
router.post('/news', authMiddleware, upload.single('image'), addCurrentCompanyNews)
router.put('/news/:id', authMiddleware, upload.single('image'), editCurrentCompanyNews)
router.delete('/news/delete/:id', authMiddleware, deleteCurrentNews)
router.delete('/product/delete-many/:id', authMiddleware, deleteManyCompanyNews)

// Statictics routes
router.get('/statistics', authMiddleware, getStatistics)

export default router