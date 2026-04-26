import * as languagesService from '../services/languagesService.js';

export const getLanguages = async (req, res) => {
    try {
        const languages = await languagesService.getUserLanguages(req.user.id);
        return res.status(200).json({ success: true, languages });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const addLanguage = async (req, res) => {
    try {
        const { language } = req.body;
        if (!language) return res.status(400).json({ success: false, message: 'language is required' });
        await languagesService.addLanguage(req.user.id, language);
        return res.status(201).json({ success: true });
    } catch (error) {
        const status = error.message === 'Unsupported language' ? 400 : 500;
        return res.status(status).json({ success: false, message: error.message });
    }
};

export const removeLanguage = async (req, res) => {
    try {
        await languagesService.removeLanguage(req.user.id, req.params.code);
        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
