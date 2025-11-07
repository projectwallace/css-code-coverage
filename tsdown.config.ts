import { defineConfig } from 'tsdown'
import { codecovVitePlugin } from '@codecov/vite-plugin'

export default defineConfig([
	{
		entry: 'src/lib/index.ts',
		platform: 'browser',
		format: 'esm',
		plugins: [
			codecovVitePlugin({
				enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
				bundleName: 'index.js',
				uploadToken: process.env.CODECOV_TOKEN,
				telemetry: false,
			}),
		],
	},
	{
		entry: 'src/cli/cli.ts',
		platform: 'node',
		format: 'esm',
		dts: false,
		// The CLI references the Core via 'external' reference to prevent it
		// from ending up as duplicate code in cli.js
		external: ['@projectwallace/css-code-coverage'],
		plugins: [
			codecovVitePlugin({
				enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
				bundleName: 'cli.js',
				uploadToken: process.env.CODECOV_TOKEN,
				telemetry: false,
			}),
		],
	},
])
