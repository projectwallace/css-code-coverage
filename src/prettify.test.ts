import { test, expect } from '@playwright/test'
import { prettify } from './prettify.ts'

test('simple rule prettification', () => {
	let entries = [
		{
			url: 'example.com',
			text: 'a+b{color:red}',
			ranges: [{ start: 0, end: 14 }],
		},
	]
	let prettified = [
		{
			url: 'example.com',
			text: `a + b {\n\tcolor: red;\n}`,
			ranges: [{ start: 0, end: 22 }],
		},
	]
	expect(prettify(entries)).toEqual(prettified)
})

test('Handles new tokens added by css formatter', () => {
	let entries = [
		{
			url: 'example.com',
			text: 'a{color:red}b{color:green}',
			ranges: [{ start: 0, end: 26 }],
		},
	]
	let prettified = [
		{
			url: 'example.com',
			text: `a {\n\tcolor: red;\n}\n\nb {\n\tcolor: green;\n}`,
			ranges: [{ start: 0, end: 40 }],
		},
	]
	expect(prettify(entries)).toEqual(prettified)
})

test('atrule prettification', () => {
	let entries = [
		{
			url: 'example.com',
			text: '@supports (display:grid){a+b{color:red}}',
			ranges: [{ start: 0, end: 40 }],
		},
	]
	let prettified = [
		{
			url: 'example.com',
			text: `@supports (display: grid) {\n\ta + b {\n\t\tcolor: red;\n\t}\n}`,
			ranges: [{ start: 0, end: 55 }],
		},
	]
	expect(prettify(entries)).toEqual(prettified)
})
