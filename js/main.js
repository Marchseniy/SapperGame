import { Board } from './Board.js'
import { Button } from './Button.js'
import { GameSetting } from './GameSetting.js'
import { TimerPanel } from './TimerPanel.js'
import { getByDataAttr, getTemplateElement, sleep } from './utils.js'

const gameSettings = [
	new GameSetting('Новичок', 9, 9, 10),
	new GameSetting('Любитель', 16, 16, 40),
	new GameSetting('Профессионал', 30, 16, 99),
]

const levelSelect = getByDataAttr('data-level-options-container')
let currentLevelIndex = 0
let board = new Board(gameSettings[currentLevelIndex])
const initTime = 999
const timerPanel = new TimerPanel(initTime)
const newGameBtn = new Button(getByDataAttr('data-recreate-btn'))
const bombCountElement = getByDataAttr('data-bomb-count')
const resultBoardElement = getByDataAttr('data-result-board')

gameSettings.forEach((gameSetting, index) => {
	const option = document.createElement('option')
	option.value = index
	option.classList.add('header__level-options-item')
	option.textContent = gameSetting.representation
	levelSelect.appendChild(option)
})

levelSelect.addEventListener('change', (event) => {
	currentLevelIndex = parseInt(event.target.value)

	getByDataAttr('data-board').innerHTML = ''
	board.abort()
	board = new Board(gameSettings[currentLevelIndex])

	setupBoardListeners()

	bombCountElement.textContent = gameSettings[currentLevelIndex].minesCount

	newGameBtn.btnElement.classList.remove('main__new-game-btn--flashing')
	resultBoardElement.innerHTML = ''
	timerPanel.start()
})

function setupBoardListeners() {
	board.onMinesFlaggedCountChangedListener = (minesFlaggedCount) => {
		bombCountElement.textContent =
			gameSettings[currentLevelIndex].minesCount - minesFlaggedCount
	}

	board.onLouseListener = () => {
		timerPanel.stop()
		makeLouseSound()
		resultBoardElement.appendChild(
			getTemplateElement('data-louse-result-board')
		)
		newGameBtn.btnElement.classList.add('main__new-game-btn--flashing')
	}

	board.onWinListener = async () => {
		timerPanel.stop()
		const winBoard = getTemplateElement('data-win-result-board')
		winBoard.querySelector('[data-total-time]').textContent =
			initTime - timerPanel.seconds
		resultBoardElement.appendChild(winBoard)
		newGameBtn.btnElement.classList.add('main__new-game-btn--flashing')
		await sleep(800)
		makeWinSound()
	}
}

function makeWinSound() {
	new Audio('../audios/win.mp3').play()
}

function makeLouseSound() {
	new Audio('../audios/louse.mp3').play()
}

bombCountElement.textContent = gameSettings[currentLevelIndex].minesCount
setupBoardListeners()

timerPanel.onEndTimeListener = async () => {
	board.showAllMines()
	await sleep(400)
	makeLouseSound()
	resultBoardElement.appendChild(
		getTemplateElement('data-louse-result-board')
	)
	newGameBtn.btnElement.classList.add('main__new-game-btn--flashing')
}

newGameBtn.setOnClickListener(() => {
	newGameBtn.btnElement.classList.remove('main__new-game-btn--flashing')
	resultBoardElement.innerHTML = ''
	bombCountElement.textContent = gameSettings[currentLevelIndex].minesCount
	timerPanel.start()
	board.recreate()
})

const lvlOpContainer = getByDataAttr('data-level-options-container')
lvlOpContainer.addEventListener('click', () => {
	lvlOpContainer.classList.toggle('header__level-options--active')
})

window.addEventListener('contextmenu', (event) => {
	event.preventDefault()
})

timerPanel.start()
