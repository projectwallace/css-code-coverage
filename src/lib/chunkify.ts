import { tokenize } from '@projectwallace/css-parser/tokenizer'
import type { WeightedCoverage } from './decuplicate.js'

type Chunk = {
	start_offset: number
	end_offset: number
	coverage_count: number
	is_covered: boolean
}

export type ChunkedCoverage = Omit<WeightedCoverage, 'ranges'> & {
	chunks: Chunk[]
}

const WHITESPACE_ONLY_REGEX = /^\s+$/

function merge(stylesheet: ChunkedCoverage): ChunkedCoverage {
	let new_chunks: Chunk[] = []
	let previous_chunk: Chunk | undefined

	for (let i = 0; i < stylesheet.chunks.length; i++) {
		let chunk = stylesheet.chunks.at(i)!

		// If the current chunk is only whitespace or empty, ignore it
		if (WHITESPACE_ONLY_REGEX.test(stylesheet.text.slice(chunk.start_offset, chunk.end_offset))) {
			continue
		}

		let latest_chunk = new_chunks.at(-1)

		// merge current and previous if they have the same coverage status
		if (i > 0 && previous_chunk && latest_chunk) {
			if (previous_chunk.is_covered === chunk.is_covered) {
				latest_chunk.end_offset = chunk.end_offset
				// keep the highest count seen across merged covered chunks
				if (chunk.coverage_count > latest_chunk.coverage_count) {
					latest_chunk.coverage_count = chunk.coverage_count
				}
				previous_chunk = chunk
				continue
			}
			// If the current chunk is empty (zero-length range), absorb it into the previous
			else if (chunk.end_offset === chunk.start_offset) {
				latest_chunk.end_offset = chunk.end_offset
				// do not update previous_chunk
				continue
			}
		}

		previous_chunk = chunk
		new_chunks.push(chunk)
	}

	return {
		...stylesheet,
		chunks: new_chunks,
	}
}

export function mark_comments_as_covered(stylesheet: ChunkedCoverage): ChunkedCoverage {
	let new_chunks: Chunk[] = []

	for (let chunk of stylesheet.chunks) {
		if (chunk.is_covered) {
			new_chunks.push(chunk)
			continue
		}

		let text = stylesheet.text.slice(chunk.start_offset, chunk.end_offset)
		let comments: Array<{ start: number; end: number }> = []

		for (const _ of tokenize(text, ({ start, end }) => comments.push({ start, end }))) {
			// consume the generator to drive the on_comment callback
		}

		if (comments.length === 0) {
			new_chunks.push(chunk)
			continue
		}

		let last_end = 0
		for (let comment of comments) {
			if (comment.start > last_end) {
				new_chunks.push({
					start_offset: chunk.start_offset + last_end,
					end_offset: chunk.start_offset + comment.start,
					is_covered: false,
					coverage_count: 0,
				})
			}
			new_chunks.push({
				start_offset: chunk.start_offset + comment.start,
				end_offset: chunk.start_offset + comment.end,
				is_covered: true,
				coverage_count: 1,
			})
			last_end = comment.end
		}

		if (last_end < text.length) {
			new_chunks.push({
				start_offset: chunk.start_offset + last_end,
				end_offset: chunk.end_offset,
				is_covered: false,
				coverage_count: 0,
			})
		}
	}

	return merge({ ...stylesheet, chunks: new_chunks })
}

export function chunkify(stylesheet: WeightedCoverage): ChunkedCoverage {
	let chunks: Chunk[] = []
	let offset = 0

	for (let range of stylesheet.ranges) {
		// Create non-covered chunk
		if (offset !== range.start) {
			chunks.push({
				start_offset: offset,
				end_offset: range.start,
				is_covered: false,
				coverage_count: 0,
			})
			offset = range.start
		}

		chunks.push({
			start_offset: range.start,
			end_offset: range.end,
			is_covered: true,
			coverage_count: range.count,
		})
		offset = range.end
	}

	// fill up last chunk if necessary:
	if (offset < stylesheet.text.length) {
		chunks.push({
			start_offset: offset,
			end_offset: stylesheet.text.length,
			is_covered: false,
			coverage_count: 0,
		})
	}

	let merged = merge({
		url: stylesheet.url,
		text: stylesheet.text,
		chunks,
	})

	return merged
}
