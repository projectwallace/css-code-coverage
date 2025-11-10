import { test, expect } from '@playwright/test'
import { print_lines as print, PrintLinesDependencies, TextStyle } from './pretty'
import { Report } from '../program'
import { CoverageResult } from '../../lib'
import { CliArguments } from '../arguments'

// test matrix
// ------------------------------
// overall line coverage success
// overall line coverage fail
// per-file line coverage success
// per-file line coverage fail
// show all
// show violations
// show none

function style_text_fn(_style: TextStyle | TextStyle[], text: string): string {
	return text
}

const min_line_coverage_failure = {
	min_line_coverage: {
		ok: false,
		expected: 1,
		actual: 0.502222222222,
	} satisfies Report['report']['min_line_coverage'],
}

const min_line_coverage_success = {
	min_line_coverage: {
		ok: true,
		expected: 0,
		actual: 0.5022222222,
	} satisfies Report['report']['min_line_coverage'],
}

const min_file_line_coverage_unset = {
	min_file_line_coverage: {
		ok: true,
		actual: 0.5,
	} satisfies Report['report']['min_file_line_coverage'],
}

const min_file_line_coverage_success = {
	min_file_line_coverage: {
		ok: true,
		actual: 1,
		expected: 0.5,
	} satisfies Report['report']['min_file_line_coverage'],
}

const min_file_line_coverage_failure = {
	min_file_line_coverage: {
		ok: false,
		actual: 0.5,
		expected: 1,
	} satisfies Report['report']['min_file_line_coverage'],
}

const show_none = { 'show-uncovered': 'none' } as CliArguments
const show_violations = { 'show-uncovered': 'violations' } as CliArguments

const context_empty = {
	context: {
		coverage: {} as CoverageResult,
	},
}

const context_with_failures = {
	context: {
		coverage: {
			line_coverage_ratio: 0.4022222,
			covered_lines: 10,
			total_lines: 11,
			coverage_per_stylesheet: [
				{
					url: 'example.com',
					line_coverage_ratio: 1,
					text: `z {
						color: yellow
					}`,
					chunks: [
						{
							start_line: 1,
							end_line: 3,
							is_covered: true,
						},
					],
				},
				{
					url: 'example.com',
					line_coverage_ratio: 8 / 19,
					covered_lines: 8,
					total_lines: 19,
					text: `a {
	color: red;
}

a1 {
	color: blue;
}

b {
	color: red;
}

b1 {
	color: blue;
}

c {
	color: red;
}`,
					chunks: [
						{
							start_line: 1,
							end_line: 3,
							is_covered: false,
						},
						{
							start_line: 4,
							end_line: 8,
							is_covered: true,
						},
						{
							start_line: 9,
							end_line: 11,
							is_covered: false,
						},
						{
							start_line: 12,
							end_line: 16,
							is_covered: true,
						},
						{
							start_line: 17,
							end_line: 19,
							is_covered: false,
						},
					],
				},
			],
		} as CoverageResult,
	},
}

const dependencies = { styleText: style_text_fn, print_width: 60 } satisfies PrintLinesDependencies

test.describe('only --min-line-coverage', () => {
	test('success', () => {
		const report = {
			...context_empty,
			report: {
				ok: true,
				...min_line_coverage_success,
				...min_file_line_coverage_unset,
			},
		} satisfies Report
		let result = print(report, show_none, dependencies)
		expect(result).toEqual(['Success: total line coverage is 50.22%'])
	})

	test('failure', () => {
		const report = {
			context: {
				coverage: {
					total_lines: 10_000,
					covered_lines: 5022,
				} as CoverageResult,
			},
			report: {
				ok: false,
				...min_line_coverage_failure,
				...min_file_line_coverage_unset,
			},
		} satisfies Report
		let result = print(report, show_none, dependencies)
		expect(result).toEqual([
			'Failed: line coverage is 50.22%% which is lower than the threshold of 1',
			'Tip: cover 4978 more lines to meet the threshold of 100%',
		])
	})
})

test.describe('with --min-file-line-coverage', () => {
	test('--min-line-coverage: success; --min-file-line-coverage: success; --show: none', () => {
		let report = {
			...context_empty,
			report: {
				ok: true,
				...min_line_coverage_success,
				...min_file_line_coverage_success,
			},
		} satisfies Report
		let result = print(report, show_none, dependencies)
		expect(result).toEqual(['Success: total line coverage is 50.22%', 'Success: all files pass minimum line coverage of 50.00%'])
	})

	test.describe('--min-line-coverage: success; --min-file-line-coverage: failure; --show: none', () => {
		let report = {
			...context_with_failures,
			report: {
				ok: false,
				...min_line_coverage_success,
				...min_file_line_coverage_failure,
			},
		} satisfies Report
		let result = print(report, show_none, dependencies)

		test('coverage: pass', () => {
			expect(result[0]).toEqual('Success: total line coverage is 50.22%')
		})
		test('file-coverage: fail', () => {
			expect(result[1]).toEqual('Failed: 1 file does not meet the minimum line coverage of 100% (minimum coverage was 50.00%)')
		})
		test('shows hint to --show=violations', () => {
			expect(result[2]).toEqual("  Hint: set --show-uncovered=violations to see which files didn't pass")
		})
		test('no files shown', () => {
			expect(result).toHaveLength(3)
		})
	})

	test.describe('--min-line-coverage: success; --min-file-line-coverage: failure; --show: violations', () => {
		let report = {
			...context_with_failures,
			report: {
				ok: false,
				...min_line_coverage_success,
				...min_file_line_coverage_failure,
			},
		} satisfies Report
		let result = print(report, show_violations, dependencies)

		test('coverage: pass', () => {
			expect(result[0]).toEqual('Success: total line coverage is 50.22%')
		})
		test('file-coverage: fail', () => {
			expect(result[1]).toEqual('Failed: 1 file does not meet the minimum line coverage of 100% (minimum coverage was 50.00%)')
		})
		test('does not show hint to --show=violations', () => {
			expect(result[2]).not.toEqual("  Hint: set --show-uncovered=violations to see which files didn't pass")
		})
		test.describe('shows file details', () => {
			let lines = result.slice(2)

			test('shows header block', () => {
				expect(lines[0]).toEqual('─'.repeat(60))
				expect(lines[4]).toEqual(lines[0])
			})
			test('shows file name', () => {
				expect(lines[1]).toEqual('example.com')
			})
			test('shows coverage info', () => {
				expect(lines[2]).toEqual('Coverage: 42.11%, 8/19 lines covered')
			})
			test('shows hint with how many lines to cover to reach threshold', () => {
				expect(lines[3]).toEqual('Tip: cover 11 more lines to meet the file threshold of 100%')
			})
			test('result snapshot', () => {
				let snapshot = lines.join('\n')
				expect(snapshot).toEqual(
					`
────────────────────────────────────────────────────────────
example.com
Coverage: 42.11%, 8/19 lines covered
Tip: cover 11 more lines to meet the file threshold of 100%
────────────────────────────────────────────────────────────
    1 ━ a {
    2 ━     color: red;
    3 ━ }
    4 │ 
    5 │ a1 {
    6 │     color: blue;
    7 │ }
    8 │ 
    9 ━ b {
   10 ━     color: red;
   11 ━ }
   12 │ 
   13 │ b1 {
   14 │     color: blue;
   15 │ }
   16 │ 
   17 ━ c {
   18 ━     color: red;
   19 ━ }`.trim(),
				)
			})
		})
	})
})
