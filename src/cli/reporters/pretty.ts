import { styleText } from 'node:util'
import { should_show, type Report } from '../program.js'
import type { CliArguments } from '../arguments.js'

const NUM_CONTEXT_LINES = 3
const number_formatter = new Intl.NumberFormat()

// Re-indent because tabs in the terminal tend to be bigger than usual
function indent(line?: string): string {
	return (line || '').replace(/^\t+/, (tabs) => ' '.repeat(tabs.length * 4))
}

let line_number = (num: number) => `${num.toString().padStart(5, ' ')} │ `

function percentage(ratio: number, decimals: number = 2): string {
	return `${(ratio * 100).toFixed(ratio === 1 ? 0 : decimals)}%`
}

function number(num: number): string {
	return number_formatter.format(num)
}

function plural(count: number, singular: string, plural: string): string {
	return count === 1 ? singular : plural
}

function tip(
	threshold: number,
	{ total_lines, covered_lines }: { total_lines: number; covered_lines: number },
	label: string,
): string {
	let lines_to_cover = Math.ceil(threshold * total_lines - covered_lines)
	return `Tip: cover ${number(lines_to_cover)} more ${plural(lines_to_cover, 'line', 'lines')} to meet the ${label} of ${percentage(threshold)}`
}

export type TextStyle =
	| 'bold'
	| 'red'
	| 'dim'
	| 'green'
	| 'magenta'
	| 'cyan'
	| 'blue'
	| 'blueBright'
	| 'magentaBright'
	| 'cyanBright'
	| 'greenBright'

type StyleTextFn = (style: TextStyle | TextStyle[], input: string) => string

export type PrintLinesDependencies = {
	styleText: StyleTextFn
	print_width?: number
}

type Sheet = Report['context']['coverage']['coverage_per_stylesheet'][number]

function highlight(css: string, styleText: StyleTextFn): string {
	// Style everything except `suffix`, which is appended unstyled
	let wrap = (style: TextStyle, suffix: string) =>
		styleText(style, css.slice(0, -suffix.length)) + suffix

	// atrule
	if (css.trim().startsWith('@')) {
		let space_pos = css.indexOf(' ', css.indexOf('@'))
		if (space_pos === -1) {
			space_pos = css.length - 1
		}
		// Statement at-rule like `@layer a, b;` or `@import url(x.css);`
		let end = css.endsWith(';') ? ';' : css.endsWith('{}') ? '{}' : '{'
		return (
			styleText('blueBright', css.slice(0, space_pos)) +
			styleText('magentaBright', css.slice(space_pos, -end.length)) +
			end
		)
	}

	// declaration
	if (css.includes(':') && css.endsWith(';')) {
		let colon = css.indexOf(':')
		return styleText('cyanBright', css.slice(0, colon)) + css.slice(colon)
	}
	// empty rule
	if (css.endsWith('{}')) {
		return wrap('greenBright', '{}')
	}
	// selector,
	if (css.endsWith(',')) {
		return wrap('greenBright', ',')
	}
	// selector {
	if (css.endsWith('{')) {
		return wrap('greenBright', '{')
	}
	return css // closing }, empty line, or anything unrecognised
}

