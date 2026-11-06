import { test, expect } from '@playwright/test'
import { print_lines as print } from './tap'
import type { Report } from '../program'
import type { CoverageResult } from '../../lib'

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

function create_report({
	line_ok = true,
	file_expected,
	file_ok = true,
}: {
	line_ok?: boolean
	file_expected?: number
	file_ok?: boolean
}): Report {
	return {
		context: {
			coverage: { coverage_per_stylesheet: sheets } as CoverageResult,
			duration: 1,
		},
		report: {
			ok: line_ok && file_ok,
			min_line_coverage: { ok: line_ok, expected: 0.5, actual: 0.63 },
			min_file_line_coverage: { ok: file_ok, expected: file_expected, actual: 0.3 },
		},
	}
}

// The TAP plan (`1..N`) must match the number of test points that are printed
function expect_plan_matches_tests(lines: string[]) {
	let plan = lines.find((line) => /^1\.\.\d+$/.test(line))!
	let test_points = lines.filter((line) => /^(not )?ok \d+ - /.test(line))
	expect(plan).toBe(`1..${test_points.length}`)
}

test.describe('without --min-file-coverage', () => {
	test('plans and prints only the overall check, even when there are sheets', () => {
		let lines = print(create_report({}))
		expect(lines).toEqual(['TAP version 13', '1..1', 'ok 1 - overall line coverage'])
		expect_plan_matches_tests(lines)
	})

	test('reports a failing overall check', () => {
		let lines = print(create_report({ line_ok: false }))
		expect(lines).toEqual(['TAP version 13', '1..1', 'not ok 1 - overall line coverage'])
	})
})

test.describe('with --min-file-coverage', () => {
	test('all files pass', () => {
		let lines = print(create_report({ file_expected: 0.3 }))
		expect(lines).toEqual([
			'TAP version 13',
			'1..5',
			'ok 1 - overall line coverage',
			'ok 2 - line coverage per file',
			'ok 3 - a.css',
			'ok 4 - b.css',
			'ok 5 - c.css',
		])
		expect_plan_matches_tests(lines)
	})

	test('a sheet exactly at the threshold passes', () => {
		let lines = print(create_report({ file_expected: 0.6, file_ok: false }))
		expect(lines).toContain('ok 5 - c.css')
	})

	test('failing files report their own coverage, not the global minimum', () => {
		let lines = print(create_report({ line_ok: false, file_expected: 0.8, file_ok: false }))
		expect(lines).toEqual([
			'TAP version 13',
			'1..5',
			'not ok 1 - overall line coverage',
			'not ok 2 - line coverage per file',
			'  ---',
			'  expected_min_coverage: 0.8',
			'  actual_min_coverage: 0.3',
			'  ...',
			'ok 3 - a.css',
			'not ok 4 - b.css',
			'  ---',
			'  expected_coverage: 0.8',
			'  actual_coverage: 0.3',
			'  lines_covered: 3',
			'  total_lines: 10',
			'  ...',
			'not ok 5 - c.css',
			'  ---',
			'  expected_coverage: 0.8',
			'  actual_coverage: 0.6',
			'  lines_covered: 6',
			'  total_lines: 10',
			'  ...',
		])
		expect_plan_matches_tests(lines)
	})
})
