import prisma from '../lib/prisma.js';

export const findByUserId = async (userId) => {
    return await prisma.userLanguage.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
    });
};

export const addLanguage = async (userId, language) => {
    return await prisma.userLanguage.upsert({
        where: { userId_language: { userId, language } },
        update: {},
        create: { userId, language },
    });
};

export const removeLanguage = async (userId, language) => {
    return await prisma.userLanguage.deleteMany({
        where: { userId, language },
    });
};
