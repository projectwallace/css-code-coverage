import { parseArgs } from 'node:util'
import { resolve, sep } from 'node:path'

const SHOW_UNCOVERED = ['none', 'all', 'violations'] as const
type ShowUncovered = (typeof SHOW_UNCOVERED)[number]

const REPORTERS = ['pretty', 'tap', 'json'] as const
type Reporter = (typeof REPORTERS)[number]

export type CliArguments = {
	'coverage-dir': string
	'min-coverage': number
	'min-file-coverage': number
	'show-uncovered': ShowUncovered
	reporter: Reporter
}

export function parse_arguments(args: string[]): CliArguments {
	let { values } = parseArgs({
		args,
		options: {
			'coverage-dir': { type: 'string' },
			'min-coverage': { type: 'string' },
			'min-file-coverage': { type: 'string', default: '0' },
			'show-uncovered': { type: 'string', default: 'violations' },
			reporter: { type: 'string', default: 'pretty' },
		},
	})

	let issues: string[] = []

	let coverage_dir = values['coverage-dir']
	if (!coverage_dir) {
		issues.push('--coverage-dir is required')
	} else {
		let resolved = resolve(coverage_dir)
		let cwd = process.cwd()
		if (resolved !== cwd && !resolved.startsWith(cwd + sep)) {
			issues.push('InvalidPath')
		}
	}

	let min_coverage = Number(values['min-coverage'])
	if (values['min-coverage'] === undefined || isNaN(min_coverage) || min_coverage < 0 || min_coverage > 1) {
		issues.push('--min-coverage must be a number between 0 and 1')
	}

	let min_file_coverage = Number(values['min-file-coverage'])
	if (isNaN(min_file_coverage) || min_file_coverage < 0 || min_file_coverage > 1) {
		issues.push('--min-file-coverage must be a number between 0 and 1')
	}

	if (!SHOW_UNCOVERED.includes(values['show-uncovered'] as ShowUncovered)) {
		issues.push(`--show-uncovered must be one of: ${SHOW_UNCOVERED.join(', ')}`)
	}

	if (!REPORTERS.includes(values['reporter'] as Reporter)) {
		issues.push(`--reporter must be one of: ${REPORTERS.join(', ')}`)
	}

	if (issues.length > 0) {
		throw new Error(issues.join('\n'))
	}

	return {
		'coverage-dir': resolve(coverage_dir!),
		'min-coverage': min_coverage,
		'min-file-coverage': min_file_coverage,
		'show-uncovered': values['show-uncovered'] as ShowUncovered,
		reporter: values['reporter'] as Reporter,
	}
}
