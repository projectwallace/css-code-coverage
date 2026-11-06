import type { Coverage, Range } from './parse-coverage.js'

// Sort ranges and merge the ones that overlap or are adjacent.
// Always returns new Range objects so later steps can safely mutate them.
function merge_ranges(ranges: Range[]): Range[] {
	ranges.sort((a, b) => a.start - b.start)

	let merged: Range[] = []
	let last: Range | undefined

	for (let range of ranges) {
		if (last && range.start <= last.end + 1) {
			if (range.end > last.end) {
				last.end = range.end
			}
		} else {
			last = { start: range.start, end: range.end }
			merged.push(last)
		}
	}

	return merged
}

// Group entries with identical text and merge their ranges
export function deduplicate_entries(entries: Coverage[]): Coverage[] {
	let grouped = new Map<string, Coverage>()

	for (let entry of entries) {
		let sheet = grouped.get(entry.text)
		if (sheet) {
			for (let range of entry.ranges) {
				sheet.ranges.push(range)
			}
		} else {
			grouped.set(entry.text, { text: entry.text, url: entry.url, ranges: entry.ranges.slice() })
		}
	}

	let result = Array.from(grouped.values())
	for (let sheet of result) {
		sheet.ranges = merge_ranges(sheet.ranges)
	}
	return result
}
