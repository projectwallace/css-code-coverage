export function ext(url: string) {
	let path: string
	try {
		path = new URL(url).pathname
	} catch {
		// Relative URL or plain path: strip query and hash manually
		path = url.split(/[?#]/)[0]!
	}
	let file = path.slice(path.lastIndexOf('/') + 1)
	let dot = file.lastIndexOf('.')
	return dot === -1 ? '' : file.slice(dot + 1)
}
