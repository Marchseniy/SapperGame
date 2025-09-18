export class GameSetting {
	constructor(name, width, height, minesCount) {
		this.name = name
		this.width = width
		this.height = height
		this.minesCount = minesCount
	}
	
	get representation() {
		return `${this.name} ${this.width}x${this.height} - ${this.minesCount}`
	}
}
