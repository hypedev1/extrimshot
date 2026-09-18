import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Only VITE_-prefixed vars are inlined into the browser bundle.
  // Never add 'META_' here: it would leak META_ACCESS_TOKEN to every visitor.
  envPrefix: ['VITE_'],
  build: {
    // Raise the chunk warning threshold since we're now splitting properly
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — tiny, shared across all chunks
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // Supabase client — shared but not needed on first render
          "vendor-supabase": ["@supabase/supabase-js"],
          // recharts is huge (~300KB) and only used in AdminAnalytics
          "vendor-recharts": ["recharts"],
          // xlsx is large (~200KB) and only used for admin Excel exports
          "vendor-xlsx": ["xlsx"],
          // UI component library chunks
          "vendor-radix": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
          ],
          // Embla carousel (used in Testimonials — can be deferred)
          "vendor-embla": ["embla-carousel-react", "embla-carousel-autoplay"],
          // FingerprintJS — loaded for all visitors but large (~50KB)
          "vendor-fingerprint": ["@fingerprintjs/fingerprintjs"],
        },
      },
    },
  },
}));

