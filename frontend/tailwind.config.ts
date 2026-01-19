import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: 'class',
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    safelist: [
        {
            pattern: /(from|to|bg|text|border|ring|shadow)-(red|blue|green|orange|purple|yellow|slate)-(50|100|200|300|400|500|600|700|800|900)/,
            variants: ['hover', 'active', 'dark', 'group-hover'],
        },
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
            },
        },
    },
    plugins: [],
};

export default config;
