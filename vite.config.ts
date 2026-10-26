import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    reactRouter(),
  ],
  optimizeDeps: {
    include: [
      "react-dom/client",
      "react-router/dom",
      "better-auth/react",
      "better-auth/client/plugins",
      "better-auth/plugins/access",
      "better-auth/plugins/organization/access",
      "@hookform/resolvers/zod",
      "react-hook-form",
      "react-markdown",
      "remark-gfm",
      "radix-ui",
      "lucide-react",
      "cn",
      "class-variance-authority",
      "zod",
    ],
  },
  resolve: {
    tsconfigPaths: true,
  },
});
