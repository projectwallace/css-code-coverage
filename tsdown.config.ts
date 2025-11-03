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
	},
])
