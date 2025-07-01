import { defineConfig } from "vite";
import { glob } from "glob";
import { resolve } from "path";

export default defineConfig({
  base: "./", // 相対パスに変更
  build: {
    rollupOptions: {
      input: glob.sync("*.html").reduce((entries, file) => {
        const name = file.replace(/\.html$/, "");
        entries[name] = resolve(__dirname, file);
        return entries;
      }, {}),
    },
  },
});
