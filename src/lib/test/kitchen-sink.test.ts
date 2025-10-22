import { test, expect } from '@playwright/test'
import { calculate_coverage, type Coverage, type CoverageResult } from '../index.js'
import { generate_coverage } from './generate-coverage.js'
import { format } from '@projectwallace/format-css'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

test('project wallace Container component', async () => {
	// Coverage:
	// first rule
	// first MQ
	// second MQ
	// .size-auto { min-width: 120rem; }
	// ...
	// -> skip 5 rules
	// ...
	// .size-3xl { min-width: 80rem; }
	const coverage = [
		{
			url: 'http://localhost:4173/_app/immutable/assets/Container.n-2BXq6O.css',
			text: '.container.svelte-1ginl5v{margin-inline:auto;padding-inline:var(--space-2)}@media (min-width: 44rem){.container.svelte-1ginl5v{padding-inline:var(--space-4)}}@media (min-width: 66rem){.container.svelte-1ginl5v{padding-inline:var(--space-8)}}.size-auto.svelte-1ginl5v{max-width:120rem}.size-sm.svelte-1ginl5v{max-width:28rem}.size-md.svelte-1ginl5v{max-width:32rem}.size-lg.svelte-1ginl5v{max-width:36rem}.size-xl.svelte-1ginl5v{max-width:48rem}.size-2xl.svelte-1ginl5v{max-width:64rem}.size-3xl.svelte-1ginl5v{max-width:80rem}\n',
			ranges: [
				{ start: 0, end: 75 },
				{ start: 82, end: 157 },
				{ start: 165, end: 240 },
				{ start: 241, end: 284 },
				{ start: 485, end: 526 },
			],
		},
	]

	let result = await calculate_coverage(coverage)
	let sheet = result.coverage_per_stylesheet.at(0)!

	expect.soft(sheet.total_lines).toBe(44)
	expect.soft(sheet.chunks).toHaveLength(3)

	let [chunk1, chunk2, chunk3] = sheet.chunks

	expect.soft(chunk1?.start_line).toEqual(1)
	expect.soft(chunk1?.end_line).toEqual(21)
	expect.soft(chunk1?.total_lines).toEqual(21)

	expect.soft(chunk2?.start_line).toEqual(22)
	expect.soft(chunk2?.end_line).toEqual(40)
	expect.soft(chunk2?.total_lines).toEqual(19)

	expect.soft(chunk3?.start_line).toEqual(41)
	expect.soft(chunk3?.end_line).toEqual(44)
	expect.soft(chunk3?.total_lines).toEqual(4)

	expect.soft(sheet.text).toEqual(format(coverage.at(0)!.text))
})

test.describe('comment coverage', () => {
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

	test('leading line comment is marked as uncovered', async () => {
		let css = `
			/* start comment */
			h1 { color: blue; }
		`
		let coverage = (await generate_coverage(html, { link_css: css })) as Coverage[]
		let result = await calculate_coverage(coverage)
		let sheet = result.coverage_per_stylesheet.at(0)!
		expect(
			sheet.chunks.map(({ is_covered, start_line, end_line, total_lines }) => ({ is_covered, start_line, end_line, total_lines })),
		).toEqual([
			{ is_covered: false, start_line: 1, end_line: 1, total_lines: 1 },
			{ is_covered: true, start_line: 2, end_line: 5, total_lines: 4 },
		])
	})

	test('leading block comment is marked as uncovered', async () => {
		let css = `
			/*
			  start comment
			*/
			h1 { color: blue; }
		`
		let coverage = (await generate_coverage(html, { link_css: css })) as Coverage[]
		let result = await calculate_coverage(coverage)
		let sheet = result.coverage_per_stylesheet.at(0)!
		expect(
			sheet.chunks.map(({ is_covered, start_line, end_line, total_lines }) => ({ is_covered, start_line, end_line, total_lines })),
		).toEqual([
			{ is_covered: false, start_line: 1, end_line: 3, total_lines: 3 },
			{ is_covered: true, start_line: 4, end_line: 7, total_lines: 4 },
		])
	})

	test('trailing line comment is marked as uncovered', async () => {
		let css = `
			h1 { color: blue; }
			/* start comment */
		`
		let coverage = (await generate_coverage(html, { link_css: css })) as Coverage[]
		let result = await calculate_coverage(coverage)
		let sheet = result.coverage_per_stylesheet.at(0)!
		expect(
			sheet.chunks.map(({ is_covered, start_line, end_line, total_lines }) => ({ is_covered, start_line, end_line, total_lines })),
		).toEqual([
			{ is_covered: true, start_line: 1, end_line: 4, total_lines: 4 },
			{ is_covered: false, start_line: 5, end_line: 5, total_lines: 1 },
		])
	})

	test('trailing block comment is marked as uncovered', async () => {
		let css = `
			h1 { color: blue; }
			/*
			  start comment
			*/
		`
		let coverage = (await generate_coverage(html, { link_css: css })) as Coverage[]
		let result = await calculate_coverage(coverage)
		let sheet = result.coverage_per_stylesheet.at(0)!
		expect(
			sheet.chunks.map(({ is_covered, start_line, end_line, total_lines }) => ({ is_covered, start_line, end_line, total_lines })),
		).toEqual([
			{ is_covered: true, start_line: 1, end_line: 4, total_lines: 4 },
			{ is_covered: false, start_line: 5, end_line: 7, total_lines: 3 },
		])
	})
})

