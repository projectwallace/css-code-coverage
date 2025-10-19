import { test, expect } from '@playwright/test'
import { deduplicate_entries } from './decuplicate.ts'

test('handles a single entry', () => {
	let entry = {
		text: 'a {}',
		ranges: [{ start: 0, end: 4 }],
		url: 'example.com',
	}
	expect(deduplicate_entries([entry])).toEqual([entry])
})

test('deduplicates a simple duplicate entry', () => {
	let entry = {
		text: 'a {}',
		ranges: [{ start: 0, end: 4 }],
		url: 'example.com',
	}
	expect(deduplicate_entries([entry, entry])).toEqual([entry])
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
	expect(deduplicate_entries(entries)).toEqual([{ text: first.text, url: first.url, ranges: first.ranges }])
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
	expect(deduplicate_entries(entries)).toEqual([{ text: first.text, url: first.url, ranges: [first.ranges[0], entries[1]!.ranges[0]] }])
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
	expect(deduplicate_entries(entries)).toEqual([
		{ text: entries[0]!.text, url: entries[0]!.url, ranges: [entries[0]!.ranges[0], entries[1]!.ranges[0]] },
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
		{ text: entries[0]!.text, url: entries[0]!.url, ranges: entries[0]!.ranges },
		{ text: entries[1]!.text, url: entries[1]!.url, ranges: entries[1]!.ranges },
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
		{ text: entries[0]!.text, url: entries[0]!.url, ranges: entries[0]!.ranges },
		{ text: entries[1]!.text, url: entries[1]!.url, ranges: entries[1]!.ranges },
	])
})
