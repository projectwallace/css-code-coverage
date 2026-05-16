import { test as base_test } from '@playwright/test'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

type CssCoverageFixtures = {
	cssCoverage: void
}

type CssCoverageOptions = {
	cssCoverageDir: string
}

export const test = base_test.extend<CssCoverageFixtures, CssCoverageOptions>({
	cssCoverageDir: ['css-coverage', { option: true }],

	cssCoverage: [
		async ({ page, cssCoverageDir }, use, testInfo) => {
			await page.coverage.startCSSCoverage()
			await use()
			let coverage = await page.coverage.stopCSSCoverage()

			let parts = testInfo.titlePath.map((s) =>
				s
					.replaceAll(/\s+|\/|\./g, '-')
					.replaceAll(/[^a-zA-Z0-9-_]/g, '')
					.toLowerCase(),
			)
			let file_name = parts.join('-') + '.json'

			let dir = path.resolve(process.cwd(), cssCoverageDir)
			await fs.mkdir(dir, { recursive: true })
			let file_path = path.join(dir, file_name)

			await fs.writeFile(file_path, JSON.stringify(coverage))

			await testInfo.attach('css-coverage', {
				path: file_path,
				contentType: 'application/json',
			})
		},
		{},
	],
})
