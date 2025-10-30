import { parseArgs } from 'node:util'
import * as v from 'valibot'

const show_uncovered_options = {
	none: 'none',
	all: 'all',
	violations: 'violations',
} as const

const reporters = {
	pretty: 'pretty',
	tap: 'tap',
} as const

let CoverageDirSchema = v.pipe(v.string(), v.nonEmpty())
// Coerce args string to number and validate that it's between 0 and 1
let RatioPercentageSchema = v.pipe(v.string(), v.transform(Number), v.number(), v.minValue(0), v.maxValue(1))
let ShowUncoveredSchema = v.pipe(v.string(), v.enum(show_uncovered_options))
let ReporterSchema = v.pipe(v.string(), v.enum(reporters))

let CliArgumentsSchema = v.object({
	'coverage-dir': CoverageDirSchema,
	'min-line-coverage': RatioPercentageSchema,
	'min-file-line-coverage': v.optional(RatioPercentageSchema),
	'show-uncovered': v.optional(ShowUncoveredSchema, show_uncovered_options.violations),
	reporter: v.optional(ReporterSchema, reporters.pretty),
})

export type CliArguments = {
	'coverage-dir': string
	'min-line-coverage': number
	'min-file-line-coverage'?: number
	'show-uncovered': keyof typeof show_uncovered_options
	reporter: keyof typeof reporters
}

type ArgumentIssue = { path?: string; message: string }

class InvalidArgumentsError extends Error {
	readonly issues: ArgumentIssue[]

	constructor(issues: ArgumentIssue[]) {
		super()
		this.issues = issues
	}
}

export function validate_arguments(args: ReturnType<typeof parse_arguments>): CliArguments {
	let parse_result = v.safeParse(CliArgumentsSchema, args)

	if (!parse_result.success) {
		throw new InvalidArgumentsError(
			parse_result.issues.map((issue) => ({
				path: issue.path?.map((path) => path.key).join('.'),
				message: issue.message,
			})),
		)
	}

	return parse_result.output
}

export function parse_arguments(args: string[]) {
	let { values } = parseArgs({
		args,
		allowPositionals: true,
		options: {
			'coverage-dir': {
				type: 'string',
			},
			'min-line-coverage': {
				type: 'string',
			},
			'min-file-line-coverage': {
				type: 'string',
				default: '0',
			},
			'show-uncovered': {
				type: 'string',
				default: 'violations',
			},
			reporter: {
				type: 'string',
				default: 'pretty',
			},
		},
	})
	return values
}
