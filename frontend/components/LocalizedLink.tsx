'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ComponentProps } from 'react';
import { Locale, i18n } from '@/lib/i18n';

type LocalizedLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
    href: string;
};

export default function LocalizedLink({ href, children, ...props }: LocalizedLinkProps) {
    const params = useParams();
    const lang = (params?.lang as Locale) || i18n.defaultLocale;

    // Handle absolute URLs or anchor tags which shouldn't be prefixed
    if (href.startsWith('http') || href.startsWith('#')) {
        return (
            <Link href={href} {...props}>
                {children}
            </Link>
        );
    }

    // Guard: if href already starts with a locale prefix, don't double-prefix
    const localePattern = /^\/(en|es|de|fr|hi)(\/|$)/;
    if (localePattern.test(href)) {
        return (
            <Link href={href} {...props}>
                {children}
            </Link>
        );
    }

    // Ensure href has a leading slash
    const formattedHref = href.startsWith('/') ? href : `/${href}`;
    const localizedHref = `/${lang}${formattedHref}`;

    return (
        <Link href={localizedHref} {...props}>
            {children}
        </Link>
    );
}