function print_sheet(
	sheet: Sheet,
	min_file_line_coverage: number,
	{ styleText, print_width }: Required<PrintLinesDependencies>,
): string[] {
	let divider = styleText('dim', '─'.repeat(print_width))
	let { line_coverage_ratio, covered_lines, total_lines, url } = sheet
	let output = [
		divider,
		`File: ${url}`,
		`Coverage: ${percentage(line_coverage_ratio)}, ${covered_lines}/${total_lines} lines covered`,
	]

	if (line_coverage_ratio < min_file_line_coverage) {
		output.push(tip(min_file_line_coverage, sheet, 'file threshold'))
	}
	output.push(divider)

	let lines = sheet.text.split('\n')
	let uncovered_chunks = sheet.chunks.filter((chunk) => !chunk.is_covered)
	// Keep track of the last printed line so context lines of chunks that are close
	// together are not printed twice
	let last_printed_line = 0

	for (let [index, chunk] of uncovered_chunks.entries()) {
		let next_chunk = uncovered_chunks[index + 1]
		let from = Math.max(chunk.start_line - NUM_CONTEXT_LINES, 1, last_printed_line + 1)
		// Stop trailing context lines before the next uncovered chunk
		let to = Math.min(
			chunk.end_line + NUM_CONTEXT_LINES,
			lines.length,
			(next_chunk?.start_line ?? Infinity) - 1,
		)

		// Show empty line between non-contiguous blocks
		if (last_printed_line > 0 && from > last_printed_line + 1) {
			output.push('')
		}

		for (let n = from; n <= to; n++) {
			let line = indent(lines[n - 1])
			let is_uncovered = n >= chunk.start_line && n <= chunk.end_line
			output.push(
				is_uncovered
					? styleText('red', '▌') + styleText('dim', line_number(n)) + highlight(line, styleText)
					: ' ' + styleText('dim', line_number(n) + line),
			)
		}
		last_printed_line = to
	}

	output.push('')
	return output
}

function print_summary(
	{ report, context }: Report,
	params: CliArguments,
	styleText: StyleTextFn,
): string[] {
	let output: string[] = []
	let success = (message: string) =>
		output.push(`${styleText(['bold', 'green'], 'Success')}: ${message}`)
	let failure = (message: string) =>
		output.push(`${styleText(['bold', 'red'], 'Failed')}: ${message}`)
	let { coverage, json_files_found, duration } = context

	let entries = coverage.total_files_found
	let entries_label = `${number(entries)} coverage ${plural(entries, 'entry', 'entries')}`
	let source =
		json_files_found === undefined
			? entries_label
			: `${number(json_files_found)} JSON ${plural(json_files_found, 'file', 'files')} (${entries_label})`
	output.push(
		`Finished in ${number(Math.round(duration))}ms on ${source} containing ${number(coverage.total_stylesheets)} stylesheets with ${number(coverage.total_lines)} lines of CSS in total.`,
	)

	let { actual, expected, ok } = report.min_line_coverage
	if (ok) {
		success(`total line coverage is ${percentage(actual)}`)
	} else {
		failure(
			`line coverage is ${percentage(actual)} which is lower than the threshold of ${percentage(expected)}`,
		)
		output.push(tip(expected, coverage, 'threshold'))
	}

	let file_coverage = report.min_file_line_coverage
	if (file_coverage.expected !== undefined) {
		let { expected, actual } = file_coverage
		if (file_coverage.ok) {
			success(`all files pass minimum line coverage of ${percentage(expected)}`)
		} else {
			let num_failed = coverage.coverage_per_stylesheet.filter(
				(sheet) => sheet.line_coverage_ratio < expected,
			).length
			failure(
				`${number(num_failed)} ${plural(num_failed, 'file does', 'files do')} not meet the minimum line coverage of ${percentage(expected)} (minimum coverage was ${percentage(actual)})`,
			)
			if (params['show-uncovered'] === 'none') {
				output.push(`  Hint: set --show-uncovered=violations to see which files didn't pass`)
			}
		}
	}

	return output
}

export function print_lines(
	{ report, context }: Report,
	params: CliArguments,
	{ styleText, print_width = 80 }: PrintLinesDependencies,
): string[] {
	let min_file_line_coverage = report.min_file_line_coverage.expected ?? 0
	let show = params['show-uncovered']
	let sheets =
		show === 'none'
			? []
			: context.coverage.coverage_per_stylesheet.filter((sheet) =>
					should_show(sheet, show, min_file_line_coverage),
				)

	return [
		...sheets
			.toSorted((a, b) => a.line_coverage_ratio - b.line_coverage_ratio)
			.flatMap((sheet) => print_sheet(sheet, min_file_line_coverage, { styleText, print_width })),
		...print_summary({ report, context }, params, styleText),
	]
}

export function print(report: Report, params: CliArguments): void {
	let logger = report.report.ok ? console.log : console.error

	// One write instead of one per line
	logger(
		print_lines(report, params, {
			styleText,
			print_width: process.stdout.columns,
		}).join('\n'),
	)
}
