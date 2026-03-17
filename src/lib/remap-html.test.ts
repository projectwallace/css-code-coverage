import { test, expect } from '@playwright/test'
import { remap_html } from './remap-html.js'

function create_html(head?: string, body?: string) {
	return `
		<!doctype html>
		<html>
			<head>
				${head ?? ''}
			</head>
			<body>
				${body ?? ''}
			</body>
		</html>
	`
}

test('skips empty style block', () => {
	let html = create_html('<style></style>')
	let result = remap_html(html, [{ start: 1, end: 2 }])
	expect(result).toEqual({
		css: '',
		ranges: [],
	})
})

test('skips white-space-only style block', () => {
	let html = create_html(`<style>\t\t\t\n\n</style>`)
	let result = remap_html(html, [{ start: 1, end: 2 }])
	expect(result).toEqual({
		css: '',
		ranges: [],
	})
})

test('remaps a single style block', () => {
	let css = `h1 { color: red; }`
	let html = create_html(`<style>${css}</style>`, `<h1>Hello world</h1>`)
	let range = { start: html.indexOf(css), end: html.indexOf(css) + css.length }
	let result = remap_html(html, [range])
	expect(result).toEqual({
		css,
		ranges: [{ start: 0, end: css.length }],
	})
})

test('remaps correctly when two style blocks have identical content', () => {
	let css = `h1 { color: red; }`
	// Two style tags with identical CSS — indexOf always finds the first occurrence,
	// so a range inside the second block falls outside [first_start, first_end] and gets dropped
	let html = `<style>${css}</style><style>${css}</style>`
	let second_start = html.lastIndexOf('<style>') + '<style>'.length
	let range = { start: second_start, end: second_start + css.length }
	let result = remap_html(html, [range])
	expect(result).toEqual({
		css: css + css,
		ranges: [{ start: css.length, end: css.length * 2 }],
	})
})

test('remaps multiple style blocks', () => {
	let css_head = `h1 { color: red; }`
	let css_body = `h2 { font-size: 24px; }`
	let html = create_html(`<style>${css_head}</style>`, `<style>${css_body}</style>`)
	let range_head = { start: html.indexOf(css_head), end: html.indexOf(css_head) + css_head.length }
	let range_body = { start: html.indexOf(css_body), end: html.indexOf(css_body) + css_body.length }
	let result = remap_html(html, [range_head, range_body])
	expect(result).toEqual({
		css: css_head + css_body,
		ranges: [
			{ start: 0, end: css_head.length },
			{ start: css_head.length, end: css_head.length + css_body.length },
		],
	})
})
