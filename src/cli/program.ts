import { calculate_coverage, type Coverage, type CoverageResult } from '../lib/index.js'

export class MissingDataError extends Error {
	constructor() {
		super('No data to analyze')
	}
}

export type Report = {
	context: {
		coverage: CoverageResult
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

export async function program(
	{
		min_file_coverage,
		min_file_line_coverage,
	}: {
		min_file_coverage: number
		min_file_line_coverage?: number
	},
	coverage_data: Coverage[],
) {
	if (coverage_data.length === 0) {
		throw new MissingDataError()
	}
	let coverage = await calculate_coverage(coverage_data)
	let min_line_coverage_result = validate_min_line_coverage(coverage.line_coverage_ratio, min_file_coverage)
	let min_file_line_coverage_result = validate_min_file_line_coverage(
		Math.min(...coverage.coverage_per_stylesheet.map((sheet) => sheet.line_coverage_ratio)),
		min_file_line_coverage,
	)

	let result: Report = {
		context: {
			coverage,
		},
		report: {
			ok: min_line_coverage_result.ok && min_file_line_coverage_result.ok,
			min_line_coverage: min_line_coverage_result,
			min_file_line_coverage: min_file_line_coverage_result,
		},
	}

	return result
}
