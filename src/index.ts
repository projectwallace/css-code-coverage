import { is_valid_coverage, type Coverage, type Range } from './parse-coverage.ts'
import { deduplicate_entries } from './decuplicate.ts'
import { filter_coverage } from './filter-entries.ts'
import type { Parser } from './types.ts'
import { chunkify_stylesheet } from './chunkify.ts'
import { extend_ranges } from './extend-ranges.ts'
import { prettify, type PrettifiedCoverage, type PrettifiedChunk } from './prettify.ts'

export type CoverageData = {
	uncovered_bytes: number
	covered_bytes: number
	total_bytes: number
	line_coverage_ratio: number
	byte_coverage_ratio: number
	total_lines: number
	covered_lines: number
	uncovered_lines: number
}

export type StylesheetCoverage = CoverageData & {
	url: string
	text: string
	chunks: PrettifiedChunk[]
}

export type CoverageResult = CoverageData & {
	total_files_found: number
	total_stylesheets: number
	coverage_per_stylesheet: StylesheetCoverage[]
}

function ratio(fraction: number, total: number) {
	if (total === 0) return 0
	return fraction / total
}

function calculate_stylesheet_coverage(stylesheet: PrettifiedCoverage): StylesheetCoverage {
	let { text, url, chunks } = stylesheet
	let uncovered_bytes = 0
	let covered_bytes = 0
	let total_bytes = 0
	let total_lines = 0
	let covered_lines = 0
	let uncovered_lines = 0

	for (let chunk of chunks) {
		let lines = chunk.total_lines
		let bytes = chunk.end_offset - chunk.start_offset

		total_lines += lines
		total_bytes += bytes

		if (chunk.is_covered) {
			covered_lines += lines
			covered_bytes += bytes
		} else {
			uncovered_lines += lines
			uncovered_bytes += bytes
		}
	}

	return {
		url,
		text,
		uncovered_bytes,
		covered_bytes,
		total_bytes,
		line_coverage_ratio: ratio(covered_lines, total_lines),
		byte_coverage_ratio: ratio(covered_bytes, total_bytes),
		total_lines,
		covered_lines,
		uncovered_lines,
		chunks,
	}
}

/**
 * @description
 * CSS Code Coverage calculation
 *
 * These are the steps performed to calculate coverage:
 * 1. Filter eligible files / validate input
 * 2. Prettify the CSS dicovered in each Coverage and update their ranges
 * 3. De-duplicate Coverages: merge all ranges for CSS sources occurring multiple times
 * 4. Calculate used/unused CSS bytes (fastest path, no inspection of the actual CSS needed)
 * 5. Calculate line-coverage, byte-coverage per stylesheet
 */
export function calculate_coverage(coverage: Coverage[], parse_html?: Parser): CoverageResult {
	let total_files_found = coverage.length

	if (!is_valid_coverage(coverage)) {
		throw new TypeError('No valid coverage data found')
	}

	let filtered_coverage = filter_coverage(coverage, parse_html)
	let deduplicated = deduplicate_entries(filtered_coverage)
	let range_extended = extend_ranges(deduplicated)
	let chunkified = range_extended.map((stylesheet) => chunkify_stylesheet(stylesheet))
	let prettified = chunkified.map((stylesheet) => prettify(stylesheet))
	let coverage_per_stylesheet = prettified.map((stylesheet) => calculate_stylesheet_coverage(stylesheet))

	// Calculate total coverage for all stylesheets combined
	let { total_lines, total_covered_lines, total_uncovered_lines, total_bytes, total_covered_bytes, total_uncovered_bytes } =
		coverage_per_stylesheet.reduce(
			(totals, sheet) => {
				totals.total_lines += sheet.total_lines
				totals.total_covered_lines += sheet.covered_lines
				totals.total_uncovered_lines += sheet.uncovered_lines
				totals.total_bytes += sheet.total_bytes
				totals.total_covered_bytes += sheet.covered_bytes
				totals.total_uncovered_bytes += sheet.uncovered_bytes
				return totals
			},
			{
				total_lines: 0,
				total_covered_lines: 0,
				total_uncovered_lines: 0,
				total_bytes: 0,
				total_covered_bytes: 0,
				total_uncovered_bytes: 0,
			},
		)

	return {
		total_files_found,
		total_bytes,
		total_lines,
		covered_bytes: total_covered_bytes,
		covered_lines: total_covered_lines,
		uncovered_bytes: total_uncovered_bytes,
		uncovered_lines: total_uncovered_lines,
		byte_coverage_ratio: ratio(total_covered_bytes, total_bytes),
		line_coverage_ratio: ratio(total_covered_lines, total_lines),
		coverage_per_stylesheet,
		total_stylesheets: coverage_per_stylesheet.length,
	}
}

export type { Coverage, Range } from './parse-coverage.ts'
export { parse_coverage } from './parse-coverage.ts'
export type { Parser } from './types.ts'
