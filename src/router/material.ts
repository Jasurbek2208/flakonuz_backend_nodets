import express from 'express'
import multer from 'multer'

// Auth middleware
import { authMiddleware } from '../auth/authMiddleware'

const router = express.Router();
const upload = multer();

import { getMaterialsList, getCurrentMaterial, addCurrentMaterial, editCurrentMaterial, deleteCurrentMaterial, deleteManyMaterial } from '../controllers/materials';

// Materials routes
router.get('/list', getMaterialsList);
router.get('/list/:id', getCurrentMaterial);
router.post('/material', authMiddleware, upload.none(), addCurrentMaterial)
router.put('/material/:id', authMiddleware, upload.none(), editCurrentMaterial)
router.delete('/material/delete/:id', authMiddleware, deleteCurrentMaterial)
router.delete('/material/delete-many/:id', authMiddleware, deleteManyMaterial)

export default router;