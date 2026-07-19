import { defineConfig } from 'tsdown'

export default defineConfig([
	{
		entry: 'src/lib/index.ts',
		platform: 'browser',
		format: 'esm',
		publint: true,
	},
	{
		entry: 'src/cli/cli.ts',
		platform: 'node',
		format: 'esm',
		dts: false,
		publint: true,
		// The CLI references the Core via 'external' reference to prevent it
		// from ending up as duplicate code in cli.js
		deps: {
			neverBundle: ['@projectwallace/css-code-coverage'],
		},
	},
])
