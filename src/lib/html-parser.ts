export interface Element {
	textContent: string
}

interface Document {
	querySelectorAll(selector: 'style'): Element[]
}

/**
 * @description
 * Very, very naive but effective DOMParser.
 * It can only find <style> elements and their .textContent
 */
export class DOMParser {
	parseFromString(html: string, _type: 'text/html'): Document {
		let styles: Element[] = []
		let lower = html.toLowerCase()
		let pos = 0
		while (true) {
			let open = lower.indexOf('<style', pos)
			if (open === -1) break
			let start = lower.indexOf('>', open)
			if (start === -1) break
			let close = lower.indexOf('</style>', start)
			if (close === -1) break
			let text = html.slice(start + 1, close)
			styles.push({ textContent: text })
			pos = close + '</style>'.length
		}
		return {
			querySelectorAll(selector: 'style') {
				return styles
			},
		}
	}
}
