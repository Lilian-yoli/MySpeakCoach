import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export const authenticate = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        logger.warn('AUTH', 'Missing token', { path: req.path, method: req.method });
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const token = header.slice(7);
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = { id: payload.userId };
        next();
    } catch (err) {
        logger.warn('AUTH', 'Invalid or expired token', { path: req.path, reason: err.message });
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};
