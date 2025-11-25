import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    build: {
        outDir: 'assets',
        emptyOutDir: false,
        lib: {
            entry: 'src/main.js',
            name: 'BouldWidget',
            fileName: () => 'widget.js',
            formats: ['iife'],
        },
        minify: false, // Keep it readable for now, or true for production
    },
});
