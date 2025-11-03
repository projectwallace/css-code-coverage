import { test, expect } from '@playwright/test'
import { filter_coverage } from './filter-entries.js'
import { Coverage } from './parse-coverage.js'

test('filters out JS files', () => {
	let entries = [
		{
			url: 'http://example.com/script.js',
			text: 'console.log("Hello world")',
			ranges: [{ start: 0, end: 25 }],
		},
	] satisfies Coverage[]
	expect(entries.reduce<Coverage[]>((acc, entry) => filter_coverage(acc, entry), [])).toEqual([])
})

test('keeps files with CSS extension', () => {
	let entries = [
		{
			url: 'http://example.com/styles.css',
			text: 'a{color:red}',
			ranges: [{ start: 0, end: 13 }],
		},
	] satisfies Coverage[]
	expect(entries.reduce<Coverage[]>((acc, entry) => filter_coverage(acc, entry), [])).toEqual(entries)
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
	] satisfies Coverage[]
	expect(entries.reduce<Coverage[]>((acc, entry) => filter_coverage(acc, entry), [])).toEqual(expected)
})

test('keeps extension-less URL with CSS text (running coverage in vite dev mode)', () => {
	let entries = [
		{
			url: 'http://example.com',
			text: 'a{color:red;}',
			ranges: [{ start: 0, end: 13 }],
		},
	] satisfies Coverage[]
	expect(entries.reduce<Coverage[]>((acc, entry) => filter_coverage(acc, entry), [])).toEqual(entries)
})

test('filters out extension-less JS', () => {
	let entries = [
		{
			url: 'http://example.com',
			text: 'var a = 10; console.log(a);',
			ranges: [{ start: 0, end: 29 }],
		},
	] satisfies Coverage[]
	expect(entries.reduce<Coverage[]>((acc, entry) => filter_coverage(acc, entry), [])).toEqual([])
})
