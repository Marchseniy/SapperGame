const templates = {}

export function random(a, b) {
	return Math.floor(Math.random() * (b - a + 1)) + a
}

export function getTemplateElement(dataAttr) {
	if (templates[dataAttr]) {
		return templates[dataAttr].cloneNode(true)
	}

	const template = document.querySelector(`template[${dataAttr}]`)
	if (!template) {
		console.error(`Template with ${dataAttr} not found`)
		return null
	}

	const content = template.content.cloneNode(true)
	const element = content.firstElementChild

	templates[dataAttr] = element

	return element.cloneNode(true)
}

export function getByDataAttr(dataAttr) {
	return document.querySelector(`[${dataAttr}]`)
}

export function getAllByDataAttr(dataAttr) {
	return document.querySelectorAll(`[${dataAttr}]`)
}

export function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		let j = Math.floor(Math.random() * (i + 1))
		let temp = array[i]
		array[i] = array[j]
		array[j] = temp
	}
}

export function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}