import { expect, test } from '@playwright/test'
import { program } from './program'
import { Coverage } from '../lib'

// Line coverage: 4 covered, 3 uncovered
let coverage = [
	{
		url: 'example.com',
		text: 'abcdefg { color: red; } abcdefg { color: green; }',
		ranges: [{ start: 0, end: 23 }],
	},
] satisfies Coverage[]

test('returns context', () => {
	let result = program({ min_file_coverage: 0.5 }, coverage)
	expect.soft(result.context.coverage.covered_lines).toEqual(4)
	expect.soft(result.context.coverage.total_files_found).toEqual(1)
})

test.describe('--min-file-coverage', () => {
	test('Success: --min-file-coverage=0.5', () => {
		let result = program({ min_file_coverage: 0.5 }, coverage)
		expect(result.report.ok).toBeTruthy()
	})

	test('Failure: --min-file-coverage=1', () => {
		let result = program({ min_file_coverage: 1 }, coverage)
		expect(result.report.ok).toBeFalsy()
	})
})

test.describe('--min-file-line-coverage', () => {
	test('Success: --min-file-line-coverage=0.5', () => {
		let result = program({ min_file_coverage: 0, min_file_line_coverage: 0.5 }, coverage)
		expect(result.report.ok).toBeTruthy()
	})

	test('Failure: --min-file-line-coverage=1', () => {
		let result = program({ min_file_coverage: 0, min_file_line_coverage: 1 }, coverage)
		expect(result.report.ok).toBeFalsy()
	})
})
