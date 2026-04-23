import prisma from '../lib/prisma.js';

export const createManyCards = async (cardsData) => {
    return await prisma.card.createMany({
        data: cardsData
    });
};

export const findRecentCardsByUserId = async (userId, takeCount) => {
    return await prisma.card.findMany({
        where: { userId },
        orderBy: { id: 'desc' },
        take: takeCount
    });
};

export const findDueCards = async (userId) => {
    return await prisma.card.findMany({
        where: {
            userId: userId,
            nextReviewDate: {
                lte: new Date()
            }
        },
        orderBy: {
            nextReviewDate: 'asc'
        }
    });
};

export const findCardById = async (id) => {
    return await prisma.card.findUnique({
        where: { id: id }
    });
};

export const updateReviewSchedule = async (id, reviewStage, nextReviewDate) => {
    return await prisma.card.update({
        where: { id: id },
        data: {
            reviewStage: reviewStage,
            nextReviewDate: nextReviewDate
        }
    });
};
