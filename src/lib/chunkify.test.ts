import { test, expect } from '@playwright/test'
import { chunkify, type ChunkedCoverage } from './chunkify'

test('creates chunks with outer chunks covered', () => {
	let coverage = {
		text: 'a { color: red; } b { color: green; } c { color: blue; }',
		ranges: [
			{ start: 0, end: 17 },
			{ start: 38, end: 56 },
		],
		url: 'https://example.com',
	}
	let result = chunkify(coverage)
	delete coverage.ranges
	expect(result).toEqual({
		...coverage,
		chunks: [
			{
				start_offset: 0,
				end_offset: 17,
				is_covered: true,
			},
			{
				start_offset: 17,
				end_offset: 38,
				is_covered: false,
			},
			{
				start_offset: 38,
				end_offset: 56,
				is_covered: true,
			},
		],
	} satisfies ChunkedCoverage)
})

test('creates chunks with only middle chunk covered', () => {
	let coverage = {
		text: 'a { color: red; } b { color: green; } c { color: blue; }',
		ranges: [{ start: 17, end: 38 }],
		url: 'https://example.com',
	}
	let result = chunkify(coverage)
	delete coverage.ranges
	expect(result).toEqual({
		...coverage,
		chunks: [
			{
				start_offset: 0,
				end_offset: 17,
				is_covered: false,
			},
			{
				start_offset: 17,
				end_offset: 38,
				is_covered: true,
			},
			{
				start_offset: 38,
				end_offset: 56,
				is_covered: false,
			},
		],
	} satisfies ChunkedCoverage)
})

test('creates a single chunk when all is covered', () => {
	let coverage = {
		text: 'a { color: red; } b { color: green; } c { color: blue; }',
		ranges: [{ start: 0, end: 56 }],
		url: 'https://example.com',
	}
	let result = chunkify(coverage)
	delete coverage.ranges
	expect(result).toEqual({
		...coverage,
		chunks: [
			{
				start_offset: 0,
				end_offset: 56,
				is_covered: true,
			},
		],
	} satisfies ChunkedCoverage)
})

test('creates a single chunk when none is covered', () => {
	let coverage = {
		text: 'a { color: red; } b { color: green; } c { color: blue; }',
		ranges: [],
		url: 'https://example.com',
	}
	let result = chunkify(coverage)
	delete coverage.ranges
	expect(result).toEqual({
		...coverage,
		chunks: [
			{
				start_offset: 0,
				end_offset: 56,
				is_covered: false,
			},
		],
	} satisfies ChunkedCoverage)
})

test('includes a trailing uncovered chunk when the last byte is not covered', () => {
	// text length = 4; range covers first 3 bytes, leaving the last byte uncovered
	let coverage = {
		text: 'abcd',
		ranges: [{ start: 0, end: 3 }],
		url: 'https://example.com',
	}
	let result = chunkify(coverage)
	delete coverage.ranges
	expect(result).toEqual({
		...coverage,
		chunks: [
			{ start_offset: 0, end_offset: 3, is_covered: true },
			{ start_offset: 3, end_offset: 4, is_covered: false },
		],
	} satisfies ChunkedCoverage)
})

test('does not emit a spurious empty chunk when the last byte is covered', () => {
	// range covers the full text — no trailing chunk should appear
	let coverage = {
		text: 'abcd',
		ranges: [{ start: 0, end: 4 }],
		url: 'https://example.com',
	}
	let result = chunkify(coverage)
	delete coverage.ranges
	expect(result).toEqual({
		...coverage,
		chunks: [{ start_offset: 0, end_offset: 4, is_covered: true }],
	} satisfies ChunkedCoverage)
})

test('merges adjacent same-coverage chunks separated by whitespace-only gap', () => {
	// The whitespace-only uncovered chunk between two covered chunks should be
	// absorbed so the two covered chunks merge into one. This is handled by the
	// early `continue` at the top of merge(), not the else-if branch.
	let coverage = {
		text: 'a{color:red}\n\nb{color:blue}',
		//           ^12  ^14 — the \n\n gap is whitespace-only
		ranges: [
			{ start: 0, end: 12 },
			{ start: 14, end: 26 },
		],
		url: 'https://example.com',
	}
	let result = chunkify(coverage)
	delete coverage.ranges
	expect(result).toEqual({
		...coverage,
		chunks: [{ start_offset: 0, end_offset: 26, is_covered: true }],
	} satisfies ChunkedCoverage)
})

test('absorbs a zero-length covered chunk into the surrounding uncovered chunk', () => {
	// A zero-length range (start === end) produces an empty chunk.
	// The empty chunk should not appear in the output.
	let coverage = {
		text: 'a{color:red}',
		ranges: [{ start: 5, end: 5 }],
		url: 'https://example.com',
	}
	let result = chunkify(coverage)
	delete coverage.ranges
	expect(result).toEqual({
		...coverage,
		chunks: [{ start_offset: 0, end_offset: 12, is_covered: false }],
	} satisfies ChunkedCoverage)
})
