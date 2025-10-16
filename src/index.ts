import { is_valid_coverage, type Coverage, type Range } from './parse-coverage.ts'
import { prettify } from './prettify.ts'
import { deduplicate_entries } from './decuplicate.ts'
import { filter_coverage } from './filter-entries.ts'
import type { Parser } from './types.ts'

export type CoverageData = {
	unused_bytes: number
	used_bytes: number
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
	ranges: Range[]
	line_coverage: Uint8Array
	chunks: {
		is_covered: boolean
		start_line: number
		end_line: number
		total_lines: number
	}[]
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
	let prettified_coverage = prettify(filtered_coverage)
	let deduplicated = deduplicate_entries(prettified_coverage)

	// Calculate coverage for each individual stylesheet we found
	let coverage_per_stylesheet = Array.from(deduplicated).map(([text, { url, ranges }]) => {
		function is_line_covered(line: string, start_offset: number) {
			let end = start_offset + line.length
			let next_offset = end + 1 // account for newline character
			let is_empty = /^\s*$/.test(line)
			let is_closing_brace = line.endsWith('}')

			if (!is_empty && !is_closing_brace) {
				for (let range of ranges) {
					if (range.start > end || range.end < start_offset) {
						continue
					}
					if (range.start <= start_offset && range.end >= end) {
						return true
					} else if (line.startsWith('@') && range.start > start_offset && range.start < next_offset) {
						return true
					}
				}
			}
			return false
		}

		let lines = text.split('\n')
		let total_file_lines = lines.length
		let line_coverage = new Uint8Array(total_file_lines)
		let file_lines_covered = 0
		let file_total_bytes = text.length
		let file_bytes_covered = 0
		let offset = 0

		for (let index = 0; index < lines.length; index++) {
			let line = lines[index]!
			let start = offset
			let end = offset + line.length
			let next_offset = end + 1 // +1 for the newline character
			let is_empty = /^\s*$/.test(line)
			let is_closing_brace = line.endsWith('}')
			let is_in_range = is_line_covered(line, start)
			let is_covered = false

			let prev_is_covered = index > 0 && line_coverage[index - 1] === 1

			if (is_in_range && !is_closing_brace && !is_empty) {
				is_covered = true
			} else if ((is_empty || is_closing_brace) && prev_is_covered) {
				is_covered = true
			} else if (is_empty && !prev_is_covered && is_line_covered(lines[index + 1]!, next_offset)) {
				// If the next line is covered, mark this empty line as covered
				is_covered = true
			}

			line_coverage[index] = is_covered ? 1 : 0

			if (is_covered) {
				file_lines_covered++
				file_bytes_covered += line.length + 1
			}

			offset = next_offset
		}

		// Create "chunks" of covered/uncovered lines for easier rendering later on
		let chunks = [
			{
				start_line: 1,
				is_covered: line_coverage[0] === 1,
				end_line: 1,
				total_lines: 1,
			},
		]

		for (let index = 1; index < line_coverage.length; index++) {
			let is_covered = line_coverage[index]
			if (is_covered !== line_coverage[index - 1]) {
				let last_chunk = chunks.at(-1)!
				last_chunk.end_line = index
				last_chunk.total_lines = index - last_chunk.start_line + 1

				chunks.push({
					start_line: index + 1,
					is_covered: is_covered === 1,
					end_line: index,
					total_lines: 0,
				})
			}
		}

		let last_chunk = chunks.at(-1)!
		last_chunk.total_lines = line_coverage.length + 1 - last_chunk.start_line
		last_chunk.end_line = line_coverage.length

		return {
			url,
			text,
			ranges,
			unused_bytes: file_total_bytes - file_bytes_covered,
			used_bytes: file_bytes_covered,
			total_bytes: file_total_bytes,
			line_coverage_ratio: ratio(file_lines_covered, total_file_lines),
			byte_coverage_ratio: ratio(file_bytes_covered, file_total_bytes),
			line_coverage,
			total_lines: total_file_lines,
			covered_lines: file_lines_covered,
			uncovered_lines: total_file_lines - file_lines_covered,
			chunks,
		}
	})

	// Calculate total coverage for all stylesheets combined
	let { total_lines, total_covered_lines, total_uncovered_lines, total_bytes, total_used_bytes, total_unused_bytes } =
		coverage_per_stylesheet.reduce(
			(totals, sheet) => {
				totals.total_lines += sheet.total_lines
				totals.total_covered_lines += sheet.covered_lines
				totals.total_uncovered_lines += sheet.uncovered_lines
				totals.total_bytes += sheet.total_bytes
				totals.total_used_bytes += sheet.used_bytes
				totals.total_unused_bytes += sheet.unused_bytes
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
		used_bytes: total_used_bytes,
		covered_lines: total_covered_lines,
		unused_bytes: total_unused_bytes,
		uncovered_lines: total_uncovered_lines,
		byte_coverage_ratio: ratio(total_used_bytes, total_bytes),
		line_coverage_ratio: ratio(total_covered_lines, total_lines),
		coverage_per_stylesheet,
		total_stylesheets: coverage_per_stylesheet.length,
	}
}

export type { Coverage, Range } from './parse-coverage.ts'
export { parse_coverage } from './parse-coverage.ts'
export type { Parser } from './types.ts'
