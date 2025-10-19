import type { Coverage } from './parse-coverage.ts'
import { ext } from './ext.ts'
import type { Parser } from './types.ts'
import { remap_html } from './remap-html.ts'

function is_html(text: string): boolean {
	return /<\/?(html|body|head|div|span|script|style)/i.test(text)
}

export function filter_coverage(coverage: Coverage[], parse_html?: Parser): Coverage[] {
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
			if (!parse_html) {
				// No parser provided, cannot extract CSS from HTML, silently skip this entry
				continue
			}

			let { css, ranges } = remap_html(parse_html, entry.text, entry.ranges)
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
