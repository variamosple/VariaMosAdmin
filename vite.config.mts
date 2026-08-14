import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'microfrontend-redirects',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url || '';
          if (url.startsWith('/variamos_languages')) {
            res.writeHead(302, { Location: '/variamos_admin/#/languages' });
            res.end();
          } else if (url.startsWith('/variamos_projects')) {
            res.writeHead(302, { Location: '/variamos_admin/#/projects' });
            res.end();
          } else if (url.startsWith('/variamos_models')) {
            res.writeHead(302, { Location: '/variamos_admin/#/models' });
            res.end();
          } else if (url.startsWith('/variamos_bugs')) {
            res.writeHead(302, { Location: '/variamos_admin/#/bugs' });
            res.end();
          } else {
            next();
          }
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url || '';
          if (url.startsWith('/variamos_languages')) {
            res.writeHead(302, { Location: '/variamos_admin/#/languages' });
            res.end();
          } else if (url.startsWith('/variamos_projects')) {
            res.writeHead(302, { Location: '/variamos_admin/#/projects' });
            res.end();
          } else if (url.startsWith('/variamos_models')) {
            res.writeHead(302, { Location: '/variamos_admin/#/models' });
            res.end();
          } else if (url.startsWith('/variamos_bugs')) {
            res.writeHead(302, { Location: '/variamos_admin/#/bugs' });
            res.end();
          } else {
            next();
          }
        });
      }
    }
  ],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 3000,
    proxy: {
      "/auth": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/v1": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/bugs": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  base: "/variamos_admin/",
  define: {
    "process.env.PUBLIC_URL": JSON.stringify("/variamos_admin/"),
  },
});
