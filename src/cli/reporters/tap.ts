import type { CliArguments } from '../arguments'
import type { Report } from '../program'

export function print({ report, context }: Report, params: CliArguments) {
	let total_files = context.coverage.coverage_per_stylesheet.length
	let total_checks = total_files + 1
	let checks_added = 1

	if (report.min_file_line_coverage.expected !== undefined) {
		total_checks++
		checks_added++
	}

	console.log('TAP version 13')
	console.log(`1..${total_checks}`)

	// global line coverage
	if (report.min_line_coverage.ok) {
		console.log(`ok 1 - overall line coverage`)
	} else {
		console.log(`not ok 1 - overall line coverage`)
	}

	// per-file line coverage
	if (report.min_file_line_coverage.expected !== undefined) {
		if (report.min_file_line_coverage.ok) {
			console.log(`ok 2 - line coverage per file`)
		} else {
			console.log(`not ok 2 - line coverage per file`)
		}

		for (let i = 0; i < total_files; i++) {
			let sheet = context.coverage.coverage_per_stylesheet[i]!
			let num = i + checks_added + 1
			if (sheet.line_coverage_ratio < report.min_file_line_coverage.expected) {
				console.log(`not ok ${num} - ${sheet.url}`)
				console.log('---')
				console.log(`expected_coverage: ${(report.min_file_line_coverage.expected * 100).toFixed(2)}%`)
				console.log(`actual_coverage: ${(sheet.line_coverage_ratio * 100).toFixed(2)}%`)
				console.log(`lines_covered: ${sheet.covered_lines}`)
				console.log(`total_lines: ${sheet.total_lines}`)
				console.log('...')
			} else {
				console.log(`ok ${num} - ${sheet.url}`)
			}
		}
	}
}
