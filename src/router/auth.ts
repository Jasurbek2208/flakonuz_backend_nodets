import express from 'express'
import multer from 'multer'

// Auth
import { login, userme } from '../auth';

const router = express.Router();
const upload = multer();

router.get('/userme', userme);
router.post('/login', upload.none(), login);

export default router;