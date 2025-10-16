import type { Coverage } from './parse-coverage'
import { type ChunkedCoverage } from './chunkify'
import { format } from '@projectwallace/format-css'

export type PrettifiedChunk = ChunkedCoverage['chunks'][0] & {
	start_line: number
	end_line: number
	total_lines: number
	css: string
}

export type PrettifiedCoverage = Omit<Coverage, 'ranges'> & {
	chunks: PrettifiedChunk[]
}

export function prettify(stylesheet: ChunkedCoverage): PrettifiedCoverage {
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
