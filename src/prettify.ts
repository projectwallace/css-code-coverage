import { format } from '@projectwallace/format-css'
import type { Range, Coverage } from './parse-coverage.ts'
// css-tree tokens: https://github.com/csstree/csstree/blob/be5ea1257009960c04cccdb58bb327263e27e3b3/lib/tokenizer/types.js
import { tokenize, tokenTypes } from 'css-tree/tokenizer'

export function prettify(coverage: Coverage[]): Coverage[] {
	return coverage.map(({ url, text, ranges }) => {
		if (!text) {
			return { url, text, ranges }
		}
		let formatted = format(text)
		let irrelevant_tokens: Set<number> = new Set([
			tokenTypes.EOF,
			tokenTypes.BadString,
			tokenTypes.BadUrl,
			tokenTypes.WhiteSpace,
			tokenTypes.Semicolon,
			tokenTypes.Comment,
			tokenTypes.Colon,
		])

		// Initialize the ranges with an empty array of token indexes
		let ext_ranges: (Range & { tokens: number[] })[] = ranges.map(({ start, end }) => ({ start, end, tokens: [] }))

		function is_in_range(start: number, end: number): number {
			let range_index = 0
			for (let range of ext_ranges) {
				if (range.start > end) return -1
				if (range.start <= start && range.end >= end) {
					return range_index
				}
				range_index++
			}
			return -1
		}

		let index = 0

		tokenize(text, (type, start, end) => {
			if (irrelevant_tokens.has(type)) return
			index++

			// format-css changes the Url token to a Function,String,RightParenthesis token sequence
			if (type === tokenTypes.Url) {
				index += 2
			}

			let range_index = is_in_range(start, end)
			if (range_index !== -1) {
				ext_ranges[range_index]!.tokens.push(index)
			}
		})

		let new_tokens: Map<number, Range> = new Map()
		index = 0

		tokenize(formatted, (type, start, end) => {
			if (irrelevant_tokens.has(type)) return
			index++

			// format-css changes the Url token to a Function,String,RightParenthesis token sequence
			if (type === tokenTypes.Url) {
				index += 2
			}

			new_tokens.set(index, { start, end })
		})

		let new_ranges: Range[] = []

		for (let range of ext_ranges) {
			let start_token = new_tokens.get(range.tokens.at(0)!)
			let end_token = new_tokens.get(range.tokens.at(-1)!)
			if (start_token !== undefined && end_token !== undefined) {
				new_ranges.push({
					start: start_token.start,
					end: end_token.end,
				})
			}
		}

		return { url, text: formatted, ranges: new_ranges }
	})
}
