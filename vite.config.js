import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    return {
        root: fileURLToPath(new URL("./frontend", import.meta.url)),
        plugins: [vue()],
        build: { outDir: "../dist", emptyOutDir: true },
        server: {
            host: "0.0.0.0",
            port: 5173,
            proxy: { "/api": env.DEV_API_TARGET || "http://127.0.0.1:8000" }
        }
    };
});
