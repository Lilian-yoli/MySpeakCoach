import * as cardsService from '../services/cardsService.js';

export const createBatchCards = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { inputs } = req.body;
        
        if (!inputs || !Array.isArray(inputs) || inputs.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or empty inputs array' });
        }

        // Delegate business logic to service layer
        const savedCards = await cardsService.processBatchTranslation(inputs, userId);

        // Controller exclusively handles HTTP response formatting
        return res.status(200).json({
            success: true,
            count: savedCards.length,
            data: savedCards
        });

    } catch (error) {
        console.error("Batch Creation Error:", error);
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

export const getDueCards = async (req, res) => {
    try {
        const userId = req.user?.id;
        const dueCards = await cardsService.fetchDueCards(userId);
        
        return res.status(200).json({
            success: true,
            data: dueCards
        });
    } catch (error) {
        console.error("Get Due Cards Error:", error);
        return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
};

export const reviewCard = async (req, res) => {
    try {
        const userId = req.user?.id;
        const cardId = parseInt(req.params.id, 10);
        
        if (isNaN(cardId)) {
            return res.status(400).json({ success: false, message: 'Invalid card ID format' });
        }

        const updatedCard = await cardsService.processCardReview(cardId, userId);
        
        return res.status(200).json({
            success: true,
            card: updatedCard
        });
    } catch (error) {
        console.error("Review Card Error:", error);
        const statusCode = (error.message === 'Card not found' || error.message === 'Unauthorized') ? 403 : 500;
        return res.status(statusCode).json({ success: false, message: error.message });
    }
};
