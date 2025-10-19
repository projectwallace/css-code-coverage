import { defineConfig } from 'tsdown'

export default defineConfig([
	{
		entry: 'src/lib/index.ts',
		platform: 'browser',
		format: 'esm',
	},
	{
		entry: 'src/cli/cli.ts',
		platform: 'node',
		format: 'esm',
		dts: false,
	},
])
