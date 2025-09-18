import { Cell } from './Cell.js'
import {
	getByDataAttr,
	getTemplateElement,
	shuffleArray,
	sleep,
} from './utils.js'

export class Board {
	#onLouse
	#onMinesFlaggedCountChanged
	#onWin
	#abortController = new AbortController()
	#minesCount
	#cells = []
	#cellsElements = []
	#minesCountColors = [
		'',
		'blue',
		'green',
		'red',
		'darkblue',
		'darkred',
		'teal',
		'black',
		'gray',
	]
	#minesFlaggedCount = 0
	#isFirstClick = true
	#isMineClicked = false
	#longPressDelay = 200

	constructor(gameSetting) {
		this.width = gameSetting.width
		this.height = gameSetting.height
		this.#minesCount = gameSetting.minesCount

		this.#init()
	}

	set onLouseListener(listener) {
		this.#onLouse = listener
	}

	set onMinesFlaggedCountChangedListener(listener) {
		this.#onMinesFlaggedCountChanged = listener
	}

	set onWinListener(listener) {
		this.#onWin = listener
	}

	abort() {
		this.#abortController.abort()
	}

	recreate() {
		this.#abortController.abort()
		this.#abortController = new AbortController()

		this.#cells = []
		this.#cellsElements = []
		this.#isFirstClick = true
		this.#isMineClicked = false
		this.#minesFlaggedCount = 0

		this.#init()
	}

	async showAllMines() {
		const signal = this.#abortController.signal

		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				if (signal.aborted) return

				if (!this.#cells[y][x].hasMine || this.#cells[y][x].isOpened) {
					continue
				}

				await sleep(350)

				if (signal.aborted) return

				this.#cells[y][x].isOpened = true
				this.#cells[y][x].isFlagged = false
				this.#addClickAnimation(this.#cellsElements[y][x])
				this.render()
			}
		}
	}

	#init() {
		const signal = this.#abortController.signal

		for (let y = 0; y < this.height; y++) {
			this.#cells.push([])
			this.#cellsElements.push([])
			for (let x = 0; x < this.width; x++) {
				this.#cells[y].push(new Cell())
				this.#cellsElements[y].push(
					getTemplateElement('data-cell-button')
				)

				this.#setupCellEventListeners(x, y, signal)
			}
		}

		this.#spawnMines()
		this.#setMinesCountToCells()
		this.render()
		this.#renderAnimation()
	}

	render() {
		const root = document.documentElement
		root.style.setProperty('--grid-columns', this.width)
		root.style.setProperty('--grid-rows', this.height)

		const dataBoard = getByDataAttr('data-board')
		dataBoard.innerHTML = ''

		this.#boardIterate((x, y) => {
			const cellElement = this.#cellsElements[y][x]
			const cell = this.#cells[y][x]

			this.#styleCellElement(cellElement, cell, x, y)
			this.#updateCellContent(cellElement, cell)

			dataBoard.appendChild(cellElement)
		})
	}

	#setupCellEventListeners(x, y, signal) {
		let longPressTimer = null

		const setFlag = () => {
			if (signal.aborted) return
			if (this.#cells[y][x].isOpened || this.#isMineClicked) return
			if (!this.#canSetFlag(x, y)) return

			this.#addClickAnimationToAllCells()
			this.#addClickAnimation(this.#cellsElements[y][x])

			this.#minesFlaggedCount += this.#cells[y][x].isFlagged ? -1 : 1
			this.#cells[y][x].isFlagged = !this.#cells[y][x].isFlagged

			this.#onMinesFlaggedCountChanged?.(this.#minesFlaggedCount)
			if (this.#isWin()) {
				this.#setAllFlags()
				this.#onWin?.()
			}

			this.render()
		}

		const clearTimer = () => {
			if (signal.aborted) return
			if (longPressTimer) {
				clearTimeout(longPressTimer)
				longPressTimer = null
			}
		}

		this.#cellsElements[y][x].addEventListener(
			'touchstart',
			() => {
				if (signal.aborted) return
				longPressTimer = setTimeout(setFlag, this.#longPressDelay)
			},
			{ signal }
		)

		this.#cellsElements[y][x].addEventListener(
			'touchend',
			() => {
				if (signal.aborted) return
				clearTimer()
			},
			{ signal }
		)

		this.#cellsElements[y][x].addEventListener(
			'touchcancel',
			() => {
				if (signal.aborted) return
				clearTimer()
			},
			{ signal }
		)

		this.#cellsElements[y][x].addEventListener(
			'mousedown',
			(e) => {
				if (signal.aborted) return
				if (e.button === 0) {
					longPressTimer = setTimeout(setFlag, this.#longPressDelay)
				}
			},
			{ signal }
		)

		this.#cellsElements[y][x].addEventListener('mouseup', clearTimer, {
			signal,
		})
		this.#cellsElements[y][x].addEventListener('mouseleave', clearTimer, {
			signal,
		})

		this.#cellsElements[y][x].addEventListener(
			'contextmenu',
			(e) => {
				if (signal.aborted) return
				e.preventDefault()
			},
			{ signal }
		)

		this.#cellsElements[y][x].addEventListener(
			'click',
			(e) => {
				if (signal.aborted) return
				if (longPressTimer) {
					clearTimeout(longPressTimer)
					longPressTimer = null
					return
				}

				this.#handleCellClick(x, y)
			},
			{ signal }
		)

		this.#cellsElements[y][x].addEventListener(
			'auxclick',
			(e) => {
				if (signal.aborted) return
				if (e.button === 2) {
					setFlag()
				}
			},
			{ signal }
		)
	}

	#handleCellClick(x, y) {
		if (this.#isFirstClick) {
			this.#isFirstClick = false
			if (this.#cells[y][x].hasMine || this.#cells[y][x].minesCount > 0) {
				this.#makeAdaptiveField(x, y)
			}
		}

		if (
			this.#cells[y][x].isOpened ||
			this.#cells[y][x].isFlagged ||
			this.#isMineClicked
		) {
			return
		}

		if (this.#cells[y][x].hasMine) {
			this.#isMineClicked = true
			this.#cells[y][x].isOpened = true
			this.#onLouse?.()
			this.showAllMines()
		}

		this.#addClickAnimationToAllCells()
		this.#addClickAnimation(this.#cellsElements[y][x])

		this.#openEmptyCellsFrom(x, y)
		if (this.#isWin()) {
			this.#setAllFlags()
			this.#onWin?.()
		}

		this.render()
	}

	#setAllFlags() {
		this.#boardIterate((x, y) => {
			if (this.#cells[y][x].isFlagged) {
				this.#addClickAnimation(this.#cellsElements[y][x])
			}

			this.#cells[y][x].isFlagged = this.#cells[y][x].hasMine
		})
		this.#minesFlaggedCount = this.#minesCount
		this.#onMinesFlaggedCountChanged?.(this.#minesFlaggedCount)
	}

	#makeAdaptiveField(x, y) {
		do {
			this.#boardIterate((x1, y1) => {
				this.#cells[y1][x1].hasMine = false
				this.#cells[y1][x1].minesCount = 0
			})
			this.#spawnMines()
			this.#setMinesCountToCells()
		} while (this.#cells[y][x].hasMine || this.#cells[y][x].minesCount > 0)
	}

	#openEmptyCellsFrom(x, y) {
		if (!this.#isCellExists(x, y)) return

		const cell = this.#cells[y][x]

		if (cell.isOpened || cell.isFlagged) return

		if (cell.hasMine) {
			cell.isOpened = true
			return
		}

		cell.isOpened = true
		this.#addClickAnimation(this.#cellsElements[y][x])

		if (cell.minesCount > 0) {
			return
		}

		for (let dy = -1; dy <= 1; dy++) {
			for (let dx = -1; dx <= 1; dx++) {
				if (dx === 0 && dy === 0) continue

				const nx = x + dx
				const ny = y + dy

				this.#openEmptyCellsFrom(nx, ny)
			}
		}
	}

	async #renderAnimation() {
		const signal = this.#abortController.signal

		try {
			let lineY = 1
			for (let i = 0; i < this.width + this.height - 1; i++) {
				if (signal.aborted) return

				let coordinates
				if (i < this.width) {
					coordinates = { x: i, y: 0 }
				} else {
					coordinates = { x: this.width - 1, y: lineY }
					lineY++
				}

				let x = coordinates.x
				let y = coordinates.y
				while (this.#isCellExists(x, y)) {
					if (signal.aborted) return

					const cellElement = this.#cellsElements[y][x]
					cellElement.style.setProperty('visibility', 'visible')
					this.#addSpawnAnimation(cellElement)

					x--
					y++
					await sleep(1)
				}
			}
		} catch (e) {}
	}

	#spawnMines() {
		const isMineMap = this.#getIsMineMap()

		this.#boardIterate((x, y) => {
			this.#cells[y][x].hasMine = isMineMap[y * this.width + x]
		})
	}

	#setMinesCountToCells() {
		this.#boardIterate((x, y) => {
			if (this.#cells[y][x].hasMine) return

			let minesCount = 0

			for (let dy = -1; dy <= 1; dy++) {
				for (let dx = -1; dx <= 1; dx++) {
					if (dx === 0 && dy === 0) continue

					const nx = x + dx
					const ny = y + dy

					if (
						this.#isCellExists(nx, ny) &&
						this.#cells[ny][nx].hasMine
					) {
						minesCount++
					}
				}
			}

			this.#cells[y][x].minesCount = minesCount
		})
	}

	#isWin() {
		const cells = this.#cells.flat()

		const correctlyFlaggedCount = cells.reduce(
			(acc, cell) => acc + (cell.hasMine && cell.isFlagged ? 1 : 0),
			0
		)

		let isAllNonMinesOpened = true
		for (let cell of cells) {
			if (!cell.hasMine && !cell.isOpened) {
				isAllNonMinesOpened = false
				break
			}
		}

		return correctlyFlaggedCount === this.#minesCount || isAllNonMinesOpened
	}

	#styleCellElement(cellElement, cell, x, y) {
		cellElement.style.setProperty(
			'background-color',
			this.#getColor(cell, x, y)
		)

		if (!cellElement.hasAttribute('data-animated')) {
			cellElement.setAttribute('data-animated', '')
			cellElement.style.setProperty('visibility', 'hidden')
		}
	}

	#updateCellContent(cellElement, cell) {
		cellElement.textContent = ''
		cellElement.classList.remove('main__cell--opened')

		if (cell.isFlagged) {
			cellElement.appendChild(getTemplateElement('data-flag'))
		} else if (cell.hasMine && cell.isOpened) {
			if (cellElement.childElementCount === 0) {
				cellElement.appendChild(getTemplateElement('data-bomb'))
			}
		} else if (cell.isOpened) {
			cellElement.classList.add('main__cell--opened')
			if (cell.minesCount !== 0) {
				this.#setMinesCountToCellElement(cellElement, cell)
			}
		}
	}

	#setMinesCountToCellElement(element, cell) {
		element.textContent = cell.minesCount
		element.style.color = this.#minesCountColors[cell.minesCount] || 'black'
	}

	#getIsMineMap() {
		const isMineMap = []

		for (let i = 0; i < this.#minesCount; i++) {
			isMineMap.push(true)
		}

		for (let i = 0; i < this.width * this.height - this.#minesCount; i++) {
			isMineMap.push(false)
		}

		shuffleArray(isMineMap)

		return isMineMap
	}

	#getColor(cell, x, y) {
		const style = getComputedStyle(document.documentElement)

		let cellColor
		if ((x + y) % 2 === 0) {
			cellColor = cell.isOpened
				? style.getPropertyValue('--first-open-cell-color')
				: style.getPropertyValue('--first-close-cell-color')
		} else {
			cellColor = cell.isOpened
				? style.getPropertyValue('--second-open-cell-color')
				: style.getPropertyValue('--second-close-cell-color')
		}

		return cellColor
	}

	#isCellExists(x, y) {
		return x >= 0 && x < this.width && y >= 0 && y < this.height
	}

	#canSetFlag(x, y) {
		return (
			(this.#minesFlaggedCount >= this.#minesCount &&
				this.#cells[y][x].isFlagged) ||
			this.#minesFlaggedCount < this.#minesCount
		)
	}

	#addClickAnimation(element) {
		element.classList.add('cell-click-animation')
		element.addEventListener(
			'animationend',
			function () {
				this.classList.remove('cell-click-animation')
			},
			{ once: true }
		)
	}

	#addClickAnimationToAllCells() {
		this.#boardIterate((x, y) => {
			this.#cellsElements[y][x].classList.remove('cell-click-animation')
		})
	}

	#addSpawnAnimation(element) {
		element.classList.add('cell-spawn-animation')
		element.addEventListener(
			'animationend',
			function () {
				this.classList.remove('cell-spawn-animation')
			},
			{ once: true }
		)
	}

	#boardIterate(callback) {
		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				callback(x, y)
			}
		}
	}
}
