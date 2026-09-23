import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages（プロジェクトサイト）では /yakuzai-gakushu/ が必要
const base = process.env.VITE_BASE || "/";

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
    host: true, // 同一Wi‑Fiのスマホからも開発時アクセス可
  },
  preview: {
    host: true,
  },
});
