/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'sl-purple': 'var(--sl-purple)',
        'sl-purple-dark': 'var(--sl-purple-dark)',
        'sl-purple-light': 'var(--sl-purple-light)',
        'sl-cream': 'var(--sl-cream)',
        'sl-bg': 'var(--sl-bg)',
        'sl-card': 'var(--sl-card)',
        'sl-text': 'var(--sl-text)',
        'sl-muted': 'var(--sl-muted)',
        'sl-border': 'var(--sl-border)',
      },
      borderRadius: {
        'sl-button': '0px',
        'sl-button-secondary': '7px',
        'sl-card': '8px',
        'sl-pill': '4px',
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
