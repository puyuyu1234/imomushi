import { defineConfig } from "vite";
import { glob } from "glob";
import { resolve } from "path";

export default defineConfig({
  base: "./", // 相対パスに変更
  resolve: {
    alias: {
      tslib: resolve(__dirname, "node_modules/tslib/tslib.es6.js"),
    },
  },
  optimizeDeps: {
    include: ["tone", "@tonejs/midi", "tslib"],
  },
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
