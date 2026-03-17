import { test, expect } from '@playwright/test'
import { prettify } from './prettify'
import { chunkify } from './chunkify'

test('includes the last character of each chunk', () => {
	// The closing brace '}' is the last character of the covered range.
	// With the off-by-one bug (end_offset - 1) it would be silently dropped.
	let chunked = chunkify({
		text: 'a{color:red}',
		ranges: [{ start: 0, end: 12, count: 1 }],
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

test('prettified.text is the formatted output, not the original', () => {
	let original = 'a{color:red}'
	let chunked = chunkify({
		text: original,
		ranges: [{ start: 0, end: original.length, count: 1 }],
		url: 'https://example.com',
	})
	let result = prettify(chunked)

	// The formatted output differs from the minified original
	expect(result.text).not.toBe(original)
	// It contains proper whitespace that was absent in the original
	expect(result.text).toContain('color: red')
})

test('offsets in prettified result are based on formatted CSS length, not original byte positions', () => {
	let original = 'a{color:red}'
	let chunked = chunkify({
		text: original,
		ranges: [{ start: 0, end: original.length, count: 1 }],
		url: 'https://example.com',
	})
	let result = prettify(chunked)
	let chunk = result.chunks[0]

	// The formatted CSS is longer than the original, so offsets must differ
	expect(result.text.length).toBeGreaterThan(original.length)
	expect(chunk.end_offset).toBeGreaterThan(original.length - 1)
})

test('offsets index into prettified.text and yield formatted CSS, not original CSS', () => {
	let original = 'a{color:red}'
	let chunked = chunkify({
		text: original,
		ranges: [{ start: 0, end: original.length, count: 1 }],
		url: 'https://example.com',
	})
	let result = prettify(chunked)
	let chunk = result.chunks[0]

	// Substring with prettified offsets returns formatted CSS, not the original
	let recovered = result.text.substring(chunk.start_offset, chunk.end_offset + 1)
	expect(recovered).not.toBe(original)
	expect(recovered).toContain('color: red')
})
