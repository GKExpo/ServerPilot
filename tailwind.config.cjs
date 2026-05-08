module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: '#070a0f',
        panel: '#0d1119',
        panel2: '#111827',
        line: '#1f2937',
        neon: '#34f17b',
        neon2: '#00d4ff',
        danger: '#ff4d6d',
        warn: '#fbbf24'
      },
      boxShadow: {
        glow: '0 0 28px rgba(52, 241, 123, 0.22)'
      },
      animation: {
        pulseSoft: 'pulseSoft 2.6s ease-in-out infinite'
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '0.72' },
          '50%': { opacity: '1' }
        }
      }
    }
  },
  plugins: []
};
