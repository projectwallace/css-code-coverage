import { mergeTests, test as base, expect } from '@playwright/test'
import { test as withCssCoverage, slugify } from './playwright/index.js'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'

const test = mergeTests(base, withCssCoverage)

const TEST_CONTENT = '<style>body { margin: 0 }</style><body></body>'

function expected_filename(title_path: string[]): string {
	return title_path.map(slugify).join('-') + '.json'
}

test.describe('cssCoverageDir option', () => {
	let custom_dir = path.join(os.tmpdir(), 'css-code-coverage-fixture-dir-test')
	let filename = ''

	test.use({ cssCoverageDir: custom_dir })

	test.beforeAll(async () => {
		await fs.rm(custom_dir, { recursive: true, force: true })
	})

	test('writes coverage to the configured directory', async ({ page, cssCoverage }, testInfo) => {
		await page.setContent(TEST_CONTENT)
		filename = expected_filename(testInfo.titlePath)
	})

	test.afterAll(async () => {
		await expect(fs.access(path.join(custom_dir, filename))).resolves.toBeUndefined()
		await fs.rm(custom_dir, { recursive: true, force: true })
	})
})

test.describe('default cssCoverageDir', () => {
	let default_dir = path.join(process.cwd(), 'css-coverage')
	let filename = ''

	test('defaults to css-coverage relative to cwd', async ({ page, cssCoverage }, testInfo) => {
		await page.setContent(TEST_CONTENT)
		filename = expected_filename(testInfo.titlePath)
	})

	test.afterAll(async () => {
		await expect(fs.access(path.join(default_dir, filename))).resolves.toBeUndefined()
		await fs.rm(default_dir, { recursive: true, force: true })
	})
})

test.describe('file naming', () => {
	let dir = path.join(os.tmpdir(), 'css-code-coverage-fixture-naming-test')
	let filename = ''

	test.use({ cssCoverageDir: dir })

	test.beforeAll(async () => {
		await fs.rm(dir, { recursive: true, force: true })
	})

	test('derives filename from the test title path', async ({ page, cssCoverage }, testInfo) => {
		await page.setContent(TEST_CONTENT)
		filename = expected_filename(testInfo.titlePath)
	})

	test.afterAll(async () => {
		let files = await fs.readdir(dir)
		expect(files).toContain(filename)
		await fs.rm(dir, { recursive: true, force: true })
	})
})

test.describe('file content', () => {
	let dir = path.join(os.tmpdir(), 'css-code-coverage-fixture-content-test')

	test.use({ cssCoverageDir: dir })

	test.beforeAll(async () => {
		await fs.rm(dir, { recursive: true, force: true })
	})

	test('writes valid JSON', async ({ page, cssCoverage }) => {
		await page.setContent(TEST_CONTENT)
	})

	test('content is an array of coverage entries', async ({ page, cssCoverage }) => {
		await page.setContent('<style>h1 { color: red }</style><body><h1>hi</h1></body>')
	})

	test.afterAll(async () => {
		let files = await fs.readdir(dir)
		for (let file of files) {
			let content = await fs.readFile(path.join(dir, file), 'utf-8')
			let parsed = JSON.parse(content)
			expect(Array.isArray(parsed)).toBe(true)
			for (let entry of parsed) {
				expect(entry).toMatchObject({
					url: expect.any(String),
					text: expect.any(String),
					ranges: expect.any(Array),
				})
			}
		}
		await fs.rm(dir, { recursive: true, force: true })
	})
})
