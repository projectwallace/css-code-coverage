import type { Coverage, Range } from './parse-coverage.js'

export type WeightedRange = Range & { count: number }
export type WeightedCoverage = Omit<Coverage, 'ranges'> & { ranges: WeightedRange[] }

// 1. Sweep-line merge: produces weighted ranges where count = number of input ranges covering each segment
function merge_ranges_weighted(ranges: Range[]): WeightedRange[] {
	if (ranges.length === 0) return []

	type Event = { pos: number; delta: number }
	let events: Event[] = []

	for (let r of ranges) {
		events.push({ pos: r.start, delta: +1 })
		events.push({ pos: r.end, delta: -1 })
	}

	// sort by position; closes (-1) before opens (+1) at the same position
	events.sort((a, b) => a.pos - b.pos || a.delta - b.delta)

	let swept: WeightedRange[] = []
	let depth = 0
	let prev_pos: number | null = null

	for (let event of events) {
		if (prev_pos !== null && event.pos > prev_pos && depth > 0) {
			swept.push({ start: prev_pos, end: event.pos, count: depth })
		}
		depth += event.delta
		prev_pos = event.pos
	}

	// Merge adjacent segments (up to 1-byte gap) with the same count, preserving the
	// original behaviour where ranges touching at r.start <= last.end + 1 were merged.
	let result: WeightedRange[] = swept.length > 0 ? [{ ...swept[0]! }] : []
	for (let r of swept.slice(1)) {
		let last = result.at(-1)!
		if (r.start <= last.end + 1 && r.count === last.count) {
			if (r.end > last.end) last.end = r.end
		} else {
			result.push({ ...r })
		}
	}

	return result
}

// 2. Merge ranges for a single stylesheet entry into an existing grouped sheet
function merge_entry_ranges(
	sheet: { url: string; ranges: Range[] } | undefined,
	entry: Coverage,
): { url: string; ranges: Range[] } {
	if (!sheet) {
		return { url: entry.url, ranges: [...entry.ranges] }
	}

	for (let range of entry.ranges) {
		sheet.ranges.push({ ...range })
	}

	return sheet
}

// 3. Main function orchestrating the grouping and range merging
export function deduplicate_entries(entries: Coverage[]): WeightedCoverage[] {
	let grouped = entries.reduce<Record<string, { url: string; ranges: Range[] }>>((acc, entry) => {
		let key = entry.text
		acc[key] = merge_entry_ranges(acc[key], entry)
		return acc
	}, Object.create(null))

	return Object.entries(grouped).map(([text, { url, ranges }]) => ({
		text,
		url,
		ranges: merge_ranges_weighted(ranges),
	}))
}
