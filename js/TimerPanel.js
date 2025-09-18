import { Timer } from './Timer.js'
import { getByDataAttr } from './utils.js'

export class TimerPanel {
	#onEndTime
	#timer
	#timerPanelElement

	constructor(initSeconds) {
		this.initSeconds = initSeconds
		this.#timer = new Timer(initSeconds)
		this.#timerPanelElement = getByDataAttr('data-timer-panel')
		this.#timer.onTimeChangedListener =
			this.#onTimeChangedListener.bind(this)

		this.#timerPanelElement.textContent = this.#formatValue(initSeconds)
	}

	set onEndTimeListener(listener) {
		this.#onEndTime = listener
	}

	get isStarted() {
		return this.#timer.isStarted
	}
	
	get seconds() {
		return this.#timer.seconds
	}

	start() {
		if (this.#timer.isStarted) {
			this.#timer.stop()
		}

		this.#timerPanelElement.textContent = this.#formatValue(this.initSeconds)
		this.#timer.startWith(this.initSeconds)
	}

	stop() {
		try {
			this.#timer.stop()
		} catch (e) {}
	}

	#onTimeChangedListener(seconds) {
		this.#timerPanelElement.textContent = this.#formatValue(seconds)

		if (seconds === 0) {
			this.#onEndTime?.()
			this.#timer.isStarted && this.#timer.stop()
		}
	}

	#formatValue(value) {
		return value.toString().padStart(3, '0')
	}
}
