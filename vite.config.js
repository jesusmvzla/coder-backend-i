import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {

      input: path.resolve(__dirname, "src/styles/input.css"),
      output: {
        entryFileNames: "input.css" 
      }
    },
    outDir: "public/css", 
    emptyOutDir: false
  }
});