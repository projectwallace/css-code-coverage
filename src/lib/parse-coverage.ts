export type Range = {
	start: number
	end: number
}

export type Coverage = {
	text: string
	url: string
	ranges: Range[]
}

function is_valid_coverage(input: unknown): input is Coverage[] {
	return (
		Array.isArray(input) &&
		input.every(
			(item) =>
				typeof item === 'object' &&
				item !== null &&
				typeof item.text === 'string' &&
				typeof item.url === 'string' &&
				Array.isArray(item.ranges) &&
				item.ranges.every(
					(r: unknown) =>
						typeof r === 'object' &&
						r !== null &&
						typeof (r as Range).start === 'number' &&
						typeof (r as Range).end === 'number',
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
