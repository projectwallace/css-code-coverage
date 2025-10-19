// oxlint-disable max-depth
import { styleText } from 'node:util'
import type { Report } from '../program'
import type { CliArguments } from '../arguments'

// Re-indent because tabs in the terminal tend to be bigger than usual
function indent(line?: string): string {
	return (line || '').replace(/^\t+/, (tabs) => ' '.repeat(tabs.length * 4))
}

export function print({ report, context }: Report, params: CliArguments) {
	if (report.min_line_coverage.ok) {
		console.log(`${styleText(['bold', 'green'], 'Success')}: total line coverage is ${(report.min_line_coverage.actual * 100).toFixed(2)}%`)
	} else {
		console.error(
			`${styleText(['bold', 'red'], 'Failed')}: line coverage is ${(report.min_line_coverage.actual * 100).toFixed(
				2,
			)}% which is lower than the threshold of ${report.min_line_coverage.expected}`,
		)
	}

	if (report.min_file_line_coverage.expected !== undefined) {
		let { expected, actual, ok } = report.min_file_line_coverage
		if (ok) {
			console.log(`${styleText(['bold', 'green'], 'Success')}: all files pass minimum line coverage of ${expected * 100}%`)
		} else {
			let num_files_failed = context.coverage.coverage_per_stylesheet.filter((sheet) => sheet.line_coverage_ratio < expected!).length
			console.error(
				`${styleText(['bold', 'red'], 'Failed')}: ${num_files_failed} files do not meet the minimum line coverage of ${
					expected * 100
				}% (minimum coverage was ${(actual * 100).toFixed(2)}%)`,
			)
			if (params['show-uncovered'] === 'none') {
				console.log(`  Hint: set --show-uncovered=violations to see which files didn't pass`)
			}
		}
	}

	// Show un-covered chunks
	if (params['show-uncovered'] !== 'none') {
		const NUM_LEADING_LINES = 3
		const NUM_TRAILING_LINES = NUM_LEADING_LINES
		let terminal_width = process.stdout.columns || 80
		let line_number = (num: number, covered: boolean = true) => `${num.toString().padStart(5, ' ')} ${covered ? '│' : '━'} `
		let min_file_line_coverage = report.min_file_line_coverage.expected

		for (let sheet of context.coverage.coverage_per_stylesheet.sort((a, b) => a.line_coverage_ratio - b.line_coverage_ratio)) {
			if (
				(sheet.line_coverage_ratio !== 1 && params['show-uncovered'] === 'all') ||
				(min_file_line_coverage !== undefined &&
					min_file_line_coverage !== 0 &&
					sheet.line_coverage_ratio < min_file_line_coverage &&
					params['show-uncovered'] === 'violations')
			) {
				console.log()
				console.log(styleText('dim', '─'.repeat(terminal_width)))
				console.log(sheet.url)
				console.log(`Coverage: ${(sheet.line_coverage_ratio * 100).toFixed(2)}%, ${sheet.covered_lines}/${sheet.total_lines} lines covered`)

				if (min_file_line_coverage && min_file_line_coverage !== 0 && sheet.line_coverage_ratio < min_file_line_coverage) {
					let lines_to_cover = min_file_line_coverage * sheet.total_lines - sheet.covered_lines
					console.log(`Tip: cover ${Math.ceil(lines_to_cover)} more lines to meet the file threshold of ${min_file_line_coverage * 100}%`)
				}
				console.log(styleText('dim', '─'.repeat(terminal_width)))

				let lines = sheet.text.split('\n')
				let line_coverage = sheet.line_coverage

				for (let i = 0; i < lines.length; i++) {
					if (line_coverage[i] === 1) continue

					// Rewind cursor N lines to render N previous lines
					for (let j = i - NUM_LEADING_LINES; j < i; j++) {
						// Make sure that we don't try to start before line 0
						if (j >= 0) {
							console.log(styleText('dim', line_number(j)), styleText('dim', indent(lines[j])))
						}
					}

					// Render uncovered lines while increasing cursor until reaching next covered block
					while (line_coverage[i] === 0) {
						console.log(styleText('red', line_number(i, false)), indent(lines[i]))
						i++
					}

					// Forward cursor N lines to render N trailing lines
					for (let end = i + NUM_TRAILING_LINES; i < end && i < lines.length; i++) {
						console.log(styleText('dim', line_number(i)), styleText('dim', indent(lines[i])))
					}

					// Show empty line between blocks
					console.log()
				}
			}
		}
	}
}
