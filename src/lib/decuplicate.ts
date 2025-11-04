import type { Coverage, Range } from './parse-coverage.js'

// 1. Merge and concatenate ranges
function merge_ranges(ranges: Range[]): Range[] {
	if (ranges.length === 0) return []

	// sort by start
	ranges.sort((a, b) => a.start - b.start)

	let merged: Range[] = [ranges[0]!]

	for (let r of ranges.slice(1)) {
		let last = merged.at(-1)

		// merge overlapping or adjacent
		if (last && r.start <= last.end + 1) {
			if (r.end > last.end) {
				last.end = r.end
			}
		} else {
			merged.push({ start: r.start, end: r.end })
		}
	}

	return merged
}

// 2. Merge ranges for a single stylesheet entry into an existing grouped sheet
function merge_entry_ranges(sheet: { url: string; ranges: Range[] } | undefined, entry: Coverage): { url: string; ranges: Range[] } {
	if (!sheet) {
		return { url: entry.url, ranges: [...entry.ranges] }
	}

	let seen = new Set(sheet.ranges.map((r) => `${r.start}:${r.end}`))

	for (let range of entry.ranges) {
		let id = `${range.start}:${range.end}`
		if (!seen.has(id)) {
			seen.add(id)
			sheet.ranges.push({ ...range })
		}
	}

	return sheet
}

// 3. Main function orchestrating the grouping and range merging
export function deduplicate_entries(entries: Coverage[]): Coverage[] {
	let grouped = entries.reduce<Record<string, { url: string; ranges: Range[] }>>((acc, entry) => {
		let key = entry.text
		acc[key] = merge_entry_ranges(acc[key], entry)
		return acc
	}, Object.create(null))

	return Object.entries(grouped).map(([text, { url, ranges }]) => ({
		text,
		url,
		ranges: merge_ranges(ranges),
	}))
}
