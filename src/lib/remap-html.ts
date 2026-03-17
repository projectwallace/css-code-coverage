import type { Range } from './parse-coverage.js'
import { DOMParser as WallaceDOMParser } from './html-parser.js'

function get_dom_parser(): DOMParser | WallaceDOMParser {
	if (typeof window !== 'undefined' && 'DOMParser' in window) {
		return new window.DOMParser()
	}

	return new WallaceDOMParser()
}

export function remap_html(html: string, old_ranges: Range[]) {
	let dom_parser = get_dom_parser()
	let doc = dom_parser.parseFromString(html, 'text/html')
	let combined_css = ''
	let new_ranges = []
	let current_offset = 0
	let style_elements = doc.querySelectorAll('style')
	let search_from = 0

	for (let style_element of Array.from(style_elements)) {
		let style_content = style_element.textContent
		if (!style_content.trim()) continue

		// Append the style content directly to the combined CSS
		combined_css += style_content

		// Find the offsets of this style element's content in the original HTML,
		// starting after the previous style block to avoid matching an earlier occurrence
		let start_index = html.indexOf(style_content, search_from)
		let end_index = start_index + style_content.length
		search_from = end_index

		// Iterate through ranges and adjust if they fall within the current style tag
		for (let range of old_ranges) {
			if (range.start >= start_index && range.end <= end_index) {
				new_ranges.push({
					start: current_offset + (range.start - start_index),
					end: current_offset + (range.end - start_index),
				})
			}
		}

		// Update the current offset for the next style tag
		current_offset += style_content.length
	}

	return {
		css: combined_css,
		ranges: new_ranges,
	}
}
