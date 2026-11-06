import type { CliArguments } from '../arguments.js'
import { should_show, type Report } from '../program.js'

export function print_lines({ report, context }: Report, params: CliArguments): string[] {
	let coverage_per_stylesheet = context.coverage.coverage_per_stylesheet.filter((sheet) =>
		should_show(sheet, params['show-uncovered'], report.min_file_line_coverage.expected),
	)
	let output = {
		report,
		context: { ...context, coverage: { ...context.coverage, coverage_per_stylesheet } },
	}
	return [JSON.stringify(output)]
}

export function print(report: Report, params: CliArguments): void {
	let logger = report.report.ok ? console.log : console.error
	for (let line of print_lines(report, params)) {
		logger(line)
	}
}
