import type { Coverage } from './parse-coverage.js'
import { ext } from './ext.js'
import { remap_html } from './remap-html.js'

function is_html(text: string): boolean {
	return /<\/?(html|body|head|div|span|script|style)/i.test(text)
}

export async function filter_coverage(coverage: Coverage[]): Promise<Coverage[]> {
	let result = []

	for (let entry of coverage) {
		let extension = ext(entry.url).toLowerCase()
		if (extension === 'js') continue

		// Always include CSS files
		if (extension === 'css') {
			result.push(entry)
			continue
		}

		if (is_html(entry.text)) {
			let { css, ranges } = await remap_html(entry.text, entry.ranges)
			result.push({
				url: entry.url,
				text: css,
				ranges,
			})
			continue
		}

		// At this point it can only be CSS
		result.push({
			url: entry.url,
			text: entry.text,
			ranges: entry.ranges,
		})
	}

	return result
}
