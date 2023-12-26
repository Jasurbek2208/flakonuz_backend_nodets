import express from 'express'
import multer from 'multer'

// Auth middleware
import { authMiddleware } from '../auth/authMiddleware'

const router = express.Router();

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


import { getProductsList, getCurrentProduct, addCurrentProduct, editCurrentProduct, deleteCurrentProduct, deleteManyProducts } from '../controllers/products';

// Products routes
router.get('/list', getProductsList);
router.get('/list/:id', getCurrentProduct);
router.post('/product', authMiddleware, upload.single('image'), addCurrentProduct)
router.put('/product/:id', authMiddleware, upload.single('image'), editCurrentProduct)
router.delete('/product/delete/:id', authMiddleware, deleteCurrentProduct)
router.delete('/product/delete-many/:id', authMiddleware, deleteManyProducts)

export default router;