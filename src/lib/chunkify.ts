import { tokenize_cb } from '@projectwallace/css-parser/tokenizer'
import { TOKEN_COMMENT } from '@projectwallace/css-parser/token-types'
import type { Coverage } from './parse-coverage'

type Chunk = {
	start_offset: number
	end_offset: number
	is_covered: boolean
}

export type ChunkedCoverage = Omit<Coverage, 'ranges'> & {
	chunks: Chunk[]
}

const WHITESPACE_ONLY_REGEX = /^\s+$/

function create_chunk(start_offset: number, end_offset: number, is_covered: boolean): Chunk {
	return { start_offset, end_offset, is_covered }
}

function merge(text: string, chunks: Chunk[]): Chunk[] {
	let merged: Chunk[] = []
	let previous_chunk: Chunk | undefined

	for (let chunk of chunks) {
		// If the current chunk is only whitespace, ignore it
		if (WHITESPACE_ONLY_REGEX.test(text.slice(chunk.start_offset, chunk.end_offset))) {
			continue
		}

		let latest_chunk = merged.at(-1)

		// previous_chunk is always set when latest_chunk is
		if (latest_chunk) {
			// merge current and previous if they are both covered or uncovered
			if (previous_chunk!.is_covered === chunk.is_covered) {
				latest_chunk.end_offset = chunk.end_offset
				previous_chunk = chunk
				continue
			}
			// If the current chunk is empty (zero-length range), absorb it into the previous
			// without updating previous_chunk
			if (chunk.end_offset === chunk.start_offset) {
				latest_chunk.end_offset = chunk.end_offset
				continue
			}
		}

		previous_chunk = chunk
		merged.push(chunk)
	}

	return merged
}

// Browsers never report comments as covered, so we split uncovered
// chunks on comments and mark the comments themselves as covered.
function push_uncovered(chunks: Chunk[], text: string, start: number, end: number) {
	let css = text.slice(start, end)
	let last_end = start

	// Skip tokenizing when there cannot be any comment
	if (css.indexOf('/*') !== -1) {
		tokenize_cb(css, (token_type, token_start, token_end) => {
			if (token_type !== TOKEN_COMMENT) {
				return
			}
			let comment_start = start + token_start
			if (comment_start > last_end) {
				chunks.push(create_chunk(last_end, comment_start, false))
			}
			last_end = start + token_end
			chunks.push(create_chunk(comment_start, last_end, true))
		})
	}

	if (last_end < end) {
		chunks.push(create_chunk(last_end, end, false))
	}
}

export function chunkify({ url, text, ranges }: Coverage): ChunkedCoverage {
	let chunks: Chunk[] = []
	let offset = 0

	for (let range of ranges) {
		if (offset !== range.start) {
			push_uncovered(chunks, text, offset, range.start)
		}
		chunks.push(create_chunk(range.start, range.end, true))
		offset = range.end
	}

	if (offset < text.length) {
		push_uncovered(chunks, text, offset, text.length)
	}

	return {
		url,
		text,
		chunks: merge(text, chunks),
	}
}
