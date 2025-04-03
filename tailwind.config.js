/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cores baseadas no emblema da Loja Jacques DeMolay
        'jd-primary': {
          DEFAULT: '#0F2B5B', // Azul escuro principal
          light: '#1A3C78',
          dark: '#091D3E',
        },
        'jd-secondary': {
          DEFAULT: '#E6E7E8', // Prata/branco
          light: '#FFFFFF',
          dark: '#C4C5C6',
        },
        'jd-accent': {
          DEFAULT: '#D4AF37', // Dourado
          light: '#F0D675',
          dark: '#A88A29',
        },
        'jd-cyan': {
          DEFAULT: '#25CED1', // Azul ciano claro
          light: '#5DE7EA',
          dark: '#19A2A5',
        },
        'jd-dark': '#0A1A33', // Azul muito escuro para fundos
        'jd-light': '#F8F9FA', // Branco para textos
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      boxShadow: {
        'jd': '0 4px 6px -1px rgba(15, 43, 91, 0.2), 0 2px 4px -1px rgba(15, 43, 91, 0.1)',
      },
    },
  },
  plugins: [],
}

