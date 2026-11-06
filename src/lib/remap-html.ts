import type { Range } from './parse-coverage.js'
import { find_style_blocks } from './html-parser.js'

export function remap_html(html: string, old_ranges: Range[]) {
	let css = ''
	let ranges: Range[] = []

	for (let [start, end] of find_style_blocks(html)) {
		let content = html.slice(start, end)
		if (!content.trim()) {
			continue
		}

		// Move ranges that fall within this style block to their new position in the combined CSS
		let shift = css.length - start
		for (let range of old_ranges) {
			if (range.start >= start && range.end <= end) {
				ranges.push({ start: range.start + shift, end: range.end + shift })
			}
		}

		css += content
	}

	return { css, ranges }
}
