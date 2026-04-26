import express from 'express';
import { getLanguages, addLanguage, removeLanguage } from '../controllers/languagesController.js';

const router = express.Router();

router.get('/', getLanguages);
router.post('/', addLanguage);
router.delete('/:code', removeLanguage);

export default router;
