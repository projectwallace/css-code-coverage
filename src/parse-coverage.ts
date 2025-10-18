import * as v from 'valibot'

let RangeSchema = v.object({
	start: v.number(),
	end: v.number(),
})

export type Range = v.InferInput<typeof RangeSchema>

let CoverageSchema = v.object({
	text: v.string(),
	url: v.string(),
	ranges: v.array(RangeSchema),
})

export type Coverage = v.InferInput<typeof CoverageSchema>

export function is_valid_coverage(input: unknown): boolean {
	let result = v.safeParse(v.array(CoverageSchema), input)
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
