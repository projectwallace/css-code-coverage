import { test, expect } from '@playwright/test'
import { generate_coverage } from './test/generate-coverage.js'
import { calculate_coverage } from './index.js'
import type { Coverage } from './parse-coverage.js'

test.describe('from <style> tag', () => {
	let coverage: Coverage[]

	test.beforeAll(async () => {
		let html = `
			<!doctype html>
				<html>
					<head>
						<title>test document</title>
						<style>
							body { margin: 0; }
							p { color: green } /* not covered */
							h1 { color: red; }
						</style>
					</head>
					<body>
						<h1>Hello world</h1>
					</body>
				</html>
			`
		coverage = (await generate_coverage(html)) as Coverage[]
	})

	test('counts totals', () => {
		let result = calculate_coverage(coverage)
		expect.soft(result.total_files_found).toBe(1)
		expect.soft(result.total_bytes).toBe(76)
		expect.soft(result.covered_bytes).toBe(57)
		expect.soft(result.uncovered_bytes).toBe(19)
		expect.soft(result.total_lines).toBe(12)
		expect.soft(result.covered_lines).toBe(9)
		expect.soft(result.uncovered_lines).toBe(3)
		expect.soft(result.line_coverage_ratio).toBe(9 / 12)
		expect.soft(result.total_stylesheets).toBe(1)
	})

	test('calculates stats per stylesheet', () => {
		let result = calculate_coverage(coverage)
		let sheet = result.coverage_per_stylesheet.at(0)!
		expect.soft(sheet.url).toBe('http://localhost/test.html')
		expect.soft(sheet.total_lines).toBe(12)
		expect.soft(sheet.covered_lines).toBe(9)
		expect.soft(sheet.uncovered_lines).toBe(3)
		expect.soft(sheet.line_coverage_ratio).toBe(9 / 12)
	})
})

test.describe('from <link rel="stylesheet">', () => {
	let coverage: Coverage[]
	let css = `
			body { margin: 0; }
			p { color: green } /* not covered */
			h1 { color: red; }
			p { color: green } /* not covered */
			@media (min-width: 40em) {
				h1 { font-size: 24px; }
			}
		`

	test.beforeAll(async () => {
		let html = `
				<!doctype html>
				<html>
					<head>
						<title>test document</title>
						<link rel="stylesheet" href="http://localhost/style.css">
					</head>
					<body>
						<h1>Hello world</h1>
					</body>
				</html>
			`
		coverage = (await generate_coverage(html, { link_css: css })) as Coverage[]
	})

	test('counts totals', () => {
		let result = calculate_coverage(coverage)
		expect.soft(result.total_files_found).toBe(1)
		expect.soft(result.total_bytes).toBe(170)
		expect.soft(result.covered_bytes).toBe(132)
		expect.soft(result.uncovered_bytes).toBe(38)
		expect.soft(result.total_lines).toBe(23)
		expect.soft(result.covered_lines).toBe(17)
		expect.soft(result.uncovered_lines).toBe(6)
		expect.soft(result.line_coverage_ratio).toBe(17 / 23)
		expect.soft(result.total_stylesheets).toBe(1)
	})

	test('calculates stats per stylesheet', () => {
		let result = calculate_coverage(coverage)
		let sheet = result.coverage_per_stylesheet.at(0)!
		expect.soft(sheet.covered_lines).toBe(17)
		expect.soft(sheet.uncovered_lines).toBe(6)
		expect.soft(sheet.total_lines).toBe(23)
		expect.soft(sheet.url).toEqual('http://localhost/style.css')
		expect
			.soft(
				sheet.chunks.map(({ is_covered, start_line, end_line }) => ({
					is_covered,
					start_line,
					end_line,
				})),
			)
			.toEqual([
				{ is_covered: true, start_line: 1, end_line: 4 },
				{ is_covered: false, start_line: 5, end_line: 7 },
				{ is_covered: true, start_line: 8, end_line: 13 },
				{ is_covered: false, start_line: 14, end_line: 16 },
				{ is_covered: true, start_line: 17, end_line: 23 },
			])
	})
})

