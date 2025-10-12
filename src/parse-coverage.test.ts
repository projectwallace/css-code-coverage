import { test, expect } from '@playwright/test'
import { parse_coverage } from './parse-coverage.ts'

test('parses valid JSON', () => {
	let input = `
	[
		{
			"url": "example.com",
			"text": "a{color:red}",
			"ranges": [
				{ "start": 0, "end": 13 }
			]
		}
	]
	`
	let result = parse_coverage(input)
	expect(result).toEqual([
		{
			url: 'example.com',
			text: 'a{color:red}',
			ranges: [{ start: 0, end: 13 }],
		},
	])
})

test('allows entries without text', () => {
	let input = `
	[
		{
			"url": "example.com",
			"ranges": [
				{ "start": 0, "end": 13 }
			]
		}
	]
	`
	let result = parse_coverage(input)
	expect(result).toEqual([
		{
			url: 'example.com',
			ranges: [{ start: 0, end: 13 }],
		},
	])
})

test('returns empty array for invalid JSON', () => {
	let input = `invalid json`
	let result = parse_coverage(input)
	expect(result).toEqual([])
})

test('returns empty array for JSON not matching schema', () => {
	let input = `
	[
		{
			"url": "example.com",
			"ranges": [
				{ "start": 0 }
			]
		}
	]
	`
	let result = parse_coverage(input)
	expect(result).toEqual([])
})
