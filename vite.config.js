import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite'
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@Components": path.resolve(__dirname, "src/Components"),
      "@Configs": path.resolve(__dirname, "src/Configs"),
      "@Hooks": path.resolve(__dirname, "src/Hooks"),
      "@Utils": path.resolve(__dirname, "src/Utils"),
      "@Context": path.resolve(__dirname, "src/Context"),
      "@Pages": path.resolve(__dirname, "src/Pages"),
      "@Sections": path.resolve(__dirname, "src/Sections"),
      "@assets": path.resolve(__dirname, "src/assets"),
    },
  },
});