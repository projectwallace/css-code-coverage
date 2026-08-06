import { test, expect } from '@playwright/test'
import { deduplicate_entries } from './decuplicate.js'

test('handles a single entry', () => {
	let entry = {
		text: 'a {}',
		ranges: [{ start: 0, end: 4 }],
		url: 'example.com',
	}
	expect(deduplicate_entries([entry])).toEqual([
		{ text: entry.text, url: entry.url, ranges: [{ start: 0, end: 4, count: 1 }] },
	])
})

test('deduplicates a simple duplicate entry', () => {
	let entry = {
		text: 'a {}',
		ranges: [{ start: 0, end: 4 }],
		url: 'example.com',
	}
	expect(deduplicate_entries([entry, entry])).toEqual([
		{ text: entry.text, url: entry.url, ranges: [{ start: 0, end: 4, count: 2 }] },
	])
})

test('merges two identical texts with different URLs and identical ranges', () => {
	let entries = [
		{
			text: 'a {}',
			ranges: [{ start: 0, end: 4 }],
			url: 'example.com/a',
		},
		{
			text: 'a {}',
			ranges: [{ start: 0, end: 4 }],
			url: 'example.com/b',
		},
	]
	let first = entries.at(0)!
	expect(deduplicate_entries(entries)).toEqual([
		{ text: first.text, url: first.url, ranges: [{ start: 0, end: 4, count: 2 }] },
	])
})

test('merges different ranges on identical CSS, different URLs', () => {
	let entries = [
		{
			text: 'a {} b {}',
			ranges: [{ start: 0, end: 4 }],
			url: 'example.com/a',
		},
		{
			text: 'a {} b {}',
			ranges: [{ start: 5, end: 9 }],
			url: 'example.com/b',
		},
	]
	let first = entries.at(0)!
	// [0,4] and [5,9] are adjacent within 1-byte tolerance and same count → merged
	expect(deduplicate_entries(entries)).toEqual([
		{ text: first.text, url: first.url, ranges: [{ start: 0, end: 9, count: 1 }] },
	])
})

test('merges different ranges on identical CSS, identical URLs', () => {
	let entries = [
		{
			text: 'a {} b {}',
			ranges: [{ start: 0, end: 4 }],
			url: 'example.com',
		},
		{
			text: 'a {} b {}',
			ranges: [{ start: 5, end: 9 }],
			url: 'example.com',
		},
	]
	// [0,4] and [5,9] are adjacent within 1-byte tolerance and same count → merged
	expect(deduplicate_entries(entries)).toEqual([
		{ text: entries[0]!.text, url: entries[0]!.url, ranges: [{ start: 0, end: 9, count: 1 }] },
	])
})

test('does not merge different CSS with different URLs and identical ranges', () => {
	let entries = [
		{
			text: 'a {}',
			ranges: [{ start: 0, end: 4 }],
			url: 'example.com/a',
		},
		{
			text: 'b {}',
			ranges: [{ start: 0, end: 4 }],
			url: 'example.com/b',
		},
	]
	expect(deduplicate_entries(entries)).toEqual([
		{ text: entries[0]!.text, url: entries[0]!.url, ranges: [{ start: 0, end: 4, count: 1 }] },
		{ text: entries[1]!.text, url: entries[1]!.url, ranges: [{ start: 0, end: 4, count: 1 }] },
	])
})

test('does not merge different CSS with same URLs and identical ranges', () => {
	let entries = [
		{
			text: 'a {}',
			ranges: [{ start: 0, end: 4 }],
			url: 'example.com',
		},
		{
			text: 'b {}',
			ranges: [{ start: 0, end: 4 }],
			url: 'example.com',
		},
	]
	expect(deduplicate_entries(entries)).toEqual([
		{ text: entries[0]!.text, url: entries[0]!.url, ranges: [{ start: 0, end: 4, count: 1 }] },
		{ text: entries[1]!.text, url: entries[1]!.url, ranges: [{ start: 0, end: 4, count: 1 }] },
	])
})

test('produces count: 2 for overlapping ranges', () => {
	let entries = [
		{
			text: 'a {} b {}',
			ranges: [{ start: 0, end: 9 }],
			url: 'example.com',
		},
		{
			text: 'a {} b {}',
			ranges: [{ start: 3, end: 6 }],
			url: 'example.com',
		},
	]
	expect(deduplicate_entries(entries)).toEqual([
		{
			text: entries[0]!.text,
			url: entries[0]!.url,
			ranges: [
				{ start: 0, end: 3, count: 1 },
				{ start: 3, end: 6, count: 2 },
				{ start: 6, end: 9, count: 1 },
			],
		},
	])
})
