export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Prompt', 'sans-serif'], // บังคับให้ทั้งระบบใช้ฟอนต์ Prompt
      }
    },
  },
  plugins: [],
}