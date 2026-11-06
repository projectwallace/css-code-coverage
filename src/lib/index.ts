import { type Coverage } from './parse-coverage.js'
import { prettify, type PrettifiedChunk } from './prettify.js'
import { deduplicate_entries } from './deduplicate.js'
import { filter_coverage } from './filter-entries.js'
import { extend_ranges } from './extend-ranges.js'
import { chunkify } from './chunkify.js'

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
	/** Number of coverage entries passed in (not the number of JSON files they came from) */
	total_files_found: number
	total_stylesheets: number
	coverage_per_stylesheet: StylesheetCoverage[]
}

function ratio(fraction: number, total: number) {
	return total === 0 ? 0 : fraction / total
}

function calculate_coverage_data(chunks: PrettifiedChunk[]): CoverageData {
	let covered_bytes = 0
	let total_bytes = 0
	let covered_lines = 0
	let total_lines = 0

	for (let chunk of chunks) {
		let bytes = chunk.end_offset - chunk.start_offset
		total_lines += chunk.total_lines
		total_bytes += bytes
		if (chunk.is_covered) {
			covered_lines += chunk.total_lines
			covered_bytes += bytes
		}
	}

	return {
		uncovered_bytes: total_bytes - covered_bytes,
		covered_bytes,
		total_bytes,
		line_coverage_ratio: ratio(covered_lines, total_lines),
		byte_coverage_ratio: ratio(covered_bytes, total_bytes),
		total_lines,
		covered_lines,
		uncovered_lines: total_lines - covered_lines,
	}
}

export function calculate_coverage(coverage: Coverage[]): CoverageResult {
	let filtered = coverage.reduce<Coverage[]>((acc, entry) => filter_coverage(acc, entry), [])

	let coverage_per_stylesheet: StylesheetCoverage[] = deduplicate_entries(filtered).map((sheet) => {
		let { url, text, chunks } = prettify(chunkify(extend_ranges(sheet)))
		return Object.assign({ url, text }, calculate_coverage_data(chunks), { chunks })
	})

	// Total coverage for all stylesheets combined
	let covered_bytes = 0
	let total_bytes = 0
	let covered_lines = 0
	let total_lines = 0
	for (let sheet of coverage_per_stylesheet) {
		covered_bytes += sheet.covered_bytes
		total_bytes += sheet.total_bytes
		covered_lines += sheet.covered_lines
		total_lines += sheet.total_lines
	}

	return {
		total_files_found: coverage.length,
		total_stylesheets: coverage_per_stylesheet.length,
		uncovered_bytes: total_bytes - covered_bytes,
		covered_bytes,
		total_bytes,
		line_coverage_ratio: ratio(covered_lines, total_lines),
		byte_coverage_ratio: ratio(covered_bytes, total_bytes),
		total_lines,
		covered_lines,
		uncovered_lines: total_lines - covered_lines,
		coverage_per_stylesheet,
	}
}

export type { Coverage, Range } from './parse-coverage.js'
export { parse_coverage } from './parse-coverage.js'
