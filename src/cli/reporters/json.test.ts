import { test, expect } from '@playwright/test'
import { print_lines as print } from './json'
import type { Report } from '../program'
import type { CoverageResult } from '../../lib'
import type { CliArguments } from '../arguments'

type Sheet = CoverageResult['coverage_per_stylesheet'][number]

function sheet(url: string, covered_lines: number, total_lines: number): Sheet {
	return {
		url,
		covered_lines,
		total_lines,
		line_coverage_ratio: covered_lines / total_lines,
	} as Sheet
}

const sheets = [sheet('a.css', 10, 10), sheet('b.css', 3, 10), sheet('c.css', 6, 10)]

function create_report(file_expected?: number): Report {
	return {
		context: {
			coverage: { line_coverage_ratio: 0.63, coverage_per_stylesheet: sheets } as CoverageResult,
			duration: 1,
			json_files_found: 2,
		},
		report: {
			ok: true,
			min_line_coverage: { ok: true, expected: 0.5, actual: 0.63 },
			min_file_line_coverage: { ok: true, expected: file_expected, actual: 0.3 },
		},
	}
}

function show(value: CliArguments['show-uncovered']) {
	return { 'show-uncovered': value } as CliArguments
}

// Parse the output and return the urls of the sheets it lists
function urls(lines: string[]): string[] {
	let output = JSON.parse(lines[0]!) as Report
	return output.context.coverage.coverage_per_stylesheet.map((sheet) => sheet.url)
}

test('prints a single line of JSON', () => {
	let lines = print(create_report(), show('all'))
	expect(lines).toHaveLength(1)
	expect(lines[0]).not.toContain('\n')
	expect(() => JSON.parse(lines[0]!)).not.toThrow()
})

test('includes the report and the rest of the context', () => {
	let report = create_report(0.5)
	let output = JSON.parse(print(report, show('none'))[0]!) as Report
	expect(output.report).toEqual(report.report)
	expect(output.context.duration).toBe(1)
	expect(output.context.json_files_found).toBe(2)
	expect(output.context.coverage.line_coverage_ratio).toBe(0.63)
})

test.describe('--show-uncovered', () => {
	test('none: lists no sheets', () => {
		expect(urls(print(create_report(0.8), show('none')))).toEqual([])
	})

	test('all: lists every sheet that is not fully covered', () => {
		expect(urls(print(create_report(), show('all')))).toEqual(['b.css', 'c.css'])
	})

	test('violations: lists sheets below --min-file-coverage', () => {
		expect(urls(print(create_report(0.5), show('violations')))).toEqual(['b.css'])
	})

	test('violations: a sheet exactly at the threshold is not listed', () => {
		expect(urls(print(create_report(0.6), show('violations')))).toEqual(['b.css'])
	})

	test('violations: lists no sheets without --min-file-coverage', () => {
		expect(urls(print(create_report(), show('violations')))).toEqual([])
	})
})

test('does not modify the report passed in', () => {
	let report = create_report(0.5)
	print(report, show('none'))
	expect(report.context.coverage.coverage_per_stylesheet).toEqual(sheets)
})
