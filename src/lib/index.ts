import { type Coverage } from './parse-coverage.js'
import { prettify, type PrettifiedChunk, type PrettifiedCoverage } from './prettify.js'
import { deduplicate_entries } from './decuplicate.js'
import { filter_coverage } from './filter-entries.js'
import { extend_ranges } from './extend-ranges.js'
import { chunkify, type ChunkedCoverage } from './chunkify.js'

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

function calculate_stylesheet_coverage({ text, url, chunks }: PrettifiedCoverage) {
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

export function calculate_coverage(coverage: Coverage[]): CoverageResult {
	let total_files_found = coverage.length

	let filtered_coverage = coverage.reduce<Coverage[]>(
		(acc, entry) => filter_coverage(acc, entry),
		[],
	)
	let deduplicated: Coverage[] = filtered_coverage.reduce<Coverage[]>(
		(entries, entry) => deduplicate_entries(entries.concat(entry)),
		[],
	)
	let extended: Coverage[] = deduplicated.map((coverage) => extend_ranges(coverage))
	let chunkified: ChunkedCoverage[] = extended.map((sheet) => chunkify(sheet))
	let prettified: PrettifiedCoverage[] = chunkified.map((sheet) => prettify(sheet))
	let coverage_per_stylesheet = prettified.map((stylesheet) =>
		calculate_stylesheet_coverage(stylesheet),
	)

	// Calculate total coverage for all stylesheets combined
	let {
		total_lines,
		total_covered_lines,
		total_uncovered_lines,
		total_bytes,
		total_used_bytes,
		total_unused_bytes,
	} = coverage_per_stylesheet.reduce(
		(totals, sheet) => {
			totals.total_lines += sheet.total_lines
			totals.total_covered_lines += sheet.covered_lines
			totals.total_uncovered_lines += sheet.uncovered_lines
			totals.total_bytes += sheet.total_bytes
			totals.total_used_bytes += sheet.covered_bytes
			totals.total_unused_bytes += sheet.uncovered_bytes
			return totals
		},
		{
			total_lines: 0,
			total_covered_lines: 0,
			total_uncovered_lines: 0,
			total_bytes: 0,
			total_used_bytes: 0,
			total_unused_bytes: 0,
		},
	)

	return {
		total_files_found,
		total_bytes,
		total_lines,
		covered_bytes: total_used_bytes,
		covered_lines: total_covered_lines,
		uncovered_bytes: total_unused_bytes,
		uncovered_lines: total_uncovered_lines,
		byte_coverage_ratio: ratio(total_used_bytes, total_bytes),
		line_coverage_ratio: ratio(total_covered_lines, total_lines),
		coverage_per_stylesheet,
		total_stylesheets: coverage_per_stylesheet.length,
	}
}

export type { Coverage, Range } from './parse-coverage.js'
export { parse_coverage } from './parse-coverage.js'
