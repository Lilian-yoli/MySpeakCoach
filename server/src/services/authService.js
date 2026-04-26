import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as userRepository from '../repositories/userRepository.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_EXPIRES_IN = '7d';

export const register = async (account, password) => {
    const existing = await userRepository.findByAccount(account);
    if (existing) throw new Error('Account already exists');

    const hashed = await bcrypt.hash(password, 10);
    const user = await userRepository.createUser(account, hashed);
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return { token, user: { id: user.id, account: user.account } };
};

export const login = async (account, password) => {
    const user = await userRepository.findByAccount(account);
    if (!user) throw new Error('Invalid account or password');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('Invalid account or password');

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return { token, user: { id: user.id, account: user.account } };
};