test.describe('@rules', () => {
	let html = `
			<!doctype html>
			<html>
				<head>
					<title>test document</title>
					<link rel="stylesheet" href="http://localhost/style.css">
				</head>
				<body>
					<h1>Hello world</h1>
					<p>Text</p>
				</body>
			</html>
		`

	test('@media at the start', async () => {
		let css = `
				@media (min-width: 100px) {
					body {
						color: green;
					}
				}

				a { color: orangered; }
			`
		let coverage = (await generate_coverage(html, { link_css: css })) as Coverage[]
		let result = await calculate_coverage(coverage)
		let sheet = result.coverage_per_stylesheet.at(0)!

		expect(sheet.chunks.map(({ is_covered, start_line, total_lines }) => ({ is_covered, start_line, total_lines }))).toEqual([
			{ is_covered: true, start_line: 1, total_lines: 6 },
			{ is_covered: false, start_line: 7, total_lines: 3 },
		])
	})

	test('@media in middle', async () => {
		let css = `
				a { color: red; }

				@media (min-width: 100px) {
					body {
						color: green;
					}
				}

				a { color: orangered; }
			`
		let coverage = (await generate_coverage(html, { link_css: css })) as Coverage[]
		let result = await calculate_coverage(coverage)
		let sheet = result.coverage_per_stylesheet.at(0)!

		expect(
			sheet.chunks.map(({ is_covered, start_line, end_line, total_lines }) => ({ is_covered, start_line, end_line, total_lines })),
		).toEqual([
			{ is_covered: false, start_line: 1, end_line: 3, total_lines: 3 },
			{ is_covered: true, start_line: 4, end_line: 10, total_lines: 7 },
			{ is_covered: false, start_line: 11, end_line: 13, total_lines: 3 },
		])
	})

	test('@media at the end', async () => {
		let css = `
			a { color: orangered; }

			@media (min-width: 100px) {
				body {
					color: green;
				}
			}
		`
		let coverage = (await generate_coverage(html, { link_css: css })) as Coverage[]
		expect(coverage.at(0)!.ranges.map(({ start, end }) => css.substring(start, end))).toEqual([
			`(min-width: 100px) `,
			`body {\n\t\t\t\t\tcolor: green;\n\t\t\t\t}`,
		])

		let result = await calculate_coverage(coverage)
		let sheet = result.coverage_per_stylesheet.at(0)!

		expect(
			sheet.chunks.map(({ is_covered, start_line, end_line, total_lines }) => ({ is_covered, start_line, end_line, total_lines })),
		).toEqual([
			{ is_covered: false, start_line: 1, end_line: 3, total_lines: 3 },
			{ is_covered: true, start_line: 4, end_line: 9, total_lines: 6 },
		])
	})
})

test.describe('Wallace mega soverage suite', () => {
	let coverage: Coverage[]

	test.beforeAll(async () => {
		let file_contents = await fs.readFile(path.resolve('./src/lib/test/wallace.json'), 'utf-8')
		coverage = JSON.parse(file_contents)
	})

	test('CopyButton has full coverage', async () => {
		let data = coverage.find(({ url }) => url.includes('CopyButton')) as Coverage
		let result = await calculate_coverage([data])
		expect.soft(result.line_coverage_ratio).toBe(1)
		expect.soft(result.total_lines).toBe(17)
	})

	test('Meter has full coverage', async () => {
		let data = coverage.find(({ url }) => url.includes('Meter')) as Coverage
		let result = await calculate_coverage([data])
		expect.soft(result.line_coverage_ratio).not.toBe(1)
		expect.soft(result.total_lines).toBe(35)

		let sheet = result.coverage_per_stylesheet.at(0)!
		expect.soft(sheet.chunks.map(({ is_covered, start_line, end_line }) => ({ is_covered, start_line, end_line }))).toEqual([
			{ is_covered: true, start_line: 1, end_line: 22 },
			{ is_covered: false, start_line: 23, end_line: 35 },
		])
	})
})
