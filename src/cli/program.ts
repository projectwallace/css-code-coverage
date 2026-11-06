// import from absolute package name instead of relative import (like ../lib/index.ts)
// to prevent lib/index.js being bundled into cli.js, which would mean that indexjs
// ends up in our /dist twice which is wasteful
import {
	calculate_coverage,
	type Coverage,
	type CoverageResult,
} from '@projectwallace/css-code-coverage'
import type { CliArguments } from './arguments.js'

export type Report = {
	context: {
		coverage: CoverageResult
		duration: number
		/** Number of JSON files read from disk (each file may contain many coverage entries) */
		json_files_found?: number
	}
	report: {
		ok: boolean
		min_line_coverage: {
			expected: number
			actual: number
			ok: boolean
		}
		min_file_line_coverage: {
			expected?: number
			actual: number
			ok: boolean
		}
	}
}

type Sheet = CoverageResult['coverage_per_stylesheet'][number]

// Whether a reporter should list this sheet, based on --show-uncovered
export function should_show(
	sheet: Sheet,
	show: CliArguments['show-uncovered'],
	min_file_line_coverage = 0,
): boolean {
	if (show === 'all') {
		return sheet.line_coverage_ratio < 1
	}
	return show === 'violations' && sheet.line_coverage_ratio < min_file_line_coverage
}

function validate<T extends number | undefined>(actual: number, expected: T) {
	return {
		ok: expected === undefined || actual >= expected,
		actual,
		expected,
	}
}

export function program(
	{
		min_coverage,
		min_file_coverage,
		start_time = 0,
		json_files_found,
	}: {
		min_coverage: number
		min_file_coverage?: number
		start_time?: number
		json_files_found?: number
	},
	coverage_data: Coverage[],
) {
	let coverage = calculate_coverage(coverage_data)
	let min_coverage_result = validate(coverage.line_coverage_ratio, min_coverage)
	let min_file_coverage_result = validate(
		Math.min(...coverage.coverage_per_stylesheet.map((sheet) => sheet.line_coverage_ratio)),
		min_file_coverage,
	)
	let end_time = performance.now()

	let result: Report = {
		context: {
			coverage,
			duration: end_time - start_time,
			json_files_found,
		},
		report: {
			ok: min_coverage_result.ok && min_file_coverage_result.ok,
			min_line_coverage: min_coverage_result,
			min_file_line_coverage: min_file_coverage_result,
		},
	}

	return result
}
