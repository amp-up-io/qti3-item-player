export class ItemTimer {

  itemTimer
  itemDuration

  constructor () {
    this.setTime(0)
  }

  getTime () {
    return this.itemDuration
  }

  setTime (time) {
    this.itemDuration = time
  }

  startTimer () {
    this.clearTimer()
    this.setTime(0)
    this.itemTimer = setInterval(this.updateTime.bind(this), 1000)
  }

  updateTime () {
    ++this.itemDuration
  }

  resetTimer () {
    this.clearTimer()
    this.setTime(0)
  }

  clearTimer () {
    clearInterval(this.itemTimer)
  }

}