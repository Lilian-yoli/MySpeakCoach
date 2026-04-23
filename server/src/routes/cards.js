import express from 'express';
import { createBatchCards, getDueCards, reviewCard } from '../controllers/cardsController.js';

const router = express.Router();

router.post('/batch', createBatchCards);
router.get('/due', getDueCards);
router.post('/:id/review', reviewCard);

export default router;
