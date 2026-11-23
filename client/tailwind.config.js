/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#150F27',      // deep plum-black background
        surface: '#211835',   // card surface, one step up from ink
        surface2: '#2C2148',  // hover/raised surface
        mist: '#EDE9F7',      // primary text on dark
        muted: '#A79FC2',     // secondary text
        zap: '#C6F135',       // primary accent — score highlights, CTAs
        coral: '#FF6B7A',     // secondary accent — alerts, opponent moves
        line: '#3A2E5C',      // hairline borders
      },
      fontFamily: {
        display: ['"Fredoka"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        chunky: '1.25rem',
      },
    },
  },
  plugins: [],
};
