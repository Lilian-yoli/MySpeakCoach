import prisma from '../lib/prisma.js';

export const upsertTestUser = async () => {
    return await prisma.user.upsert({
        where: { account: 'testuser' },
        update: {},
        create: {
            account: 'testuser',
            password: 'test_hashed_password'
        }
    });
};

export const findByAccount = async (account) => {
    return await prisma.user.findUnique({ where: { account } });
};

export const createUser = async (account, hashedPassword) => {
    return await prisma.user.create({
        data: { account, password: hashedPassword }
    });
};
