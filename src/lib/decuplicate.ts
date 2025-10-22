import type { Coverage, Range } from './parse-coverage.js'

function dedupe_list(ranges: Range[]): Set<Range> {
	let new_ranges: Set<Range> = new Set()

	outer: for (let range of ranges) {
		for (let processed_range of new_ranges) {
			if (range.start <= processed_range.start && range.end >= processed_range.end) {
				new_ranges.delete(processed_range)
				new_ranges.add(range)
				continue outer
			}
		}
		new_ranges.add(range)
	}

	return new_ranges
}

/**
 * @description
 * prerequisites
 * - we check each stylesheet content only once (to avoid counting the same content multiple times)
 * - if a duplicate stylesheet enters the room, we add it's ranges to the existing stylesheet's ranges
 * - only bytes of deduplicated stylesheets are counted
 */
export function deduplicate_entries(entries: Coverage[]): Coverage[] {
	let checked_stylesheets = new Map<string, { url: string; ranges: Set<Range> }>()

	for (let entry of entries) {
		let text = entry.text
		if (checked_stylesheets.has(text)) {
			let sheet = checked_stylesheets.get(text)!
			let ranges = sheet.ranges
			// Check if the ranges are already in the checked_stylesheets map
			// If not, add them
			for (let range of entry.ranges) {
				let found = false

				for (let checked_range of ranges) {
					// find exact range
					if (checked_range.start === range.start && checked_range.end === range.end) {
						found = true
						break
					}
				}

				if (!found) {
					ranges.add(range)
				}
			}
		} else {
			checked_stylesheets.set(text, {
				url: entry.url,
				ranges: dedupe_list(entry.ranges),
			})
		}
	}

	return Array.from(checked_stylesheets, ([text, { url, ranges }]) => ({
		text,
		url,
		ranges: Array.from(ranges).sort((a, b) => a.start - b.start),
	}))
}
