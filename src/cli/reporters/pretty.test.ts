import { test, expect } from '@playwright/test'
import { print_lines as print, type PrintLinesDependencies, type TextStyle } from './pretty'
import type { Report } from '../program'
import type { CoverageResult } from '../../lib'
import type { CliArguments } from '../arguments'

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
		coverage: {
			total_files_found: 7,
			total_stylesheets: 8,
			total_lines: 9999,
		} as CoverageResult,
		duration: 2,
		json_files_found: 3,
	},
}

const context_with_failures = {
	context: {
		duration: 2,
		json_files_found: 3,
		coverage: {
			line_coverage_ratio: 0.4022222,
			covered_lines: 10,
			total_lines: 11,
			total_files_found: 7,
			total_stylesheets: 9,
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
		expect(result).toEqual([
			'Finished in 2ms on 3 JSON files (7 coverage entries) containing 8 stylesheets with 9,999 lines of CSS in total.',
			'Success: total line coverage is 50.22%',
		])
	})

	test('failure', () => {
		const report = {
			context: {
				coverage: {
					total_lines: 10_000,
					covered_lines: 5022,
					total_files_found: 7,
					total_stylesheets: 8,
				} as CoverageResult,
				duration: 2,
				json_files_found: 3,
			},
			report: {
				ok: false,
				...min_line_coverage_failure,
				...min_file_line_coverage_unset,
			},
		} satisfies Report
		let result = print(report, show_none, dependencies)
		expect(result).toEqual([
			'Finished in 2ms on 3 JSON files (7 coverage entries) containing 8 stylesheets with 10,000 lines of CSS in total.',
			'Failed: line coverage is 50.22% which is lower than the threshold of 100%',
			'Tip: cover 4,978 more lines to meet the threshold of 100%',
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
		expect(result).toEqual([
			'Finished in 2ms on 3 JSON files (7 coverage entries) containing 8 stylesheets with 9,999 lines of CSS in total.',
			'Success: total line coverage is 50.22%',
			'Success: all files pass minimum line coverage of 50.00%',
		])
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

		test('metadata', () => {
			expect(result[0]).toEqual(
				'Finished in 2ms on 3 JSON files (7 coverage entries) containing 9 stylesheets with 11 lines of CSS in total.',
			)
		})
		test('coverage: pass', () => {
			expect(result[1]).toEqual('Success: total line coverage is 50.22%')
		})
		test('file-coverage: fail', () => {
			expect(result[2]).toEqual(
				'Failed: 1 file does not meet the minimum line coverage of 100% (minimum coverage was 50.00%)',
			)
		})
		test('shows hint to --show=violations', () => {
			expect(result[3]).toEqual(
				"  Hint: set --show-uncovered=violations to see which files didn't pass",
			)
		})
		test('no files shown', () => {
			expect(result).toHaveLength(4)
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
			expect(result.at(-2)).toEqual('Success: total line coverage is 50.22%')
		})
		test('file-coverage: fail', () => {
			expect(result.at(-1)).toEqual(
				'Failed: 1 file does not meet the minimum line coverage of 100% (minimum coverage was 50.00%)',
			)
		})
		test('does not show hint to --show=violations', () => {
			expect(result.at(-1)).not.toEqual(
				"  Hint: set --show-uncovered=violations to see which files didn't pass",
			)
		})
		test.describe('shows file details', () => {
			let lines = result

			test('shows header block', () => {
				expect(lines[0]).toEqual('─'.repeat(60))
				expect(lines[4]).toEqual(lines[0])
			})
			test('shows file name', () => {
				expect(lines[1]).toEqual('File: example.com')
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
					`────────────────────────────────────────────────────────────
File: example.com
Coverage: 42.11%, 8/19 lines covered
Tip: cover 11 more lines to meet the file threshold of 100%
────────────────────────────────────────────────────────────
▌    1 │ a {
▌    2 │     color: red;
▌    3 │ }
     4 │ 
     5 │ a1 {
     6 │     color: blue;
     7 │ }
     8 │ 
▌    9 │ b {
▌   10 │     color: red;
▌   11 │ }
    12 │ 
    13 │ b1 {
    14 │     color: blue;
    15 │ }
    16 │ 
▌   17 │ c {
▌   18 │     color: red;
▌   19 │ }

Finished in 2ms on 3 JSON files (7 coverage entries) containing 9 stylesheets with 11 lines of CSS in total.
Success: total line coverage is 50.22%
Failed: 1 file does not meet the minimum line coverage of 100% (minimum coverage was 50.00%)`,
				)
			})
		})
	})
})

