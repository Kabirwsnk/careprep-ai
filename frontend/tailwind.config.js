/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                    800: '#075985',
                    900: '#0c4a6e',
                },
                medical: {
                    blue: '#0077b6',
                    teal: '#00b4d8',
                    mint: '#90e0ef',
                    light: '#caf0f8',
                    dark: '#023e8a',
                },
                accent: {
                    coral: '#ff6b6b',
                    amber: '#ffc857',
                    emerald: '#2ec4b6',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
                'soft': '0 4px 16px 0 rgba(0, 0, 0, 0.08)',
            },
            backdropBlur: {
                'glass': '8px',
            },
        },
    },
    plugins: [],
}
