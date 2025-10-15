import { is_valid_coverage, type Coverage, type Range } from './parse-coverage.ts'
import { deduplicate_entries } from './decuplicate.ts'
import { filter_coverage } from './filter-entries.ts'
import type { Parser } from './types.ts'
import { format } from '@projectwallace/format-css'

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
	ranges: Range[]
	chunks: CoverageChunk[]
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

function calculate_stylesheet_coverage({ text, ranges, url, chunks }: LineCoverage): StylesheetCoverage {
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
		ranges,
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
 * WARNING: mutates the ranges array
 */
function include_atrule_name_in_ranges(coverage: Coverage[]): Coverage[] {
	// Adjust ranges to include @-rule name (only preludes included)
	// Note: Cannot reliably include closing } because it may not be the end of the range
	const LONGEST_ATRULE_NAME = '@-webkit-font-feature-values'.length

	for (let stylesheet of coverage) {
		for (let range of stylesheet.ranges) {
			// Heuristic: atrule names are no longer than LONGEST_ATRULE_NAME
			for (let i = 1; i >= -LONGEST_ATRULE_NAME; i--) {
				let char_position = range.start + i
				if (stylesheet.text.charAt(char_position) === '@') {
					range.start = char_position
					break
				}
			}
		}
	}

	return coverage
}

type OffsetChunk = {
	start_offset: number
	end_offset: number
	is_covered: boolean
}

type CoverageChunk = OffsetChunk & {
	start_line: number
	end_line: number
	total_lines: number
	css: string
}

type ChunkifiedCoverage = Coverage & { chunks: OffsetChunk[] }
type LineCoverage = Coverage & { chunks: CoverageChunk[] }

// TODO: get rid of empty chunks, merge first/last with adjecent covered block
function chunkify_stylesheet(stylesheet: Coverage): ChunkifiedCoverage {
	let chunks = []
	let offset = 0

	for (let range of stylesheet.ranges) {
		// Create non-covered chunk
		if (offset !== range.start) {
			chunks.push({
				start_offset: offset,
				end_offset: range.start,
				is_covered: false,
			})
			offset = range.start
		}

		chunks.push({
			start_offset: range.start,
			end_offset: range.end,
			is_covered: true,
		})
		offset = range.end
	}

	// fill up last chunk if necessary:
	if (offset !== stylesheet.text.length) {
		chunks.push({
			start_offset: offset,
			end_offset: stylesheet.text.length,
			is_covered: false,
		})
	}

	return {
		...stylesheet,
		chunks,
	}
}

function prettify(stylesheet: ChunkifiedCoverage): LineCoverage {
	let line = 1
	let offset = 0

	let pretty_chunks = stylesheet.chunks.map((offset_chunk, index) => {
		let css = format(stylesheet.text.slice(offset_chunk.start_offset, offset_chunk.end_offset))

		if (offset_chunk.is_covered) {
			if (index === 0) {
				// mark the line between this chunk and the next on as covered
				css = css + '\n'
			} else if (index === stylesheet.chunks.length - 1) {
				// mark the newline after the previous uncovered block as covered
				css = '\n' + css
			} else {
				// mark the newline after the previous uncovered block as covered
				// and mark the line between this chunk and the next on as covered
				css = '\n' + css + '\n'
			}
		}

		let line_count = css.split('\n').length
		let start_offset = offset
		let end_offset = Math.max(offset + css.length - 1, 0)
		let start_line = line
		let end_line = line + line_count

		line = end_line
		offset = end_offset

		return {
			...offset_chunk,
			start_offset,
			start_line,
			end_line: end_line - 1,
			end_offset,
			css,
			total_lines: end_line - start_line,
		}
	})

	let updated_stylesheet = {
		...stylesheet,
		// TODO: update ranges as well?? Or remove them because we have chunks now
		chunks: pretty_chunks,
		text: pretty_chunks.map(({ css }) => css).join(''),
	}

	return updated_stylesheet
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
	let range_extended = include_atrule_name_in_ranges(deduplicated)
	let chunkified = range_extended.map((stylesheet) => chunkify_stylesheet(stylesheet))
	let prettified = chunkified.map((stylesheet) => prettify(stylesheet))

	// Calculate coverage for each individual stylesheet we found
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
