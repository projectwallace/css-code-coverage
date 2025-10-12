import { test, expect } from '@playwright/test'
import { filter_coverage } from './filter-entries.ts'
import { DOMParser } from 'linkedom'

function html_parser(html: string) {
	return new DOMParser().parseFromString(html, 'text/html')
}

test('filters out JS files', () => {
	let entries = [
		{
			url: 'http://example.com/script.js',
			text: 'console.log("Hello world")',
			ranges: [{ start: 0, end: 25 }],
		},
	]
	expect(filter_coverage(entries, html_parser)).toEqual([])
})

test('keeps files with CSS extension', () => {
	let entries = [
		{
			url: 'http://example.com/styles.css',
			text: 'a{color:red}',
			ranges: [{ start: 0, end: 13 }],
		},
	]
	expect(filter_coverage(entries, html_parser)).toEqual(entries)
})

test('keeps extension-less URL with HTML text', () => {
	let entries = [
		{
			url: 'http://example.com',
			text: `<html><style>a{color:red;}</style></html>`,
			ranges: [{ start: 13, end: 26 }],
		},
	]
	let expected = [
		{
			url: 'http://example.com',
			text: 'a{color:red;}',
			ranges: [{ start: 0, end: 13 }], // ranges are remapped
		},
	]
	expect(filter_coverage(entries, html_parser)).toEqual(expected)
})

test('keeps extension-less URL with CSS text (running coverage in vite dev mode)', () => {
	let entries = [
		{
			url: 'http://example.com',
			text: 'a{color:red;}',
			ranges: [{ start: 0, end: 13 }],
		},
	]
	expect(filter_coverage(entries, html_parser)).toEqual(entries)
})

test('skips extension-less URL with HTML text when no parser is provided', () => {
	let entries = [
		{
			url: 'http://example.com',
			text: `<html><style>a{color:red;}</style></html>`,
			ranges: [{ start: 13, end: 26 }],
		},
	]
	expect(filter_coverage(entries)).toEqual([])
})
