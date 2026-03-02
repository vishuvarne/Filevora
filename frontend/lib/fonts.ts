import { Inter, Poppins, Space_Grotesk, JetBrains_Mono } from 'next/font/google';

export const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
});

export const poppins = Poppins({
    weight: ['700'],
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-poppins',
});

export const spaceGrotesk = Space_Grotesk({
    subsets: ['latin'],
    weight: ['500', '600', '700'],
    display: 'swap',
    variable: '--font-space-grotesk',
});

export const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    weight: ['500', '600', '700'],
    display: 'swap',
    variable: '--font-jetbrains',
});
