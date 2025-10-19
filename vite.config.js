import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import pkg from './package.json'

export default defineConfig(({ mode }) => {
	return {
		build: {
			outDir: 'dist/lib',
			lib: {
				entry: resolve(__dirname, 'src/lib/index.ts'),
				formats: ['es'],
			},
			rollupOptions: {
				external: Object.keys(pkg.dependencies).concat('css-tree/tokenizer'),
			},
			sourcemap: true,
		},
		plugins: [dts()],
	}
})
