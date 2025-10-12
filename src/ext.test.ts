import { test, expect } from '@playwright/test'
import { ext } from './ext.ts'

let valid = [
	'https://example.com/style.css',
	'https://example.com/style.css?version=1',
	'https://example.com/style.css#hash',
	'https://example.com/some-/nested/path/style.css',
	'https://example.com/STYLE.CSS',
]

test('valid cases', () => {
	for (let url of valid) {
		expect.soft(ext(url).toLowerCase()).toBe('css')
	}
})

test('invalid cases', () => {
	expect.soft(ext('')).toBe('')
	expect.soft(ext('test')).toBe('')
	expect.soft(ext('https://example.com/style.css.map')).toBe('map')
	expect.soft(ext('https://example.com/style.css.map?version=1')).toBe('map')
	expect.soft(ext('https://example.com/style.css.map#hash')).toBe('map')
	expect.soft(ext('https://example.com/some-/nested/path/style.css.map')).toBe('map')
	expect.soft(ext('https://example.com/style.scss')).toBe('scss')
})
