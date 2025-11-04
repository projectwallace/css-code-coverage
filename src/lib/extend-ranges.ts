import type { Coverage } from './parse-coverage'

const AT_SIGN = 64
const LONGEST_ATRULE_NAME = '@-webkit-font-feature-values'.length

export function extend_ranges(coverage: Coverage): Coverage {
	let { ranges, url, text } = coverage
	// Adjust ranges to include @-rule name (only preludes included)
	// Cannot reliably include closing } because it may not be the end of the range
	let new_ranges = ranges.map((range, index) => {
		let prev_range = ranges[index - 1]
		// Add @atrule-name to the front of the range
		// Heuristic: atrule names are no longer than LONGEST_ATRULE_NAME
		for (let i = range.start; i >= range.start - LONGEST_ATRULE_NAME; i--) {
			// Make sure to not overlap with the previous range
			if (prev_range && prev_range.end > i) {
				break
			}

			let char_position = i
			if (text.charCodeAt(char_position) === AT_SIGN) {
				// Move the start cursor back to the start of the @-sign
				range.start = char_position

				// Look if the next character might be the opening { of the atrule's block
				let next_offset = range.end
				let next_char = text.charAt(next_offset)
				// First eat all the whitespace that might be in-between
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

		// If the next non-whitespace character is }, add it to the current range
		let offset = range.end
		let next_char = text.charAt(offset)
		while (/\s/.test(next_char)) {
			offset++
			next_char = text.charAt(offset)
		}
		if (next_char === '}') {
			range.end = offset + 1
		}

		return range
	})

	return { text, ranges: new_ranges, url }
}
