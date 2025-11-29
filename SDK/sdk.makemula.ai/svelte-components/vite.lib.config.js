import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import sveltePreprocess from "svelte-preprocess";
import packageJson from '../package.json';


export default defineConfig({
  build: {
    lib: {
      entry: "./src/lib/index.lib.js",
      name: "MulaComponents",
      fileName: "mula-components",
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') {
            return 'global.css';
          }
          return assetInfo.name;
        }
      }
    }
  },
  plugins: [
    svelte({
      include: [
        "src/lib/Bootloader.js",
        "src/lib/TopShelf.svelte",
        "src/lib/SmartScroll.svelte",
        "src/lib/ProductModal.svelte"
      ],
      preprocess: sveltePreprocess(),
      compilerOptions: {
        css: true,
        customElement: true,
      },
    })
  ],
  define:  {
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(packageJson.version)
  },
});
