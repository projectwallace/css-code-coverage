import { test, expect } from '@playwright/test'
import { extend_ranges } from './extend-ranges'
import { generate_coverage } from './test/generate-coverage'
import type { Coverage } from './parse-coverage'

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
</html>`

test.describe('leaves ranges intact when nothing to change', () => {
	test('lonely rule', async () => {
		let css = `body{color:green}`
		let coverage = (await generate_coverage(html, { link_css: css })) as Coverage[]

		// Expect the incomplete coverage reported by the browser
		expect(coverage.at(0)!.ranges).toEqual([{ start: 0, end: 17 }])

		let result = extend_ranges(coverage[0])
		expect(result.ranges).toEqual([{ start: 0, end: 17 }])
	})
})

test.describe('@rules', () => {
	test('lonely @media', async () => {
		let css = `@media (min-width:100px){body{color:green}}`
		let coverage = (await generate_coverage(html, { link_css: css })) as Coverage[]

		// Expect the incomplete coverage reported by the browser
		expect(coverage.at(0)!.ranges).toEqual([{ start: 7, end: 42 }]) // (min-width:100px){body{color:green}

		let result = extend_ranges(coverage[0])
		expect(result.ranges).toEqual([{ start: 0, end: 43 }]) // @media (min-width:100px){body{color:green}}
	})

	test.describe('adjecent to uncovered code', () => {
		test('@media at end', async () => {
			let css = `a{}@media (min-width:100px){body{color:green}}`
			let coverage = (await generate_coverage(html, { link_css: css })) as Coverage[]

			// Expect the incomplete coverage reported by the browser
			expect(coverage.at(0)!.ranges).toEqual([{ start: 10, end: 45 }]) // (min-width:100px){body{color:green}

			let result = extend_ranges(coverage[0])
			expect(result.ranges).toEqual([{ start: 3, end: 46 }]) // @media (min-width:100px){body{color:green}}
		})

		test('@media at start', async () => {
			let css = `@media (min-width:100px){body{color:green}}a{}`
			let coverage = (await generate_coverage(html, { link_css: css })) as Coverage[]

			// Expect the incomplete coverage reported by the browser
			expect(coverage.at(0)!.ranges).toEqual([{ start: 7, end: 42 }]) // (min-width:100px){body{color:green}

			let result = extend_ranges(coverage[0])
			expect(result.ranges).toEqual([{ start: 0, end: 43 }]) // @media (min-width:100px){body{color:green}}
		})
	})

	test.describe('adjecent to covered code', () => {
		test('@media at end', async () => {
			let css = `p{color:red}@media (min-width:100px){body{color:green}}`
			let coverage = (await generate_coverage(html, { link_css: css })) as Coverage[]

			// Expect the incomplete coverage reported by the browser
			expect(coverage[0]).toEqual({
				url: 'http://localhost/style.css',
				text: css,
				ranges: [
					{ start: 0, end: 12 }, // p{color:red}
					{ start: 19, end: 54 }, // (min-width:100px){body{color:green}
				],
			})

			let result = extend_ranges(coverage[0])
			expect(result).toEqual({
				url: 'http://localhost/style.css',
				text: css,
				ranges: [
					{ start: 0, end: 12 }, // p{color:red}
					{ start: 12, end: 55 }, // @media (min-width:100px){body{color:green}}
				],
			})
		})

		test('@media at start', async () => {
			let css = `@media (min-width:100px){body{color:green}}p{color:red}`
			let coverage = (await generate_coverage(html, { link_css: css })) as Coverage[]

			// Expect the incomplete coverage reported by the browser
			expect(coverage[0]).toEqual({
				url: 'http://localhost/style.css',
				text: css,
				ranges: [
					{ start: 7, end: 42 }, // (min-width:100px){body{color:green}
					{ start: 43, end: 55 }, // p{color:red}
				],
			})

			let result = extend_ranges(coverage[0])
			expect(result).toEqual({
				url: 'http://localhost/style.css',
				text: css,
				ranges: [
					{ start: 0, end: 43 }, // @media (min-width:100px){body{color:green}}
					{ start: 43, end: 55 }, // p{color:red}
				],
			})
		})
	})
})