test.describe('from coverage data downloaded directly from the browser as JSON', () => {
	// test.skip()
	// This coverage was taken from Edge devtools
	let coverage = [
		{
			url: 'https://example.com',
			ranges: [
				{
					start: 230,
					end: 271,
				},
				{
					start: 323,
					end: 338,
				},
				{
					start: 342,
					end: 367,
				},
				{
					start: 389,
					end: 423,
				},
			],
			text: '<!DOCTYPE html>\n<html lang="en" >\n\n<head>\n  <meta charset="UTF-8">\n  \n  \n  \n\n  <title>Untitled</title>\n\n    <link rel="canonical" href="https://codepen.io/bartveneman/pen/QwydYVy">\n  \n  \n  \n  \n\n  \n  \n  \n</head>\n\n<body>\n  <style>\n\th1 {\n\t\tcolor: blue;\n\t\tfont-size: 24px;\n\t}\n\n\t/* not covered */\n\tp {\n\t\tcolor: red;\n\t}\n\n\t@media (width > 30em) {\n\t\th1 {\n\t\t\tcolor: green;\n\t\t}\n\t}\n</style>\n\n<script>\n\tconsole.log(`I\'m 100% covered`)\n</script>\n\n<h1>Hello world</h1>\n  \n  \n  \n</body>\n\n</html>\n',
		},
	]

	test('counts totals', () => {
		let result = calculate_coverage(coverage)
		expect.soft(result.covered_lines).toBe(12)
		expect.soft(result.uncovered_lines).toBe(3)
		expect.soft(result.total_lines).toBe(15)
		expect.soft(result.total_stylesheets).toBe(1)
	})

	test('extracts and formats css', () => {
		let result = calculate_coverage(coverage)
		expect(result.coverage_per_stylesheet.at(0)?.text).toEqual(
			`h1 {
	color: blue;
	font-size: 24px;
}
/* not covered */

p {
	color: red;
}

@media (width > 30em) {
	h1 {
		color: green;
	}
}`,
		)
	})

	test('calculates line coverage', () => {
		let result = calculate_coverage(coverage)
		let sheet = result.coverage_per_stylesheet.at(0)!
		expect(
			sheet.chunks.map(({ is_covered, start_line, end_line, total_lines }) => ({
				is_covered,
				start_line,
				end_line,
				total_lines,
			})),
		).toEqual([
			{ is_covered: true, start_line: 1, end_line: 6, total_lines: 6 },
			{ is_covered: false, start_line: 7, end_line: 9, total_lines: 3 },
			{ is_covered: true, start_line: 10, end_line: 15, total_lines: 6 },
		])
	})

	test('calculates chunks for fully covered file', () => {
		let result = calculate_coverage([
			{
				url: 'https://example.com',
				ranges: [
					{
						start: 0,
						end: 19,
					},
				],
				text: 'h1 { color: blue; }',
			},
		])
		expect(result.coverage_per_stylesheet.at(0)?.text).toEqual('h1 {\n\tcolor: blue;\n}')
		expect(
			result.coverage_per_stylesheet.at(0)?.chunks.map(({ start_line, end_line, is_covered }) => ({
				start_line,
				end_line,
				is_covered,
			})),
		).toEqual([
			{
				start_line: 1,
				is_covered: true,
				end_line: 3,
			},
		])
	})

	test('calculates chunks for fully uncovered file', () => {
		let result = calculate_coverage([
			{
				url: 'https://example.com',
				ranges: [],
				text: 'h1 { color: blue; }',
			},
		])
		expect(
			result.coverage_per_stylesheet.at(0)?.chunks.map(({ start_line, end_line, is_covered }) => ({
				start_line,
				end_line,
				is_covered,
			})),
		).toEqual([
			{
				start_line: 1,
				is_covered: false,
				end_line: 3,
			},
		])
	})
})

test('handles empty input', () => {
	let result = calculate_coverage([])
	expect(result.total_files_found).toBe(0)
	expect(result.total_bytes).toBe(0)
	expect(result.covered_bytes).toBe(0)
	expect(result.uncovered_bytes).toBe(0)
	expect(result.total_lines).toBe(0)
	expect(result.covered_lines).toBe(0)
	expect(result.uncovered_lines).toBe(0)
	expect(result.line_coverage_ratio).toBe(0)
	expect(result.total_stylesheets).toBe(0)
	expect(result.coverage_per_stylesheet).toEqual([])
})
