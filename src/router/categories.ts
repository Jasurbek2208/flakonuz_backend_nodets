import express from 'express'
import multer from 'multer'

// Auth middleware
import { authMiddleware } from '../auth/authMiddleware'

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

import { getCategoriesList, getCurrentCategory, addCurrentCategory, editCurrentCategory, deleteCurrentCategory, deleteManyCategories } from '../controllers/categories'

// Categories routes
router.get('/list', getCategoriesList)
router.get('/list/:id', getCurrentCategory)
router.post('/category', authMiddleware, upload.single('image'), addCurrentCategory)
router.put('/category/:id', authMiddleware, upload.single('image'), editCurrentCategory)
router.delete('/category/delete/:id', authMiddleware, deleteCurrentCategory)
router.delete('/category/delete-many/:id',authMiddleware, deleteManyCategories)

export default router