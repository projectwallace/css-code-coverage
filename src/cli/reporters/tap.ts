import type { Report } from '../program.js'

function test(passed: boolean, test_nr: number, description: string): string {
	return `${passed ? 'ok' : 'not ok'} ${test_nr} - ${description}`
}

function meta(data: Record<string, string | number>): string[] {
	return ['  ---', ...Object.entries(data).map(([key, value]) => `  ${key}: ${value}`), '  ...']
}

export function print_lines({ report, context }: Report): string[] {
	let sheets = context.coverage.coverage_per_stylesheet
	let { expected, actual, ok } = report.min_file_line_coverage

	let lines = [
		'TAP version 13',
		// Per-file checks (a summary + one per sheet) only run when --min-file-coverage is set
		`1..${expected === undefined ? 1 : sheets.length + 2}`,
		test(report.min_line_coverage.ok, 1, 'overall line coverage'),
	]

	if (expected === undefined) {
		return lines
	}

	lines.push(test(ok, 2, 'line coverage per file'))
	if (!ok) {
		lines.push(...meta({ expected_min_coverage: expected, actual_min_coverage: actual }))
	}

	for (let [index, sheet] of sheets.entries()) {
		let passed = sheet.line_coverage_ratio >= expected
		lines.push(test(passed, index + 3, sheet.url))
		if (!passed) {
			lines.push(
				...meta({
					expected_coverage: expected,
					actual_coverage: sheet.line_coverage_ratio,
					lines_covered: sheet.covered_lines,
					total_lines: sheet.total_lines,
				}),
			)
		}
	}

	return lines
}

export function print(report: Report): void {
	let logger = report.report.ok ? console.log : console.error
	// One write instead of one per line
	logger(print_lines(report).join('\n'))
}
