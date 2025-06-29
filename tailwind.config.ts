import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}', // Vue コンポーネントやJavaScript/TypeScriptファイル
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config
