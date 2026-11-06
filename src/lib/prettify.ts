import { type ChunkedCoverage } from './chunkify'
import { format } from '@projectwallace/format-css'

export type PrettifiedChunk = ChunkedCoverage['chunks'][number] & {
	start_line: number
	end_line: number
	total_lines: number
	css: string
}

export type PrettifiedCoverage = Omit<ChunkedCoverage, 'chunks'> & {
	chunks: PrettifiedChunk[]
}

export function prettify(stylesheet: ChunkedCoverage): PrettifiedCoverage {
	let { chunks } = stylesheet
	let last_index = chunks.length - 1
	let line = 1
	let offset = 0

	let pretty_chunks = chunks.map((chunk, index) => {
		let css = format(stylesheet.text.substring(chunk.start_offset, chunk.end_offset)).trim()

		if (chunk.is_covered) {
			// mark the newline after the previous uncovered block as covered
			if (index > 0) {
				css = '\n' + css
			}
			// mark the line between this chunk and the next one as covered
			if (index < last_index) {
				css += '\n'
			}
		}

		let total_lines = 1
		for (let i = css.indexOf('\n'); i !== -1; i = css.indexOf('\n', i + 1)) {
			total_lines++
		}

		let start_offset = offset
		let start_line = line
		offset += css.length - 1
		line += total_lines

		return {
			is_covered: chunk.is_covered,
			start_offset,
			end_offset: offset,
			start_line,
			end_line: line - 1,
			total_lines,
			css,
		}
	})

	return {
		url: stylesheet.url,
		text: pretty_chunks.map(({ css }) => css).join('\n'),
		chunks: pretty_chunks,
	}
}
