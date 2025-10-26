import type { Coverage } from './parse-coverage.js'
import { ext } from './ext.js'
import { remap_html } from './remap-html.js'

function is_html(text: string): boolean {
	return /<\/?(html|body|head|div|span|script|style)/i.test(text)
}

// Matches: element selectors, class/id selectors, attribute selectors, @rules
const SELECTOR_REGEX = /(@[a-z-]+|\[[^\]]+\]|[a-zA-Z_#.-][a-zA-Z0-9_-]*)\s*\{/
// Check for CSS properties (property: value pattern)
const DECLARATION_REGEX = /^\s*[a-zA-Z-]+\s*:\s*.+;?\s*$/m

function is_css_like(text: string): boolean {
	return SELECTOR_REGEX.test(text) || DECLARATION_REGEX.test(text)
}

function is_js_like(text: string): boolean {
	try {
		// Only parses the input, does not execute it.
		// NEVER EXECUTE THIS UNTRUSTED CODE!!!
		new Function(text)
		return true
	} catch {
		return false
	}
}

export function filter_coverage(coverage: Coverage[]): Coverage[] {
	let result = []

	for (let entry of coverage) {
		let extension = ext(entry.url).toLowerCase()
		if (extension === 'js') continue

		// Always include CSS files
		if (extension === 'css') {
			result.push(entry)
			continue
		}

		if (is_html(entry.text)) {
			let { css, ranges } = remap_html(entry.text, entry.ranges)
			result.push({
				url: entry.url,
				text: css,
				ranges,
			})
			continue
		}

		if (is_css_like(entry.text) && !is_js_like(entry.text)) {
			result.push({
				url: entry.url,
				text: entry.text,
				ranges: entry.ranges,
			})
		}
	}

	return result
}
