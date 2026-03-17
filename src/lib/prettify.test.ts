import { test, expect } from '@playwright/test'
import { prettify } from './prettify'
import { chunkify } from './chunkify'

test('includes the last character of each chunk', () => {
	// The closing brace '}' is the last character of the covered range.
	// With the off-by-one bug (end_offset - 1) it would be silently dropped.
	let chunked = chunkify({
		text: 'a{color:red}',
		ranges: [{ start: 0, end: 12 }],
		url: 'https://example.com',
	})
	let result = prettify(chunked)
	expect(result.chunks[0].css.trimEnd()).toContain('}')
})

test('simple range at start', () => {})
test('simple range at middle', () => {})
test('simple range at end', () => {})

test('atrule at start', () => {})
test('atrule at middle', () => {})
test('atrule at end', () => {})
