import express from 'express';
import { getTTS } from '../controllers/ttsController.js';

const router = express.Router();

router.get('/', getTTS);

export default router;
