import { Router } from 'express';
import { verifyAccessToken } from '../middleware/auth.middleware.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

router.use(verifyAccessToken);

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const base64Data = req.file.buffer.toString('base64');
    const dataUri = `data:${req.file.mimetype};base64,${base64Data}`;
    res.json({ message: 'File uploaded successfully', url: dataUri });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 500 });
  }
});

export default router;
