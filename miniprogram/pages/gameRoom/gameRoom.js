const app = getApp()

const tools = {
  画笔: 'pen',
  橡皮: 'eraser',
}
const colors = {
  黑色: '#000000',
  红色: '#E53935',
  橙色: '#FB8C00',
  黄色: '#FDD835',
  绿色: '#43A047',
  蓝色: '#1E88E5',
  紫色: '#8E24AA',
  '---': '#FFFFFF',
}
const widths = {
  极细: 3,
  细: 6,
  适中: 12,
  粗: 30,
  极粗: 60,
  超级粗: 100,
}
const defaultBrushStyleColumns = [
  { values: Object.keys(tools), className: 'tools', defaultIndex: 0 },
  { values: Object.keys(colors), className: 'colors', defaultIndex: 0 },
  { values: Object.keys(widths), className: 'widths', defaultIndex: 2 },
]

const siPlugin = requirePlugin('WechatSI')
const siManager = siPlugin.getRecordRecognitionManager()

Page({
  options: {
    pureDataPattern: /^_/,
  },
  data: {
    roomId: null,
    currentWord: null,
    currentSelectableWord: [],
    players: [],
    started: false,
    choosingWord: false,
    answering: false,
    timeoutTs: null,
    joined: false,
    // 画板数据
    drawingOpenId: '',
    myOpenId: null,
    tool: Object.values(tools)[0],
    color: Object.values(colors)[0],
    previewBorderColor: Object.values(colors)[0],
    width: Object.values(widths)[2],
    brushStylesPickerShown: false,
    brushStyleColumns: defaultBrushStyleColumns,
    // 聊天数据
    onGetUserInfo: () => null,
    content: '',
    mHidden: true,
    footerOffset: 0,
    focus: false,
    content: '',
    mHidden: true,
    // 以下：纯数据字段
    _watcher: null,
    _penColor: '黑色',
    _toolWidth: { pen: '适中', eraser: '极粗' },
    _timer: null,
    _timeoutCache: {},
  },
  selectorWidthChange(e) {
    const value = this.data.selectorWidth[parseInt(e.detail.value)]
    this.setData({ strokeWidth: value })
  },
  showBrushStylesPicker() {
    this.setData({
      brushStylesPickerShown: true,
    })
  },
  closeBrushStylesPicker() {
    this.setData({
      brushStylesPickerShown: false,
    })
  },
  joinGameRoom() {
    return new Promise(resolve => {
      wx.getUserInfo({
        success: async res => {
          await wx.cloud.callFunction({
            name: 'joinRoom',
            data: {
              userInfo: res.userInfo,
              roomId: this.data.roomId,
            },
          })
          resolve()
        },
      })
    })
  },
  initRoomWatch() {
    const db = wx.cloud.database()
    this.data._watcher = db.collection('room')
      .doc(this.data.roomId)
      .watch({
        onChange: async snapshot => {
          if (snapshot.docs.length === 0) {
            await wx.redirectTo({
              url: '../index/index',
            })
            return
          }
          const room = snapshot.docs[0]
          console.log(snapshot.docs)
          console.log(snapshot.docChanges)
          let currentWord = '你画我猜'
          if (room.currentWord === '准备好！' || (room.currentDrawingOpenId === this.data.myOpenId && room.answering)) {
            currentWord = room.currentWord
          } else if (room.choosingWord) {
            currentWord = '等待玩家选词'
          }
          this.setData({
            drawingOpenId: room.currentDrawingOpenId,
            currentWord,
            currentSelectableWord: room.currentSelectableWord,
            joined: room.players.findIndex(player => player._openid === this.data.myOpenId) >= 0,
            players: room.players,
            started: room.started,
            choosingWord: room.choosingWord,
            answering: room.answering,
            timeoutTs: room.timeoutTs,
          })
        },
        onError: () => {
          wx.showToast({
            title: '同步的时候发生了错误',
          })
        }
      })
  },
  async timeoutRefreshCycle() {
    this.data._timer = null
    if (this.data.timeoutTs != null) {
      const seconds = Math.max(Math.ceil((this.data.timeoutTs - Date.now()) / 1000), 0);
      await wx.setNavigationBarTitle({
        title: `${this.data.currentWord} (${seconds})`,
      })
      if (seconds === 0 && this.data.players[0]._openid === this.data.myOpenId) {
        this.data._timeoutCache[this.data.timeoutTs] = this.data._timeoutCache[this.data.timeoutTs] || 1
        if (this.data._timeoutCache[this.data.timeoutTs] % 20 === 10) {
          await wx.cloud.callFunction({
            name: 'sendMessage',
            data: {
              roomId: this.data.roomId,
              msgType: 'timeout',
            },
          })
        }
        this.data._timeoutCache[this.data.timeoutTs] += 1
      }
    }
    this.data._timer = setTimeout(() => this.timeoutRefreshCycle(), 200)
  },
  async startGame() {
    await wx.cloud.callFunction({
      name: 'sendMessage',
      data: {
        roomId: this.data.roomId,
        msgType: 'start',
      }
    })
  },
  async sendText(content) {
    console.log(await wx.cloud.callFunction({
      name: 'sendMessage',
      data: {
        roomId: this.data.roomId,
        msgType: 'text',
        content,
      }
    }))
  },
  //// 事件
  handleClearAll() {
    wx.showModal({
      title: '提示',
      content: '确定要清空画作吗？',
      confirmColor: '#FF0000',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({
            title: '正在清空',
            mask: true,
          })
          await this.selectComponent('#graffitiBoard').clearAll()
          wx.hideLoading()
        }
      }
    })
  },
  handleUndoStroke() {
    this.selectComponent('#graffitiBoard').undoStroke()
  },
  handleBrushStylesChanged(event) {
    const { picker, value, index } = event.detail;
    switch (index) {
      case 0:
        const colorsColumn = tools[value[0]] === 'eraser' ? Object.keys(colors).slice(7) : Object.keys(colors).slice(0, 7)
        picker.setColumnValues(1, colorsColumn)
        setTimeout(() => picker.setColumnValue(1, tools[value[0]] === 'pen' ? this.data._penColor : '---'), 0)
        picker.setColumnValue(2, this.data._toolWidth[tools[value[0]]])
        break
      case 1:
        if (tools[value[0]] === 'pen') {
          this.data._penColor = value[1]
        }
        break
      default:
        this.data._toolWidth[tools[value[0]]] = value[2]
    }
    const values = picker.getValues()
    if (index === 0) {
      values[1] = tools[value[0]] === 'pen' ? this.data._penColor : '---'
      values[2] = this.data._toolWidth[tools[value[0]]]
    }
    this.setData({
      tool: tools[values[0]],
      color: colors[values[1]],
      previewBorderColor: colors[values[1]] === '#FFFFFF' ? '#CCCCCC' : colors[values[1]],
      width: widths[values[2]],
    })
  },
  handleRecognizeStart() {
    console.log(1)
    this.setData({
      mHidden: false,
    })
    siManager.start({
      lang: 'zh_CN',
    })
  },
  handleRecognizeStop() {
    this.setData({
      mHidden: true,
    })
    siManager.stop()
  },
  handleContentConform(event) {
    this.sendText(event.detail.value)
    this.setData({
      content: '',
    })
  },
  handleKeyboardHeightChange(event) {
    this.setData({
      footerOffset: event.detail.height || 0,
    })
  },
  handleJoinRoom(event) {
    if (event.detail.userInfo) {
      this.joinGameRoom()
    }
  },
  async handleChooseWord(event) {
    console.log(event.currentTarget.dataset['word'])
    await wx.cloud.callFunction({
      name: 'sendMessage',
      data: {
        roomId: this.data.roomId,
        msgType: 'choose',
        content: event.currentTarget.dataset['word'],
      },
    })
  },
  //// 生命周期函数
  onLoad(query) {
    this.setData({
      roomId: query.id,
    })
  },
  onUnload(options) {
    clearTimeout(this.data._timer)
  },
  async onReady() {
    this.setData({
      myOpenId: await app.getOpenIdAsync(),
    })
    this.initRoomWatch()
    siManager.onRecognize = res => {
      this.setData({
        content: res.result,
      })
    }
    siManager.onStop = res => {
      console.log(res)
      this.setData({
        content: res.result,
        focus: true,
      })
    }
    siManager.onError = res => {
      console.log(res)
    }
    app.getRecordAuth()
    this.timeoutRefreshCycle()
  },
  onShow() {

  },
  onHide() {

  },
  onPullDownRefresh() {

  },
  onReachBottom() {

  },
  onShareAppMessage() {
    return {
      title: '你画我猜：快来加入我的房间！',
      path: `/pages/gameRoom/gameRoom?id=${this.data.roomId}&type=join`,
    }
  },
  async handleDrawMyself() {
    this.setData({
      drawingOpenId: await app.getOpenIdAsync(),
    })
    console.log(this.data.drawingOpenId, this.data.myOpenId)
  },
  handleWatch() {
    this.setData({
      drawingOpenId: '',
    })
  },
})