import { test, expect } from '@playwright/test'
import { generate_coverage } from '../test/generate-coverage.ts'
import { calculate_coverage } from './index.ts'
import type { Coverage } from './parse-coverage.ts'
import { format } from '@projectwallace/format-css'
import { DOMParser } from 'linkedom'

function html_parser(html: string) {
	return new DOMParser().parseFromString(html, 'text/html')
}

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
		coverage = await generate_coverage(html)
	})

	test('counts totals', () => {
		let result = calculate_coverage(coverage, html_parser)
		expect.soft(result.total_files_found).toBe(1)
		expect.soft(result.total_bytes).toBe(77)
		expect.soft(result.covered_bytes).toBe(41)
		expect.soft(result.uncovered_bytes).toBe(36)
		expect.soft(result.total_lines).toBe(16)
		expect.soft(result.covered_lines).toBe(10)
		expect.soft(result.uncovered_lines).toBe(6)
		expect.soft(result.line_coverage_ratio).toBe(10 / 16)
		expect.soft(result.total_stylesheets).toBe(1)
	})

	test('calculates stats per stylesheet', () => {
		let result = calculate_coverage(coverage, html_parser)
		let sheet = result.coverage_per_stylesheet.at(0)!
		expect.soft(sheet.url).toBe('http://localhost/test.html')
		expect.soft(sheet.chunks.map(({ css, ...rest }) => ({ ...rest }))).toEqual([
			{ start_offset: 0, end_offset: 0, start_line: 1, end_line: 1, is_covered: false, total_lines: 1 }, // TODO: fix
			{ start_offset: 0, end_offset: 21, start_line: 2, end_line: 6, is_covered: true, total_lines: 5 },
			{ start_offset: 21, end_offset: 58, start_line: 7, end_line: 10, is_covered: false, total_lines: 4 },
			{ start_offset: 58, end_offset: 78, start_line: 11, end_line: 15, is_covered: true, total_lines: 5 },
			{ start_offset: 78, end_offset: 77, start_line: 16, end_line: 16, is_covered: false, total_lines: 1 }, // TODO: fix
		])
		expect.soft(sheet.total_lines).toBe(16)
		expect.soft(sheet.covered_lines).toBe(10)
		expect.soft(sheet.uncovered_lines).toBe(6)
		expect.soft(sheet.line_coverage_ratio).toBe(10 / 16)
	})
})

test.describe('from <link rel="stylesheet">', () => {
	let coverage: Coverage[]
	let css = `
			body { margin: 0; }

			p { color: green }

			h1 { color: red; }

			x { color: purple }
		`.trim()

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
		coverage = await generate_coverage(html, { link_css: css })
	})

	test('counts totals', () => {
		let result = calculate_coverage(coverage, html_parser)
		expect.soft(result.total_files_found).toBe(1)
		expect.soft(result.total_bytes).toBe(79)
		expect.soft(result.covered_bytes).toBe(40)
		expect.soft(result.uncovered_bytes).toBe(39)
		expect.soft(result.total_lines).toBe(15)
		expect.soft(result.covered_lines).toBe(9)
		expect.soft(result.uncovered_lines).toBe(6)
		expect.soft(result.line_coverage_ratio).toBe(9 / 15)
		expect.soft(result.total_stylesheets).toBe(1)
		expect.soft(result.covered_bytes + result.uncovered_bytes).toEqual(result.total_bytes)
	})

	test('calculates stats per stylesheet', () => {
		let result = calculate_coverage(coverage, html_parser)
		let sheet = result.coverage_per_stylesheet.at(0)!
		expect.soft(sheet.url).toBe('http://localhost/style.css')
		expect.soft(sheet.chunks.map(({ css, ...rest }) => ({ ...rest }))).toEqual([
			{ start_offset: 0, end_offset: 20, start_line: 1, end_line: 4, total_lines: 4, is_covered: true },
			{ start_offset: 20, end_offset: 39, start_line: 5, end_line: 7, total_lines: 3, is_covered: false },
			{ start_offset: 39, end_offset: 59, start_line: 8, end_line: 12, total_lines: 5, is_covered: true },
			{ start_offset: 59, end_offset: 79, start_line: 13, end_line: 15, total_lines: 3, is_covered: false },
		])
		expect.soft(sheet.total_lines).toBe(15)
		expect.soft(sheet.covered_lines).toBe(9)
		expect.soft(sheet.uncovered_lines).toBe(6)
		expect.soft(sheet.line_coverage_ratio).toBe(9 / 15)
		// expect.soft(sheet.text).toEqual(format(css))
	})
})

test.describe('chunks', () => {
	test('calculates chunks for fully covered file', () => {
		let result = calculate_coverage(
			[
				{
					url: 'https://example.com/style.css',
					ranges: [
						{
							start: 0,
							end: 19,
						},
					],
					text: 'h1 { color: blue; }',
				},
			],
			html_parser,
		)
		expect.soft(result.coverage_per_stylesheet.at(0)?.text).toEqual('h1 {\n\tcolor: blue;\n}\n')
		expect.soft(result.coverage_per_stylesheet.at(0)?.chunks).toEqual([
			{
				start_line: 1,
				is_covered: true,
				end_line: 4,
				total_lines: 4,
				css: 'h1 {\n\tcolor: blue;\n}\n',
				start_offset: 0,
				end_offset: 'h1 {\n\tcolor: blue;\n}\n'.length - 1,
			},
		])
	})

	test('calculates chunks for fully uncovered file', () => {
		let result = calculate_coverage(
			[
				{
					url: 'https://example.com/style.css',
					ranges: [],
					text: 'h1 { color: blue; }',
				},
			],
			html_parser,
		)
		expect.soft(result.coverage_per_stylesheet.at(0)?.chunks).toEqual([
			{
				start_line: 1,
				is_covered: false,
				end_line: 3,
				total_lines: 3,
				css: format('h1 { color: blue; }'),
				start_offset: 0,
				end_offset: 19,
			},
		])
	})
})

test('handles empty input', () => {
	let result = calculate_coverage([], html_parser)
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

test.describe('garbage input', () => {
	test('garbage Array', () => {
		expect(() =>
			calculate_coverage(
				[
					{
						test: 1,
						garbage: true,
					},
				] as unknown as Coverage[],
				html_parser,
			),
		).toThrow('No valid coverage data found')
	})

	test('garbage Object', () => {
		expect(() =>
			calculate_coverage(
				{
					test: 1,
					garbage: true,
				} as unknown as Coverage[],
				html_parser,
			),
		).toThrow('No valid coverage data found')
	})
})
