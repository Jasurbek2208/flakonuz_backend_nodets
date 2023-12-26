import express from 'express'
import multer from 'multer'

// Auth middleware
import { authMiddleware } from '../auth/authMiddleware'

const router = express.Router();
const upload = multer();

import { getColorsList, getCurrentColor, addCurrentColor, editCurrentColor, deleteCurrentColor, deleteManyColor } from '../controllers/colors';

// Colors routes
router.get('/list', getColorsList);
router.get('/list/:id', getCurrentColor);
router.post('/color', authMiddleware, upload.none(), addCurrentColor)
router.put('/color/:id', authMiddleware, upload.none(), editCurrentColor)
router.delete('/color/delete/:id', authMiddleware, deleteCurrentColor)
router.delete('/color/delete-many/:id', authMiddleware, deleteManyColor)

export default router;