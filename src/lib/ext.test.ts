import { test, expect } from '@playwright/test'
import { ext } from './ext.js'

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
	expect.soft(ext('https://example.com/')).toBe('')
	expect.soft(ext('https://example.com/dir.v2/page')).toBe('')
})

test('relative urls', () => {
	expect.soft(ext('style.css')).toBe('css')
	expect.soft(ext('/assets/style.css')).toBe('css')
	expect.soft(ext('/assets/style.css?v=1#hash')).toBe('css')
	expect.soft(ext('/dir.v2/page')).toBe('')
})
