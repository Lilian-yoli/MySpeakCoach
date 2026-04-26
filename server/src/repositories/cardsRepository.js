import prisma from '../lib/prisma.js';

export const createManyCards = async (cardsData) => {
    return await prisma.card.createMany({ data: cardsData });
};

export const findRecentCardsByUserId = async (userId, takeCount) => {
    return await prisma.card.findMany({
        where: { userId },
        orderBy: { id: 'desc' },
        take: takeCount,
    });
};

export const findDueCards = async (userId, language) => {
    return await prisma.card.findMany({
        where: {
            userId,
            language,
            nextReviewDate: { lte: new Date() },
        },
        orderBy: { nextReviewDate: 'asc' },
    });
};

export const findCardById = async (id) => {
    return await prisma.card.findUnique({ where: { id } });
};

export const updateReviewSchedule = async (id, reviewStage, nextReviewDate) => {
    return await prisma.card.update({
        where: { id },
        data: { reviewStage, nextReviewDate },
    });
};

export const findAllCardsByUserId = async (userId, language) => {
    return await prisma.card.findMany({
        where: { userId, language },
        orderBy: [{ createdAt: 'desc' }, { cardType: 'asc' }],
    });
};

export const deleteCardsByOriginalText = async (originalText, userId) => {
    return await prisma.card.deleteMany({ where: { originalText, userId } });
};

export const updateCardContent = async (id, question, answer) => {
    return await prisma.card.update({
        where: { id },
        data: { question, answer },
    });
};

export const updateGroupLanguage = async (originalText, userId, language) => {
    return await prisma.card.updateMany({
        where: { originalText, userId },
        data: { language },
    });
};
