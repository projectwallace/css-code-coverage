import { test, expect } from '@playwright/test'
import { remap_html } from './remap-html'
import { DOMParser } from 'linkedom'

function html_parser(html: string) {
	return new DOMParser().parseFromString(html, 'text/html')
}

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
	let result = remap_html(html_parser, html, [{ start: 1, end: 2 }])
	expect(result).toEqual({
		css: '',
		ranges: [],
	})
})

test('skips white-space-only style block', () => {
	let html = create_html(`<style>\t\t\t\n\n</style>`)
	let result = remap_html(html_parser, html, [{ start: 1, end: 2 }])
	expect(result).toEqual({
		css: '',
		ranges: [],
	})
})

test('remaps a single style block', () => {
	let css = `h1 { color: red; }`
	let html = create_html(`<style>${css}</style>`, `<h1>Hello world</h1>`)
	let range = { start: html.indexOf(css), end: html.indexOf(css) + css.length }
	let result = remap_html(html_parser, html, [range])
	expect(result).toEqual({
		css,
		ranges: [{ start: 0, end: css.length }],
	})
})

test('remaps multiple style blocks', () => {
	let css_head = `h1 { color: red; }`
	let css_body = `h2 { font-size: 24px; }`
	let html = create_html(`<style>${css_head}</style>`, `<style>${css_body}</style>`)
	let range_head = { start: html.indexOf(css_head), end: html.indexOf(css_head) + css_head.length }
	let range_body = { start: html.indexOf(css_body), end: html.indexOf(css_body) + css_body.length }
	let result = remap_html(html_parser, html, [range_head, range_body])
	expect(result).toEqual({
		css: css_head + css_body,
		ranges: [
			{ start: 0, end: css_head.length },
			{ start: css_head.length, end: css_head.length + css_body.length },
		],
	})
})
