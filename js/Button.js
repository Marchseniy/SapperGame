export class Button {
	#btnElement
	
	constructor(btnElement) {
		this.#btnElement = btnElement
		this.#setListeners()
	}
	
	get btnElement() {
		return this.#btnElement
	}
	
	setOnClickListener(listener) {
		this.#btnElement.addEventListener('click', listener)
	}
	
	#setListeners() {
		this.#btnElement.addEventListener('mousedown', () => {
			this.#btnElement.classList.add('btn-pressed-down')
		})

		this.#btnElement.addEventListener('mouseup', () => {
			this.#btnElement.classList.remove('btn-pressed-down')
		})
		
		this.#btnElement.addEventListener('mouseleave', () => {
			this.#btnElement.classList.remove('btn-pressed-down')
		})
	}
}