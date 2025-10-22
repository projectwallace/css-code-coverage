import type { Coverage } from './parse-coverage'

const AT_SIGN = 64
const LONGEST_ATRULE_NAME = '@-webkit-font-feature-values'.length

export function extend_ranges(coverage: Coverage[]): Coverage[] {
	return coverage.map(({ text, ranges, url }) => {
		// Adjust ranges to include @-rule name (only preludes included)
		// Cannot reliably include closing } because it may not be the end of the range

		console.log('Before extending')
		console.log({
			ranges: ranges.map((r) => ({
				...r,
				text: text.slice(r.start, r.end),
			})),
		})
		console.log()

		for (let range of ranges) {
			// Add @atrule-name to the front of the range
			// Heuristic: atrule names are no longer than 20 characters ('@font-palette-values'.length === 20)
			for (let i = 1; i >= -LONGEST_ATRULE_NAME; i--) {
				let char_position = range.start + i
				if (text.charCodeAt(char_position) === AT_SIGN) {
					// Move the start cursor back to the start of the @-sign
					range.start = char_position

					// Look if the next character might be the opening { of the atrule's block
					// First eat all the whitespace that might be in-between
					let next_offset = range.end
					let next_char = text.charAt(next_offset)

					while (/\s/.test(next_char)) {
						next_offset++
						next_char = text.charAt(next_offset)
					}

					if (next_char === '{') {
						range.end = range.end + 1
					}
					break
				}
			}

			let offset = range.end
			let next_char = text.charAt(offset)
			while (/\s/.test(next_char)) {
				offset++
				next_char = text.charAt(offset)
			}
			if (next_char === '}') {
				range.end = offset + 1
			}
		}

		console.log('EXTENDED RANGES')
		console.log({
			ranges: ranges.map((r) => ({
				...r,
				text: text.slice(r.start, r.end),
			})),
		})
		return { text, ranges, url }
	})
}
