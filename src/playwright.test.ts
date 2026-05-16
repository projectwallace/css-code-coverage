import { test, expect } from '@playwright/test'
import { save_css_coverage, slugify } from './playwright/index.js'
import type { Coverage } from './lib/parse-coverage.js'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'

const MOCK_COVERAGE: Coverage[] = [
	{
		url: 'http://example.com/style.css',
		text: 'body { color: red }',
		ranges: [{ start: 0, end: 19 }],
	},
]

test.describe('save_css_coverage', () => {
	let dir = path.join(os.tmpdir(), 'css-code-coverage-save-test')

	test.beforeAll(async () => {
		await fs.rm(dir, { recursive: true, force: true })
	})

	test.afterAll(async () => {
		await fs.rm(dir, { recursive: true, force: true })
	})

	test('writes file to the configured directory', async () => {
		let title_path = ['writes file to the configured directory']
		await save_css_coverage(MOCK_COVERAGE, { dir, title_path })
		await expect(
			fs.access(path.join(dir, title_path.map(slugify).join('-') + '.json')),
		).resolves.toBeUndefined()
	})

	test('defaults dir to css-coverage relative to cwd', async () => {
		let default_dir = path.join(process.cwd(), 'css-coverage')
		let title_path = ['defaults dir to css-coverage relative to cwd']
		await save_css_coverage(MOCK_COVERAGE, { title_path })
		await expect(
			fs.access(path.join(default_dir, title_path.map(slugify).join('-') + '.json')),
		).resolves.toBeUndefined()
		await fs.rm(default_dir, { recursive: true, force: true })
	})

	test('derives filename from title_path', async () => {
		let title_path = ['My Suite', 'my test/name.ts']
		await save_css_coverage(MOCK_COVERAGE, { dir, title_path })
		let files = await fs.readdir(dir)
		expect(files).toContain('my-suite-my-test-name-ts.json')
	})

	test('calls attach with correct arguments', async () => {
		let attached: { name: string; path: string; contentType: string } | undefined
		let title_path = ['calls attach with correct arguments']
		await save_css_coverage(MOCK_COVERAGE, {
			dir,
			title_path,
			attach: async (name, opts) => {
				attached = { name, ...opts }
			},
		})
		expect(attached?.name).toBe('css-coverage')
		expect(attached?.contentType).toBe('application/json')
		expect(attached?.path).toContain('.json')
	})

	test('file content matches the coverage input', async () => {
		let title_path = ['file content matches the coverage input']
		await save_css_coverage(MOCK_COVERAGE, { dir, title_path })
		let file_path = path.join(dir, title_path.map(slugify).join('-') + '.json')
		let content = JSON.parse(await fs.readFile(file_path, 'utf-8'))
		expect(content).toEqual(MOCK_COVERAGE)
	})
})
