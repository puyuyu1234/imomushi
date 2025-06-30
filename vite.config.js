import { defineConfig } from "vite";

export default defineConfig({
  base: "./", // 相対パスに変更
  build: {
    rollupOptions: {
      input: {
        main: "./index.html",
        test01: "./test01.html",
      },
    },
  },
});
