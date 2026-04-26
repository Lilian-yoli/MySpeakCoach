import * as authService from '../services/authService.js';

export const register = async (req, res) => {
    try {
        const { account, password } = req.body;
        if (!account?.trim() || !password) {
            return res.status(400).json({ success: false, message: 'account and password are required' });
        }
        const result = await authService.register(account.trim(), password);
        return res.status(201).json({ success: true, ...result });
    } catch (error) {
        const status = error.message === 'Account already exists' ? 409 : 500;
        return res.status(status).json({ success: false, message: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { account, password } = req.body;
        if (!account?.trim() || !password) {
            return res.status(400).json({ success: false, message: 'account and password are required' });
        }
        const result = await authService.login(account.trim(), password);
        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        const status = error.message === 'Invalid account or password' ? 401 : 500;
        return res.status(status).json({ success: false, message: error.message });
    }
};
