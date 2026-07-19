import { parseArgs } from 'node:util'
import { resolve, sep } from 'node:path'

const SHOW_UNCOVERED = ['none', 'all', 'violations'] as const
type ShowUncovered = (typeof SHOW_UNCOVERED)[number]

const REPORTERS = ['pretty', 'tap', 'json'] as const
type Reporter = (typeof REPORTERS)[number]

export type CliArguments = {
	'coverage-dir': string
	'min-coverage': number
	'min-file-coverage'?: number
	'show-uncovered': ShowUncovered
	reporter: Reporter
}

export function parse_arguments(args: string[]): CliArguments {
	let { values, positionals } = parseArgs({
		args,
		allowPositionals: true,
		options: {
			'min-coverage': { type: 'string' },
			'min-file-coverage': { type: 'string' },
			'show-uncovered': { type: 'string', default: 'violations' },
			reporter: { type: 'string', default: 'pretty' },
		},
	})

	let issues: string[] = []

	let coverage_dir = positionals[0]
	if (coverage_dir) {
		let resolved = resolve(coverage_dir)
		let cwd = process.cwd()
		if (resolved !== cwd && !resolved.startsWith(cwd + sep)) {
			issues.push('InvalidPath')
		}
	} else {
		issues.push('<coverage-dir> is required')
	}

	let min_coverage = Number(values['min-coverage'])
	if (
		values['min-coverage'] === undefined ||
		isNaN(min_coverage) ||
		min_coverage < 0 ||
		min_coverage > 1
	) {
		issues.push('--min-coverage must be a number between 0 and 1')
	}

	let min_file_coverage
	if (values['min-file-coverage'] !== undefined) {
		min_file_coverage = Number(values['min-file-coverage'])

		if (isNaN(min_file_coverage) || min_file_coverage < 0 || min_file_coverage > 1) {
			issues.push('--min-file-coverage must be a number between 0 and 1')
		}
	}

	let show_uncovered = values['show-uncovered'] as ShowUncovered
	if (!SHOW_UNCOVERED.includes(show_uncovered)) {
		issues.push(`--show-uncovered must be one of: ${SHOW_UNCOVERED.join(', ')}`)
	}

	let reporter = values['reporter'] as Reporter
	if (!REPORTERS.includes(reporter)) {
		issues.push(`--reporter must be one of: ${REPORTERS.join(', ')}`)
	}

	if (issues.length > 0) {
		throw new Error(issues.join('\n'))
	}

	return {
		'coverage-dir': resolve(coverage_dir!),
		'min-coverage': min_coverage,
		'min-file-coverage': min_file_coverage,
		'show-uncovered': show_uncovered,
		reporter,
	}
}
