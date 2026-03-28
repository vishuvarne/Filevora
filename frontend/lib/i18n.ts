export const i18n = {
    defaultLocale: 'en',
    locales: ['en', 'es', 'de', 'fr', 'hi'],
} as const;

export type Locale = (typeof i18n)['locales'][number];

const dictionaries: Record<Locale, () => Promise<any>> = {
    en: () => import('@/dictionaries/en.json').then((module) => module.default),
    es: () => import('@/dictionaries/es.json').then((module) => module.default),
    de: () => import('@/dictionaries/de.json').then((module) => module.default),
    fr: () => import('@/dictionaries/fr.json').then((module) => module.default),
    hi: () => import('@/dictionaries/hi.json').then((module) => module.default),
};

export const getDictionary = async (locale: Locale) => {
    if (!dictionaries[locale]) {
        return dictionaries[i18n.defaultLocale]();
    }
    return dictionaries[locale]();
};
