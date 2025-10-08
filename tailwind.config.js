/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        "outfit-extra-light": "Outfit-ExtraLight",
        "outfit-light": "Outfit-Light",
        "outfit-regular": "Outfit-Regular",
        "outfit-medium": "Outfit-Medium",
        "outfit-semi-bold": "Outfit-SemiBold",
        "outfit-bold": "Outfit-Bold",
        "outfit-extra-bold": "Outfit-ExtraBold",
      },
    },
  },
  plugins: [],
};
