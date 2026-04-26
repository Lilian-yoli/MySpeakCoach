export const LANG_NAMES = {
    en: 'English',
    ja: 'Japanese',
    fr: 'French',
    ko: 'Korean',
    es: 'Spanish',
    de: 'German',
};

export const getLangName = (code) => LANG_NAMES[code] ?? 'English';
