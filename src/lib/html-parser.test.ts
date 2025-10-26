import { test, expect } from '@playwright/test'
import { DOMParser, type Element } from './html-parser'

let parse: (html: string) => Element[]

test.beforeAll(() => {
	parse = function (html: string) {
		return new DOMParser().parseFromString(`<html>${html}</html>`, 'text/html').querySelectorAll('style')
	}
})

test('finds nothing if there is no <style> tag', () => {
	expect(parse('<p>nope</p>')).toEqual([])
})

test('finds a single <style> tag', () => {
	expect(parse('<style>.css{}</style>')).toEqual([{ textContent: '.css{}' }])
})

test('finds multiple <style> tags', () => {
	expect(
		parse(`
		<head>
			<style>.css1{}</style>
		</head>
		<body>
			<style>.css2{}</style>
			<h1>Hello world</h1>
			<p>My text</p>
		</body>
	`),
	).toEqual([{ textContent: '.css1{}' }, { textContent: '.css2{}' }])
})

test('finds style tags with attributes', () => {
	expect(parse('<style data-attr data-testid="yup">.css{}</style>')).toEqual([{ textContent: '.css{}' }])
})

test.describe('invalid tags', () => {
	test('ignores style tags without end tag', () => {
		expect(parse('<style>.css{}')).toEqual([])
	})

	test('ignores style tags without closing opening tag', () => {
		expect(parse('<style .css{}')).toEqual([])
	})

	test('custom element: <style-thing>', () => {
		expect(parse('<style-thing>.css{}</style-thing>')).toEqual([])
	})
})
