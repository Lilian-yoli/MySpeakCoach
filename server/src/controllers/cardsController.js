import * as cardsService from '../services/cardsService.js';
import { logger } from '../utils/logger.js';

const getLang = (req) => req.query.lang || req.body.language || 'en';

export const createBatchCards = async (req, res) => {
    try {
        const { inputs, language } = req.body;
        if (!inputs || !Array.isArray(inputs) || inputs.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or empty inputs array' });
        }
        if (inputs.length > 10) {
            return res.status(400).json({ success: false, message: 'inputs must contain 1–10 items per request.' });
        }
        if (inputs.some(s => typeof s !== 'string' || s.trim().length === 0 || s.length > 500)) {
            return res.status(400).json({ success: false, message: 'Each input must be a non-empty string under 500 characters.' });
        }
        logger.info('CARDS', 'Batch create start', { userId: req.user?.id, count: inputs.length, language: language || 'en' });
        const savedCards = await cardsService.processBatchTranslation(inputs, req.user?.id, language || 'en');
        logger.info('CARDS', 'Batch create done', { userId: req.user?.id, savedCount: savedCards.length });
        return res.status(200).json({ success: true, count: savedCards.length, data: savedCards });
    } catch (error) {
        logger.error('CARDS', 'Batch create error', { userId: req.user?.id, error: error.message });
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

export const getDueCards = async (req, res) => {
    try {
        const dueCards = await cardsService.fetchDueCards(req.user?.id, getLang(req));
        logger.debug('CARDS', 'Due cards fetched', { userId: req.user?.id, count: dueCards.length, lang: getLang(req) });
        return res.status(200).json({ success: true, data: dueCards });
    } catch (error) {
        logger.error('CARDS', 'Get due cards error', { userId: req.user?.id, error: error.message });
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

export const listCards = async (req, res) => {
    try {
        const cards = await cardsService.fetchAllCards(req.user?.id, getLang(req));
        logger.debug('CARDS', 'List cards fetched', { userId: req.user?.id, count: cards.length, lang: getLang(req) });
        return res.status(200).json({ success: true, data: cards });
    } catch (error) {
        logger.error('CARDS', 'List cards error', { userId: req.user?.id, error: error.message });
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

export const deleteCard = async (req, res) => {
    try {
        const cardId = parseInt(req.params.id, 10);
        if (isNaN(cardId)) return res.status(400).json({ success: false, message: 'Invalid card ID' });
        await cardsService.deleteCardGroup(cardId, req.user?.id);
        logger.info('CARDS', 'Card group deleted', { userId: req.user?.id, cardId });
        return res.status(200).json({ success: true });
    } catch (error) {
        const statusCode = ['Card not found', 'Unauthorized'].includes(error.message) ? 403 : 500;
        logger.warn('CARDS', 'Delete card failed', { userId: req.user?.id, cardId: req.params.id, reason: error.message });
        return res.status(statusCode).json({ success: false, message: error.message });
    }
};

export const editCard = async (req, res) => {
    try {
        const cardId = parseInt(req.params.id, 10);
        if (isNaN(cardId)) return res.status(400).json({ success: false, message: 'Invalid card ID' });
        const { question, answer } = req.body;
        if (!question || !answer) return res.status(400).json({ success: false, message: 'question and answer are required' });
        const updated = await cardsService.updateCard(cardId, question, answer, req.user?.id);
        logger.info('CARDS', 'Card edited', { userId: req.user?.id, cardId });
        return res.status(200).json({ success: true, card: updated });
    } catch (error) {
        const statusCode = ['Card not found', 'Unauthorized'].includes(error.message) ? 403 : 500;
        logger.warn('CARDS', 'Edit card failed', { userId: req.user?.id, cardId: req.params.id, reason: error.message });
        return res.status(statusCode).json({ success: false, message: error.message });
    }
};

export const refineAndCreateCards = async (req, res) => {
    try {
        const { utterances, language } = req.body;
        if (!utterances || !Array.isArray(utterances) || utterances.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or empty utterances array' });
        }
        if (utterances.length > 20) {
            return res.status(400).json({ success: false, message: 'utterances must contain 1–20 items per request.' });
        }
        if (utterances.some(s => typeof s !== 'string' || s.trim().length === 0 || s.length > 1000)) {
            return res.status(400).json({ success: false, message: 'Each utterance must be a non-empty string under 1000 characters.' });
        }
        logger.info('CARDS', 'Refine start', { userId: req.user?.id, count: utterances.length, language: language || 'en' });
        const result = await cardsService.processLiveRefinement(utterances, req.user?.id, language || 'en');
        logger.info('CARDS', 'Refine done', { userId: req.user?.id, pairsCount: result.pairs.length, cardsCreated: result.savedCards.length });
        return res.status(200).json({ success: true, pairs: result.pairs, cardsCreated: result.savedCards.length });
    } catch (error) {
        logger.error('CARDS', 'Refine error', { userId: req.user?.id, error: error.message });
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

export const suggestSentences = async (req, res) => {
    try {
        const { query, language } = req.body;
        if (!query || !query.trim()) {
            return res.status(400).json({ success: false, message: 'query is required' });
        }
        if (query.length > 200) {
            return res.status(400).json({ success: false, message: 'query must be under 200 characters.' });
        }
        logger.info('CARDS', 'Suggest start', { userId: req.user?.id, language: language || 'en' });
        const suggestions = await cardsService.generateSentenceSuggestions(query.trim(), language || 'en');
        logger.info('CARDS', 'Suggest done', { userId: req.user?.id, count: suggestions.length });
        return res.status(200).json({ success: true, suggestions });
    } catch (error) {
        logger.error('CARDS', 'Suggest error', { userId: req.user?.id, error: error.message });
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

export const continueSentence = async (req, res) => {
    try {
        const { sentence, language } = req.body;
        if (!sentence || !sentence.trim()) {
            return res.status(400).json({ success: false, message: 'sentence is required' });
        }
        if (sentence.length > 500) {
            return res.status(400).json({ success: false, message: 'sentence must be under 500 characters.' });
        }
        logger.info('CARDS', 'Continue start', { userId: req.user?.id, language: language || 'en' });
        const continuations = await cardsService.generateContinuations(sentence.trim(), language || 'en');
        logger.info('CARDS', 'Continue done', { userId: req.user?.id, count: continuations.length });
        return res.status(200).json({ success: true, continuations });
    } catch (error) {
        logger.error('CARDS', 'Continue error', { userId: req.user?.id, error: error.message });
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

export const moveGroupLanguage = async (req, res) => {
    try {
        const { originalText, language } = req.body;
        if (!originalText || !language) {
            return res.status(400).json({ success: false, message: 'originalText and language are required' });
        }
        await cardsService.moveCardGroupLanguage(originalText, language, req.user?.id);
        logger.info('CARDS', 'Group language moved', { userId: req.user?.id, newLanguage: language });
        return res.status(200).json({ success: true });
    } catch (error) {
        logger.error('CARDS', 'Move group language error', { userId: req.user?.id, error: error.message });
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const reviewCard = async (req, res) => {
    try {
        const cardId = parseInt(req.params.id, 10);
        if (isNaN(cardId)) {
            return res.status(400).json({ success: false, message: 'Invalid card ID format' });
        }
        const updatedCard = await cardsService.processCardReview(cardId, req.user?.id);
        logger.debug('CARDS', 'Card reviewed', { userId: req.user?.id, cardId, newStage: updatedCard.reviewStage });
        return res.status(200).json({ success: true, card: updatedCard });
    } catch (error) {
        const statusCode = ['Card not found', 'Unauthorized'].includes(error.message) ? 403 : 500;
        logger.warn('CARDS', 'Review card failed', { userId: req.user?.id, cardId: req.params.id, reason: error.message });
        return res.status(statusCode).json({ success: false, message: error.message });
    }
};
