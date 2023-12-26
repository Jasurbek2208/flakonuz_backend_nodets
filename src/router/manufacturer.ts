import express from 'express'
import multer from 'multer'

// Auth middleware
import { authMiddleware } from '../auth/authMiddleware'

const router = express.Router();
const upload = multer();

import { getManufacturerList, getCurrentManufacturer, addCurrentManufacturer, editCurrentManufacturer, deleteCurrentManufacturer, deleteManyManufacturer } from '../controllers/manufacturer';

// Manufacturers routes
router.get('/list', getManufacturerList);
router.get('/list/:id', getCurrentManufacturer);
router.post('/manufacturer', authMiddleware, upload.none(), addCurrentManufacturer)
router.put('/manufacturer/:id', authMiddleware, upload.none(), editCurrentManufacturer)
router.delete('/manufacturer/delete/:id', authMiddleware, deleteCurrentManufacturer)
router.delete('/manufacturer/delete-many/:id', authMiddleware, deleteManyManufacturer)

export default router;