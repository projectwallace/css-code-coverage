export type Range = {
	start: number
	end: number
}

export type Coverage = {
	text: string
	url: string
	ranges: Range[]
}

// Optional chaining makes `null` and non-object items fail the typeof checks
function is_valid_coverage(input: unknown): input is Coverage[] {
	return (
		Array.isArray(input) &&
		input.every(
			(item) =>
				typeof item?.text === 'string' &&
				typeof item.url === 'string' &&
				Array.isArray(item.ranges) &&
				item.ranges.every(
					(range: Range | null) =>
						typeof range?.start === 'number' && typeof range.end === 'number',
				),
		)
	)
}

export function parse_coverage(input: string) {
	try {
		let parsed: unknown = JSON.parse(input)
		return is_valid_coverage(parsed) ? parsed : ([] as Coverage[])
	} catch {
		return [] as Coverage[]
	}
}
