import { sveltekit } from '@sveltejs/kit/vite';
import { svelte } from "@sveltejs/vite-plugin-svelte";
import sveltePreprocess from "svelte-preprocess";
import { defineConfig } from 'vite';
import packageJson from '../package.json';

export default defineConfig({
  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['./public'],
    },
  },
  plugins: [sveltekit()],
  build: {
    rollupOptions: {
      customElement: true
    }
  },
  define:  {
      'import.meta.env.PACKAGE_VERSION': JSON.stringify(packageJson.version)
    },
});
