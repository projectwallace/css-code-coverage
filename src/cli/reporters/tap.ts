import type { CliArguments } from '../arguments'
import type { Report } from '../program'

function version() {
	console.log('TAP version 13')
}

function plan(total: number) {
	console.log(`1..${total}`)
}

function ok(n: number, description?: string) {
	console.log(`ok ${n} ${description ? `- ${description}` : ''}`)
}

function not_ok(n: number, description?: string) {
	console.log(`not ok ${n} ${description ? `- ${description}` : ''}`)
}

function meta(data: Record<string | number, string | number>) {
	console.log('  ---')
	for (let key in data) {
		console.log(`  ${key}: ${data[key]}`)
	}
	console.log('  ...')
}

export function print({ report, context }: Report, params: CliArguments) {
	let total_files = context.coverage.coverage_per_stylesheet.length
	let total_checks = total_files + 1
	let checks_added = 1

	if (report.min_file_line_coverage.expected !== undefined) {
		total_checks++
		checks_added++
	}

	version()
	plan(total_checks)

	// global line coverage
	if (report.min_line_coverage.ok) {
		ok(1, 'overall line coverage')
	} else {
		not_ok(1, 'overall line coverage')
	}

	// per-file line coverage
	if (report.min_file_line_coverage.expected !== undefined) {
		if (report.min_file_line_coverage.ok) {
			ok(2, 'line coverage per file')
		} else {
			not_ok(2, 'line coverage per file')
			meta({
				expected_min_coverage: report.min_file_line_coverage.expected,
				actual_min_coverage: report.min_file_line_coverage.actual,
			})
		}

		for (let i = 0; i < total_files; i++) {
			let sheet = context.coverage.coverage_per_stylesheet[i]!
			let num = i + checks_added + 1
			if (sheet.line_coverage_ratio < report.min_file_line_coverage.expected) {
				not_ok(num, sheet.url)
				meta({
					expected_coverage: report.min_file_line_coverage.expected,
					actual_coverage: report.min_file_line_coverage.actual,
					lines_covered: sheet.covered_lines,
					total_lines: sheet.total_lines,
				})
			} else {
				ok(num, sheet.url)
			}
		}
	}
}
