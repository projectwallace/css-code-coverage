import type { Coverage, Range } from './parse-coverage.ts'
/**
 * @description
 * prerequisites
 * - we check each stylesheet content only once (to avoid counting the same content multiple times)
 * - if a duplicate stylesheet enters the room, we add it's ranges to the existing stylesheet's ranges
 * - only bytes of deduplicated stylesheets are counted
 */
export function deduplicate_entries(entries: Coverage[]): Map<NonNullable<Coverage['text']>, Pick<Coverage, 'ranges' | 'url'>> {
	let checked_stylesheets = new Map<string, { url: string; ranges: Range[] }>()

	for (let entry of entries) {
		let text = entry.text || ''
		if (checked_stylesheets.has(text)) {
			let sheet = checked_stylesheets.get(text)!
			let ranges = sheet.ranges
			// Check if the ranges are already in the checked_stylesheets map
			// If not, add them
			for (let range of entry.ranges) {
				let found = false
				for (let checked_range of ranges) {
					if (checked_range.start === range.start && checked_range.end === range.end) {
						found = true
						break
					}
				}
				if (!found) {
					ranges.push(range)
				}
			}
		} else {
			checked_stylesheets.set(text, {
				url: entry.url,
				ranges: entry.ranges,
			})
		}
	}

	return checked_stylesheets
}
