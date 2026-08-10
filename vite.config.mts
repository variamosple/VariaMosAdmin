import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 3000,
  },
  base: "/variamos_admin/",
  define: {
    "process.env.PUBLIC_URL": JSON.stringify("/variamos_admin/"),
  },
});
