/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        apple: {
          blue: '#007AFF',
          green: '#34C759',
          indigo: '#5856D6',
          purple: '#AF52DE',
          pink: '#FF2D55',
          orange: '#FF9500',
          yellow: '#FFCC00',
          red: '#FF3B30',
          gray: {
            light: '#E9E9EB',
            dark: '#26252A',
            border: 'rgba(255, 255, 255, 0.08)',
            borderLight: 'rgba(0, 0, 0, 0.08)'
          }
        }
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif'
        ]
      }
    }
  },
  plugins: []
};

