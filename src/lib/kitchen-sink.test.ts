import { test, expect } from '@playwright/test'
import { calculate_coverage } from '.'
import { DOMParser } from 'linkedom'

function parse_html(html: string) {
	return new DOMParser().parseFromString(html, 'text/html')
}

test('proejctw wallace Container', () => {
	const coverage = [
		{
			url: 'http://localhost:4173/_app/immutable/assets/Container.n-2BXq6O.css',
			text: '.container.svelte-1ginl5v{margin-inline:auto;padding-inline:var(--space-2)}@media (min-width: 44rem){.container.svelte-1ginl5v{padding-inline:var(--space-4)}}@media (min-width: 66rem){.container.svelte-1ginl5v{padding-inline:var(--space-8)}}.size-auto.svelte-1ginl5v{max-width:120rem}.size-sm.svelte-1ginl5v{max-width:28rem}.size-md.svelte-1ginl5v{max-width:32rem}.size-lg.svelte-1ginl5v{max-width:36rem}.size-xl.svelte-1ginl5v{max-width:48rem}.size-2xl.svelte-1ginl5v{max-width:64rem}.size-3xl.svelte-1ginl5v{max-width:80rem}\n',
			ranges: [
				{ start: 0, end: 75 },
				{ start: 82, end: 157 },
				{ start: 165, end: 240 },
				{ start: 241, end: 284 },
				{ start: 485, end: 526 },
			],
		},
	]
	let result = calculate_coverage(coverage, parse_html)
	let sheet = result.coverage_per_stylesheet.at(0)!

	expect.soft(sheet.total_lines).toBe(44)
	expect.soft(sheet.chunks).toHaveLength(3)

	let [chunk1, chunk2, chunk3] = sheet.chunks

	expect.soft(chunk1?.start_line).toEqual(1)
	expect.soft(chunk1?.end_line).toEqual(21)
	expect.soft(chunk1?.total_lines).toEqual(21)

	expect.soft(chunk2?.start_line).toEqual(22)
	expect.soft(chunk2?.end_line).toEqual(40)
	expect.soft(chunk2?.total_lines).toEqual(19)

	expect.soft(chunk3?.start_line).toEqual(41)
	expect.soft(chunk3?.end_line).toEqual(44)
	expect.soft(chunk3?.total_lines).toEqual(4)
})
