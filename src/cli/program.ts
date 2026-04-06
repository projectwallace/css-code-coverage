// import from absolute package name instead of relative import (like ../lib/index.ts)
// to prevent lib/index.js being bundled into cli.js, which would mean that indexjs
// ends up in our /dist twice which is wasteful
import {
	calculate_coverage,
	type Coverage,
	type CoverageResult,
} from '@projectwallace/css-code-coverage'

export type Report = {
	context: {
		coverage: CoverageResult
		duration: number
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

function validate_min_line_coverage(actual: number, expected: number) {
	return {
		ok: actual >= expected,
		actual,
		expected,
	}
}

function validate_min_file_line_coverage(actual: number, expected: number | undefined) {
	if (expected === undefined) {
		return {
			ok: true,
			actual,
			expected,
		}
	}

	return {
		ok: actual >= expected,
		actual,
		expected,
	}
}

export function program(
	{
		min_coverage,
		min_file_coverage,
		start_time = 0,
	}: {
		min_coverage: number
		min_file_coverage?: number
		start_time?: number
	},
	coverage_data: Coverage[],
) {
	let coverage = calculate_coverage(coverage_data)
	let min_coverage_result = validate_min_line_coverage(coverage.line_coverage_ratio, min_coverage)
	let min_file_coverage_result = validate_min_file_line_coverage(
		Math.min(...coverage.coverage_per_stylesheet.map((sheet) => sheet.line_coverage_ratio)),
		min_file_coverage,
	)
	let end_time = performance.now()

	let result: Report = {
		context: {
			coverage,
			duration: end_time - start_time,
		},
		report: {
			ok: min_coverage_result.ok && min_file_coverage_result.ok,
			min_line_coverage: min_coverage_result,
			min_file_line_coverage: min_file_coverage_result,
		},
	}

	return result
}
