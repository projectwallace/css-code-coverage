import type { Coverage } from './parse-coverage'

const AT_SIGN = 64
const LONGEST_ATRULE_NAME = '@-webkit-font-feature-values'.length

// Returns the char at the first non-whitespace position from `offset`, and that position
function next_non_whitespace(text: string, offset: number): [string, number] {
	let char = text.charAt(offset)
	while (/\s/.test(char)) {
		char = text.charAt(++offset)
	}
	return [char, offset]
}

// Mutates the ranges of `coverage` in place
export function extend_ranges(coverage: Coverage): Coverage {
	let { ranges, text } = coverage

	for (let index = 0; index < ranges.length; index++) {
		let range = ranges[index]!
		let prev_range = ranges[index - 1]

		// Adjust ranges to include @-rule name (only preludes included)
		// Heuristic: atrule names are no longer than LONGEST_ATRULE_NAME
		for (let i = range.start; i >= range.start - LONGEST_ATRULE_NAME; i--) {
			// Make sure to not overlap with the previous range
			if (prev_range && prev_range.end > i) {
				break
			}

			if (text.charCodeAt(i) === AT_SIGN) {
				range.start = i
				// Look if the next character might be the opening { of the atrule's block
				if (next_non_whitespace(text, range.end)[0] === '{') {
					range.end++
				}
				break
			}
		}

		// If the next non-whitespace character is }, add it to the current range
		// Cannot reliably include closing } because it may not be the end of the range
		let [char, offset] = next_non_whitespace(text, range.end)
		if (char === '}') {
			range.end = offset + 1
		}
	}

	return coverage
}
