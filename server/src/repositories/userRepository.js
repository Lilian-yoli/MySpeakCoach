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
