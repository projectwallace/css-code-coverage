import type { Coverage } from './parse-coverage'

export type ChunkedCoverage = Coverage & {
	chunks: {
		start_offset: number
		end_offset: number
		is_covered: boolean
	}[]
}

// TODO: get rid of empty chunks, merge first/last with adjecent covered block
export function chunkify_stylesheet(stylesheet: Coverage): ChunkedCoverage {
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
