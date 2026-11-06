import { readFile, stat, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { parse_coverage, type Coverage } from '@projectwallace/css-code-coverage'

export async function read(
	coverage_dir: string,
): Promise<{ json_files_found: number; coverage: Coverage[] }> {
	let s = await stat(coverage_dir)
	if (!s.isDirectory()) {
		throw new TypeError('InvalidDirectory')
	}

	let file_paths = await readdir(coverage_dir)
	let parsed_files: Coverage[] = []
	let json_files_found = 0

	for (let file_path of file_paths) {
		if (!file_path.endsWith('.json')) {
			continue
		}
		json_files_found++
		let contents = await readFile(join(coverage_dir, file_path), 'utf-8')
		// Not push(...parsed): spreading large arrays overflows the call stack
		for (let entry of parse_coverage(contents)) {
			parsed_files.push(entry)
		}
	}
	return { json_files_found, coverage: parsed_files }
}
