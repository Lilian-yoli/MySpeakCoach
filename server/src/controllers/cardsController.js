import * as cardsService from '../services/cardsService.js';

const getLang = (req) => req.query.lang || req.body.language || 'en';

export const createBatchCards = async (req, res) => {
    try {
        const { inputs, language } = req.body;
        if (!inputs || !Array.isArray(inputs) || inputs.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or empty inputs array' });
        }
        const savedCards = await cardsService.processBatchTranslation(inputs, req.user?.id, language || 'en');
        return res.status(200).json({ success: true, count: savedCards.length, data: savedCards });
    } catch (error) {
        console.error("Batch Creation Error:", error);
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

export const getDueCards = async (req, res) => {
    try {
        const dueCards = await cardsService.fetchDueCards(req.user?.id, getLang(req));
        return res.status(200).json({ success: true, data: dueCards });
    } catch (error) {
        console.error("Get Due Cards Error:", error);
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

export const listCards = async (req, res) => {
    try {
        const cards = await cardsService.fetchAllCards(req.user?.id, getLang(req));
        return res.status(200).json({ success: true, data: cards });
    } catch (error) {
        console.error("List Cards Error:", error);
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

export const deleteCard = async (req, res) => {
    try {
        const cardId = parseInt(req.params.id, 10);
        if (isNaN(cardId)) return res.status(400).json({ success: false, message: 'Invalid card ID' });
        await cardsService.deleteCardGroup(cardId, req.user?.id);
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Delete Card Error:", error);
        const statusCode = ['Card not found', 'Unauthorized'].includes(error.message) ? 403 : 500;
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
        return res.status(200).json({ success: true, card: updated });
    } catch (error) {
        console.error("Edit Card Error:", error);
        const statusCode = ['Card not found', 'Unauthorized'].includes(error.message) ? 403 : 500;
        return res.status(statusCode).json({ success: false, message: error.message });
    }
};

export const refineAndCreateCards = async (req, res) => {
    try {
        const { utterances, language } = req.body;
        if (!utterances || !Array.isArray(utterances) || utterances.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or empty utterances array' });
        }
        const result = await cardsService.processLiveRefinement(utterances, req.user?.id, language || 'en');
        return res.status(200).json({ success: true, pairs: result.pairs, cardsCreated: result.savedCards.length });
    } catch (error) {
        console.error("Refine Cards Error:", error);
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

export const suggestSentences = async (req, res) => {
    try {
        const { query, language } = req.body;
        if (!query || !query.trim()) {
            return res.status(400).json({ success: false, message: 'query is required' });
        }
        const suggestions = await cardsService.generateSentenceSuggestions(query.trim(), language || 'en');
        return res.status(200).json({ success: true, suggestions });
    } catch (error) {
        console.error("Suggest Sentences Error:", error);
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

export const continueSentence = async (req, res) => {
    try {
        const { sentence, language } = req.body;
        if (!sentence || !sentence.trim()) {
            return res.status(400).json({ success: false, message: 'sentence is required' });
        }
        const continuations = await cardsService.generateContinuations(sentence.trim(), language || 'en');
        return res.status(200).json({ success: true, continuations });
    } catch (error) {
        console.error("Continue Sentence Error:", error);
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
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error("Move Group Language Error:", error);
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
        return res.status(200).json({ success: true, card: updatedCard });
    } catch (error) {
        console.error("Review Card Error:", error);
        const statusCode = ['Card not found', 'Unauthorized'].includes(error.message) ? 403 : 500;
        return res.status(statusCode).json({ success: false, message: error.message });
    }
};
