import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(183 100% 35%)',
          foreground: 'hsl(210 40% 98%)',
          50: 'hsl(0 0% 100%)',
          100: 'hsl(0 0% 100%)',
          200: 'hsl(0 0% 100%)',
          300: 'hsl(0 0% 100%)',
          400: 'hsl(0 0% 100%)',
          500: 'hsl(183 100% 35%)',
          600: 'hsl(183 100% 28%)',
          700: 'hsl(183 100% 21%)',
          800: 'hsl(183 100% 15%)',
          900: 'hsl(183 100% 10%)',
          950: 'hsl(183 100% 5%)',
        },
        gray: {
          850: '#1f2937',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
      fontFamily: {
        sans: ['var(--font-inter)'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}

export default config