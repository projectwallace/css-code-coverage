import type { Coverage } from './parse-coverage'

type Chunk = {
	start_offset: number
	end_offset: number
	is_covered: boolean
}

export type ChunkedCoverage = Omit<Coverage, 'ranges'> & {
	chunks: Chunk[]
}

function merge(stylesheet: ChunkedCoverage): ChunkedCoverage {
	let new_chunks: Chunk[] = []
	let previous_chunk: Chunk | undefined

	for (let i = 0; i < stylesheet.chunks.length; i++) {
		let chunk = stylesheet.chunks.at(i)!

		// If the current chunk is only whitespace or empty, ignore it
		if (/^\s+$/.test(stylesheet.text.slice(chunk.start_offset, chunk.end_offset))) {
			continue
		}

		// let previous_chunk = stylesheet.chunks.at(i - 1)
		let latest_chunk = new_chunks.at(-1)

		// merge current and previous if they are both covered or uncovered
		if (i > 0 && previous_chunk && latest_chunk) {
			if (previous_chunk.is_covered === chunk.is_covered) {
				latest_chunk.end_offset = chunk.end_offset
				// latest_chunk.css = stylesheet.text.slice(latest_chunk.start_offset, chunk.end_offset)
				previous_chunk = chunk
				continue
			}
			// If the current chunk is only whitespace or empty, add it to the previous
			else if (/^\s+$/.test(stylesheet.text.slice(chunk.start_offset, chunk.end_offset)) || chunk.end_offset === chunk.start_offset) {
				latest_chunk.end_offset = chunk.end_offset
				// latest_chunk.css = stylesheet.text.slice(latest_chunk.start_offset, chunk.end_offset)
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

// TODO: get rid of empty chunks, merge first/last with adjecent covered block + merge chunks
export function chunkify(stylesheet: Coverage): ChunkedCoverage {
	let chunks = []
	let offset = 0

	for (let range of stylesheet.ranges) {
		// Create non-covered chunk
		if (offset !== range.start) {
			chunks.push({
				start_offset: offset,
				end_offset: range.start,
				is_covered: false,
				// css: stylesheet.text.substring(offset, range.start),
			})
			offset = range.start
		}

		chunks.push({
			start_offset: range.start,
			end_offset: range.end,
			is_covered: true,
			// css: stylesheet.text.substring(range.start, range.end),
		})
		offset = range.end
	}

	// fill up last chunk if necessary:
	if (offset !== stylesheet.text.length - 1) {
		chunks.push({
			start_offset: offset,
			end_offset: stylesheet.text.length,
			is_covered: false,
			// css: stylesheet.text.substring(offset, stylesheet.text.length),
		})
	}

	// console.log('before merge')
	// console.log(chunks)

	let merged = merge({
		url: stylesheet.url,
		text: stylesheet.text,
		chunks,
	})

	// console.log('after merge')
	// console.log(merged.chunks)

	return merged
}
