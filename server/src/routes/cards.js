import express from 'express';
import { createBatchCards, getDueCards, reviewCard, refineAndCreateCards, listCards, deleteCard, editCard, suggestSentences, continueSentence } from '../controllers/cardsController.js';

const router = express.Router();

router.post('/batch', createBatchCards);
router.post('/refine', refineAndCreateCards);
router.post('/suggest', suggestSentences);
router.post('/continue', continueSentence);
router.get('/due', getDueCards);
router.get('/', listCards);
router.delete('/:id', deleteCard);
router.patch('/:id', editCard);
router.post('/:id/review', reviewCard);

export default router;
