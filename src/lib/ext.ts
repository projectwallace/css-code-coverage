export function ext(url: string) {
	try {
		let parsed_url = new URL(url)
		return parsed_url.pathname.slice(parsed_url.pathname.lastIndexOf('.') + 1)
	} catch {
		let ext_index = url.lastIndexOf('.')
		return url.slice(ext_index, url.indexOf('/', ext_index) + 1)
	}
}
