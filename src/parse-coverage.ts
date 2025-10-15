import * as v from 'valibot'

export type Range = {
	start: number
	end: number
}

export type Coverage = {
	url: string
	text: string
	ranges: Range[]
}

let CoverageSchema = v.array(
	v.object({
		text: v.string(),
		url: v.string(),
		ranges: v.array(
			v.object({
				start: v.number(),
				end: v.number(),
			}),
		),
	}),
)

export function is_valid_coverage(input: unknown): boolean {
	let result = v.safeParse(CoverageSchema, input)
	return result.success
}

export function parse_coverage(input: string) {
	try {
		let parse_result = JSON.parse(input)
		return is_valid_coverage(parse_result) ? (parse_result as Coverage[]) : ([] as Coverage[])
	} catch {
		return [] as Coverage[]
	}
}
