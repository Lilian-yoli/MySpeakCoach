import * as authService from '../services/authService.js';
import { logger } from '../utils/logger.js';

export const register = async (req, res) => {
    try {
        const { account, password } = req.body;
        if (!account?.trim() || !password) {
            return res.status(400).json({ success: false, message: 'account and password are required' });
        }
        logger.info('AUTH', 'Register attempt', { account: account.trim() });
        const result = await authService.register(account.trim(), password);
        logger.info('AUTH', 'Register success', { userId: result.user.id, account: result.user.account });
        return res.status(201).json({ success: true, ...result });
    } catch (error) {
        const status = error.message === 'Account already exists' ? 409
                     : error.message === 'Registration not allowed' ? 403
                     : 500;
        logger.warn('AUTH', 'Register failed', { account: req.body.account, reason: error.message });
        return res.status(status).json({ success: false, message: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { account, password } = req.body;
        if (!account?.trim() || !password) {
            return res.status(400).json({ success: false, message: 'account and password are required' });
        }
        logger.info('AUTH', 'Login attempt', { account: account.trim() });
        const result = await authService.login(account.trim(), password);
        logger.info('AUTH', 'Login success', { userId: result.user.id, account: result.user.account });
        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        const status = error.message === 'Invalid account or password' ? 401 : 500;
        logger.warn('AUTH', 'Login failed', { account: req.body.account, reason: error.message });
        return res.status(status).json({ success: false, message: error.message });
    }
};
