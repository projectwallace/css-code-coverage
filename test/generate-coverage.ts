import { chromium } from '@playwright/test'

export async function generate_coverage(html: string, { link_css }: { link_css?: string } = {}) {
	let browser = await chromium.launch({ headless: true })
	let page = await browser.newPage()
	await page.route('**/test.html', (route) => {
		route.fulfill({
			status: 200,
			contentType: 'text/html',
			body: html,
		})
	})
	await page.route('**/style.css', (route) => {
		route.fulfill({
			status: 200,
			contentType: 'text/css',
			body: link_css || '',
		})
	})
	await page.coverage.startCSSCoverage()
	await page.goto('http://localhost/test.html', { waitUntil: 'domcontentloaded' })
	await page.evaluate(() => getComputedStyle(document.body)) // force CSS evaluation
	let coverage = await page.coverage.stopCSSCoverage()
	await browser.close()
	return coverage
}
