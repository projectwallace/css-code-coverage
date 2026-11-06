import type { Range } from './parse-coverage.js'
import { find_style_blocks } from './html-parser.js'

export function remap_html(html: string, old_ranges: Range[]) {
	let css = ''
	let ranges: Range[] = []
	// Style blocks are found in order, so with sorted ranges we can walk both lists once
	let sorted = old_ranges.toSorted((a, b) => a.start - b.start)
	let i = 0

	for (let [start, end] of find_style_blocks(html)) {
		// Skip ranges that start before this style block
		while (i < sorted.length && sorted[i]!.start < start) {
			i++
		}

		let content = html.slice(start, end)
		if (!content.trim()) {
			continue
		}

		// Move ranges that fall within this style block to their new position in the combined CSS
		let shift = css.length - start
		for (; i < sorted.length && sorted[i]!.start < end; i++) {
			let range = sorted[i]!
			if (range.end <= end) {
				ranges.push({ start: range.start + shift, end: range.end + shift })
			}
		}

		css += content
	}

	return { css, ranges }
}
