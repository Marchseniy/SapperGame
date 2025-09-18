export class Timer {
	#intervalId
	#seconds
	#isStarted
	#onTimeChanged

	constructor(initSeconds) {
		this.#seconds = initSeconds
		this.#isStarted = false
	}

	set onTimeChangedListener(listener) {
		this.#onTimeChanged = listener
	}

	get seconds() {
		return this.#seconds
	}

	get isStarted() {
		return this.#isStarted
	}

	start() {
		if (this.#isStarted) throw new Error('Timer already started')

		this.#isStarted = true
		this.#intervalId = setInterval(() => {
			this.#seconds--
			this.#onTimeChanged?.(this.#seconds)
		}, 1000)
	}

	startWith(seconds) {
		if (this.#isStarted) throw new Error('Timer already started')

		this.#seconds = seconds
		this.start()
	}

	stop() {
		if (!this.#isStarted) throw new Error('Timer already stopped')

		this.#isStarted = false
		clearInterval(this.#intervalId)
	}
}
