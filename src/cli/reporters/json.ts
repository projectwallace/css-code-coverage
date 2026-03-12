import type { CliArguments } from '../arguments.js'
import type { Report } from '../program.js'

function prepare({ report, context }: Report, params: CliArguments) {
	context.coverage.coverage_per_stylesheet = context.coverage.coverage_per_stylesheet.filter(
		(sheet) => {
			// Include if the user wanted min-file-coverage and this file coverage is too low
			if (
				params['show-uncovered'] === 'violations' &&
				report.min_file_line_coverage.expected !== undefined &&
				sheet.line_coverage_ratio < report.min_file_line_coverage.expected
			) {
				return true
			}

			// Include if show=all and coverage isn't 100%
			if (params['show-uncovered'] === 'all' && sheet.line_coverage_ratio < 1) {
				return true
			}

			// Skip the sheet if show=none or coverage is higher than requested
			return false
		},
	)

	return {
		report,
		context,
	}
}

export function print({ report, context }: Report, params: CliArguments): void {
	let logger = report.ok ? console.log : console.error
	let data = prepare({ context, report }, params)
	logger(JSON.stringify(data))
}
