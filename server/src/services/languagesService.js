import * as languagesRepository from '../repositories/languagesRepository.js';
import { LANG_NAMES } from '../utils/languages.js';

export const getUserLanguages = async (userId) => {
    const rows = await languagesRepository.findByUserId(userId);
    return rows.map(r => r.language);
};

export const addLanguage = async (userId, language) => {
    if (!LANG_NAMES[language]) throw new Error('Unsupported language');
    return await languagesRepository.addLanguage(userId, language);
};

export const removeLanguage = async (userId, language) => {
    return await languagesRepository.removeLanguage(userId, language);
};
