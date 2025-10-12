import { expect, test } from '@playwright/test'
import { generate_coverage } from './generate-coverage.ts'

test('collects coverage from html <style> tag', async () => {
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
	let coverage = await generate_coverage(html)
	expect.soft(coverage).toHaveLength(1)
	expect.soft(coverage.at(0)).toEqual({
		url: 'http://localhost/test.html',
		text: '\n\t\t\t\t\tbody { margin: 0; }\n\t\t\t\t\tp { color: green } /* not covered */\n\t\t\t\t\th1 { color: red; }\n\t\t\t\t',
		ranges: [
			{ start: 6, end: 25 },
			{ start: 73, end: 91 },
		],
	})
})

test('collects coverage from <link rel="stylesheet">', async () => {
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
	let css = `
			body { margin: 0; }
			p { color: green } /* not covered */
			h1 { color: red; }
		`
	let coverage = await generate_coverage(html, { link_css: css })
	expect.soft(coverage).toHaveLength(1)
	expect.soft(coverage.at(0)).toEqual({
		url: 'http://localhost/style.css',
		text: '\n\t\t\tbody { margin: 0; }\n\t\t\tp { color: green } /* not covered */\n\t\t\th1 { color: red; }\n\t\t',
		ranges: [
			{ start: 4, end: 23 },
			{ start: 67, end: 85 },
		],
	})
})

test.describe('coverage quirks', () => {
	test('coverage does not include the prelude and name of an atrule', async () => {
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
		let css = `
				@media all {
					h1 {
						color: green;
					}
				}
				@supports (display: grid) {
					h1 {
						font-size: 24px;
					}
				}
			`
		let coverage = await generate_coverage(html, { link_css: css })
		expect.soft(coverage).toHaveLength(1)
		let sheet = coverage.at(0)!
		expect.soft(sheet?.ranges).toEqual([
			{ start: 12, end: 16 },
			{ start: 23, end: 54 },
			{ start: 75, end: 91 },
			{ start: 98, end: 132 },
		])
		// Browser coverage data always skips the `@` symbol with the atrule name
		// as well as the opening `{` and closing `}` of the atrule.
		expect.soft(sheet.text!.substring(12, 16)).toBe('all ')
		expect.soft(sheet.text!.substring(23, 54)).toBe('h1 {\n\t\t\t\t\t\tcolor: green;\n\t\t\t\t\t}')
		expect.soft(sheet.text!.substring(75, 91)).toBe('(display: grid) ')
		expect.soft(sheet.text!.substring(98, 132)).toBe('h1 {\n\t\t\t\t\t\tfont-size: 24px;\n\t\t\t\t\t}')
	})
})