test.describe('uncovered chunk rendering', () => {
	function render(
		text: string,
		chunks: { start_line: number; end_line: number; is_covered: boolean }[],
	) {
		let report = {
			context: {
				duration: 2,
				coverage: {
					total_files_found: 1,
					total_stylesheets: 1,
					total_lines: 1,
					coverage_per_stylesheet: [{ url: 'example.com', line_coverage_ratio: 0.5, text, chunks }],
				} as unknown as CoverageResult,
			},
			report: {
				ok: true,
				...min_line_coverage_success,
				...min_file_line_coverage_unset,
			},
		} satisfies Report
		return print(report, { 'show-uncovered': 'all' } as CliArguments, dependencies)
	}

	test('shows coverage entries when number of JSON files is unknown', () => {
		let result = render('a {}', [{ start_line: 1, end_line: 1, is_covered: true }])
		expect(result).toContain(
			'Finished in 2ms on 1 coverage entry containing 1 stylesheets with 1 lines of CSS in total.',
		)
	})

	test('renders statement at-rules with their trailing semicolon', () => {
		let result = render('@layer components;\n\na {}', [
			{ start_line: 1, end_line: 1, is_covered: false },
			{ start_line: 2, end_line: 3, is_covered: true },
		])
		expect(result).toContain('▌    1 │ @layer components;')
	})

	test('separates chunks that are far apart with an empty line', () => {
		let text = Array.from({ length: 12 }, (_, i) => `a${i + 1} {}`).join('\n')
		let result = render(text, [
			{ start_line: 1, end_line: 1, is_covered: false },
			{ start_line: 2, end_line: 11, is_covered: true },
			{ start_line: 12, end_line: 12, is_covered: false },
		])
		expect(result.slice(4, 14)).toEqual([
			'▌    1 │ a1 {}',
			'     2 │ a2 {}',
			'     3 │ a3 {}',
			'     4 │ a4 {}',
			'',
			'     9 │ a9 {}',
			'    10 │ a10 {}',
			'    11 │ a11 {}',
			'▌   12 │ a12 {}',
			'',
		])
	})
})

test.describe('regressions', () => {
	function sheet(url: string, line_coverage_ratio: number) {
		return { url, line_coverage_ratio, covered_lines: 1, total_lines: 1, text: 'a {}', chunks: [] }
	}

	test('uses singular "line" when exactly one more line needs to be covered (total)', () => {
		let report = {
			context: {
				duration: 2,
				coverage: {
					total_lines: 10,
					covered_lines: 4,
					total_files_found: 1,
					total_stylesheets: 1,
				} as CoverageResult,
			},
			report: {
				ok: false,
				// 0.45 * 10 - 4 = 0.5 lines, rounds up to 1
				min_line_coverage: { ok: false, expected: 0.45, actual: 0.4 },
				...min_file_line_coverage_unset,
			},
		} satisfies Report
		let result = print(report, show_none, dependencies)
		expect(result).toContain('Tip: cover 1 more line to meet the threshold of 45.00%')
	})

	test('uses singular "line" when exactly one more line needs to be covered (per file)', () => {
		let report = {
			context: {
				duration: 2,
				coverage: {
					total_lines: 10,
					covered_lines: 4,
					total_files_found: 1,
					total_stylesheets: 1,
					coverage_per_stylesheet: [
						{
							url: 'example.com',
							line_coverage_ratio: 0.4,
							covered_lines: 4,
							total_lines: 10,
							text: 'a {}',
							chunks: [],
						},
					],
				} as unknown as CoverageResult,
			},
			report: {
				ok: false,
				...min_line_coverage_success,
				min_file_line_coverage: { ok: false, expected: 0.45, actual: 0.4 },
			},
		} satisfies Report
		let result = print(report, show_violations, dependencies)
		expect(result).toContain('Tip: cover 1 more line to meet the file threshold of 45.00%')
	})

	test('does not reorder the stylesheets in the coverage result', () => {
		let coverage_per_stylesheet = [sheet('a.css', 0.9), sheet('b.css', 0.1)]
		let report = {
			context: {
				duration: 2,
				coverage: {
					total_lines: 2,
					covered_lines: 1,
					total_files_found: 2,
					total_stylesheets: 2,
					coverage_per_stylesheet,
				} as unknown as CoverageResult,
			},
			report: { ok: true, ...min_line_coverage_success, ...min_file_line_coverage_unset },
		} satisfies Report
		let result = print(report, { 'show-uncovered': 'all' } as CliArguments, dependencies)
		// Output is sorted by coverage (lowest first)...
		expect(result.indexOf('File: b.css')).toBeLessThan(result.indexOf('File: a.css'))
		// ...but the input is left untouched
		expect(coverage_per_stylesheet.map((s) => s.url)).toEqual(['a.css', 'b.css'])
	})
})

test.describe('uncovered chunk rendering: edges', () => {
	function render(
		text: string,
		chunks: { start_line: number; end_line: number; is_covered: boolean }[],
	) {
		let report = {
			context: {
				duration: 2,
				coverage: {
					total_files_found: 1,
					total_stylesheets: 1,
					total_lines: 1,
					coverage_per_stylesheet: [{ url: 'example.com', line_coverage_ratio: 0.5, text, chunks }],
				} as unknown as CoverageResult,
			},
			report: { ok: true, ...min_line_coverage_success, ...min_file_line_coverage_unset },
		} satisfies Report
		return print(report, { 'show-uncovered': 'all' } as CliArguments, dependencies)
	}

	test('includes the last line of the file as trailing context', () => {
		let result = render('a {}\nb {}\nc {}', [
			{ start_line: 1, end_line: 1, is_covered: false },
			{ start_line: 2, end_line: 3, is_covered: true },
		])
		expect(result.slice(4, 7)).toEqual(['▌    1 │ a {}', '     2 │ b {}', '     3 │ c {}'])
	})

	test('does not mangle uncovered lines it cannot classify', () => {
		let result = render('a {\n\tcolor: red\n}', [{ start_line: 1, end_line: 3, is_covered: false }])
		expect(result).toContain('▌    2 │     color: red')
	})
})
