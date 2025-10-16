import type { Coverage } from './parse-coverage'

/**
 * WARNING: mutates the ranges array
 */
export function extend_ranges(coverage: Coverage[]): Coverage[] {
	// Adjust ranges to include @-rule name (only preludes included)
	// Note: Cannot reliably include closing } because it may not be the end of the range
	const LONGEST_ATRULE_NAME = '@-webkit-font-feature-values'.length

	for (let stylesheet of coverage) {
		for (let range of stylesheet.ranges) {
			// Heuristic: atrule names are no longer than LONGEST_ATRULE_NAME
			for (let i = 1; i >= -LONGEST_ATRULE_NAME; i--) {
				let char_position = range.start + i
				if (stylesheet.text.charAt(char_position) === '@') {
					range.start = char_position
					break
				}
			}
		}
	}

	return coverage
}
