import { test, expect } from '@playwright/test'
import { chunkify_stylesheet, type ChunkedCoverage } from './chunkify'

test('creates chunks with outer chunks covered', () => {
	let coverage = {
		text: 'a { color: red; } b { color: green; } c { color: blue; }',
		ranges: [
			{ start: 0, end: 17 },
			{ start: 38, end: 56 },
		],
		url: 'https://example.com',
	}
	let result = chunkify_stylesheet(coverage)
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
	let result = chunkify_stylesheet(coverage)
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
	let result = chunkify_stylesheet(coverage)
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
	let result = chunkify_stylesheet(coverage)
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
