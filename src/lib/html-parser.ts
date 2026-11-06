// Very, very naive but effective HTML parser.
// It can only find the [start, end) offsets of the contents of <style> elements.
export function find_style_blocks(html: string): Array<[start: number, end: number]> {
	let blocks: Array<[number, number]> = []
	let lower = html.toLowerCase()
	let pos = 0
	while (true) {
		let open = lower.indexOf('<style', pos)
		if (open === -1) {
			break
		}

		let start = lower.indexOf('>', open)
		if (start === -1) {
			break
		}

		let close = lower.indexOf('</style>', start)
		if (close === -1) {
			break
		}

		blocks.push([start + 1, close])
		pos = close + 8 // '</style>'.length
	}
	return blocks
}
