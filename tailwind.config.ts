import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // 🔥 เพิ่มสีธีมใหม่ตรงนี้
      colors: {
        'npk-gray': 'rgba(159, 159, 159, <alpha-value>)',  // สีเทา (N)
        'npk-gold': 'rgba(139, 118, 90, <alpha-value>)',   // สีทองน้ำตาล (P)
        'npk-orange': 'rgba(226, 77, 33, <alpha-value>)',  // สีส้ม (K)
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;