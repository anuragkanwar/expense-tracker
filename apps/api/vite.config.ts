import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@/models": resolve(
        __dirname,
        "../../packages/contracts/src/models/index.ts"
      ),
      "@/models/*": resolve(__dirname, "../../packages/contracts/src/models/*"),
      "@/dto": resolve(__dirname, "../../packages/contracts/src/dto/index.ts"),
      "@/dto/*": resolve(__dirname, "../../packages/contracts/src/dto/*"),
    },
  },
});
