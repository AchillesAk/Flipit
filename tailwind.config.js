export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          950: '#0b0b11',
          900: '#121320',
          800: '#181a2b',
        },
        brand: {
          orange: '#ff7a18',
          pink: '#ff2aa1',
        },
      },
      backgroundImage: {
        'brand-radial':
          'radial-gradient(60% 60% at 50% 0%, rgba(255,122,24,0.35) 0%, rgba(255,42,161,0.15) 35%, rgba(0,0,0,0) 70%)',
        'brand-linear': 'linear-gradient(90deg, #ff7a18 0%, #ff2aa1 100%)',
      },
      boxShadow: {
        card: '0 20px 60px rgba(0,0,0,0.45)',
      },
      fontFamily: {
        display: ['system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        body: ['system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
