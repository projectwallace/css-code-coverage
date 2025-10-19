type NodeList = Iterable<{ textContent: string }> | NodeListOf<HTMLStyleElement>

export interface Parser {
	(html: string): {
		querySelectorAll: (selector: string) => NodeList
	}
}
