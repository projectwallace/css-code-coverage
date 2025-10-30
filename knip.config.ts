import type { KnipConfig } from 'knip'

const config: KnipConfig = {
	entry: ['src/lib/index.ts', 'src/cli/cli.ts'],
	project: ['src/**/*.ts'],
}

export default config
