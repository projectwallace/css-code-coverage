// oxlint-disable max-depth
import { styleText } from 'node:util'
import type { Report } from '../program.js'
import type { CliArguments } from '../arguments.js'

// Re-indent because tabs in the terminal tend to be bigger than usual
function indent(line?: string): string {
	return (line || '').replace(/^\t+/, (tabs) => ' '.repeat(tabs.length * 4))
}

let line_number = (num: number, covered: boolean = true) => `${num.toString().padStart(5, ' ')} ${covered ? '│' : '━'} `

function percentage(ratio: number, decimals: number = 2): string {
	return `${(ratio * 100).toFixed(ratio === 1 ? 0 : decimals)}%`
}

export type TextStyle = 'bold' | 'red' | 'dim' | 'green'

export type StyleTextFn = (style: TextStyle | TextStyle[], input: string) => string

export type PrintLinesDependencies = {
	styleText: StyleTextFn
	print_width?: number
}

export function print_lines({ report, context }: Report, params: CliArguments, { styleText, print_width }: PrintLinesDependencies) {
	let output: (string | undefined)[] = []

	if (report.min_line_coverage.ok) {
		output.push(`${styleText(['bold', 'green'], 'Success')}: total line coverage is ${percentage(report.min_line_coverage.actual)}`)
	} else {
		output.push(
			`${styleText(['bold', 'red'], 'Failed')}: line coverage is ${percentage(
				report.min_line_coverage.actual,
			)}% which is lower than the threshold of ${report.min_line_coverage.expected}`,
		)
	}

	if (report.min_file_line_coverage.expected !== undefined) {
		let { expected, actual, ok } = report.min_file_line_coverage
		if (ok) {
			output.push(`${styleText(['bold', 'green'], 'Success')}: all files pass minimum line coverage of ${percentage(expected)}`)
		} else {
			let num_files_failed = context.coverage.coverage_per_stylesheet.filter((sheet) => sheet.line_coverage_ratio < expected!).length
			output.push(
				`${styleText(['bold', 'red'], 'Failed')}: ${num_files_failed} ${
					num_files_failed === 1 ? 'file does' : 'files do'
				} not meet the minimum line coverage of ${percentage(expected)} (minimum coverage was ${percentage(actual)})`,
			)
			if (params['show-uncovered'] === 'none') {
				output.push(`  Hint: set --show-uncovered=violations to see which files didn't pass`)
			}
		}
	}

	// Show un-covered chunks
	if (params['show-uncovered'] !== 'none') {
		const NUM_LEADING_LINES = 3
		const NUM_TRAILING_LINES = NUM_LEADING_LINES
		print_width = print_width ?? 80
		let min_file_line_coverage = report.min_file_line_coverage.expected

		for (let sheet of context.coverage.coverage_per_stylesheet.sort((a, b) => a.line_coverage_ratio - b.line_coverage_ratio)) {
			if (
				(sheet.line_coverage_ratio !== 1 && params['show-uncovered'] === 'all') ||
				(min_file_line_coverage !== undefined &&
					min_file_line_coverage !== 0 &&
					sheet.line_coverage_ratio < min_file_line_coverage &&
					params['show-uncovered'] === 'violations')
			) {
				output.push()
				output.push(styleText('dim', '─'.repeat(print_width)))
				output.push(sheet.url)
				output.push(`Coverage: ${percentage(sheet.line_coverage_ratio)}, ${sheet.covered_lines}/${sheet.total_lines} lines covered`)

				if (min_file_line_coverage && min_file_line_coverage !== 0 && sheet.line_coverage_ratio < min_file_line_coverage) {
					let lines_to_cover = min_file_line_coverage * sheet.total_lines - sheet.covered_lines
					output.push(
						`Tip: cover ${Math.ceil(lines_to_cover)} more ${
							lines_to_cover === 1 ? 'line' : 'lines'
						} to meet the file threshold of ${percentage(min_file_line_coverage)}`,
					)
				}
				output.push(styleText('dim', '─'.repeat(print_width)))

				let lines = sheet.text.split('\n')

				for (let chunk of sheet.chunks.filter((chunk) => !chunk.is_covered)) {
					// Render N leading lines
					for (let x = Math.max(chunk.start_line - NUM_LEADING_LINES, 1); x < chunk.start_line; x++) {
						output.push([styleText('dim', line_number(x)), styleText('dim', indent(lines[x - 1]))].join(''))
					}
					// Render the uncovered chunk
					for (let i = chunk.start_line; i <= chunk.end_line; i++) {
						output.push([styleText('red', line_number(i, false)), indent(lines[i - 1])].join(''))
					}
					// Render N trailing lines
					for (let y = chunk.end_line + 1; y < Math.min(chunk.end_line + NUM_TRAILING_LINES, lines.length); y++) {
						output.push([styleText('dim', line_number(y)), styleText('dim', indent(lines[y - 1]))].join(''))
					}
					// Show empty line between blocks
					output.push()
				}
			}
		}
	}

	return output
}

export function print(report: Report, params: CliArguments): void {
	for (let line of print_lines(report, params, { styleText, print_width: process.stdout.columns })) {
		console.log(line)
	}
}
