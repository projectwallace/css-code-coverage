import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import type { Coverage } from '../lib/parse-coverage.js'

// Needed because titlePath entries can contain '/' (creates subdirs), spaces,
// dots, and other chars that are invalid or problematic in file names.
export function slugify(s: string): string {
	return s
		.replaceAll(/\s+|\/|\./g, '-')
		.replaceAll(/[^a-z0-9-_]/gi, '')
		.toLowerCase()
}

export async function save_css_coverage(
	coverage: Coverage[],
	options: {
		dir?: string
		title_path: string[]
		attach?: (name: string, options: { path: string; contentType: string }) => Promise<void>
	},
): Promise<void> {
	let { dir = 'css-coverage', title_path, attach } = options

	let file_name = title_path.map(slugify).join('-') + '.json'
	let resolved_dir = path.resolve(process.cwd(), dir)
	await fs.mkdir(resolved_dir, { recursive: true })
	let file_path = path.join(resolved_dir, file_name)

	await fs.writeFile(file_path, JSON.stringify(coverage))

	await attach?.('css-coverage', { path: file_path, contentType: 'application/json' })
}
