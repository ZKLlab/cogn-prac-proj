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

Page({
  options: {
    pureDataPattern: /^_/,
  },
  data: {
    drawingOpenId: '',
    myOpenId: null,
    tool: Object.values(tools)[0],
    color: Object.values(colors)[0],
    previewBorderColor: Object.values(colors)[0],
    width: Object.values(widths)[2],
    brushStylesPickerShown: false,
    brushStyleColumns: defaultBrushStyleColumns,
    // 以下：纯数据字段
    _penColor: '黑色',
    _toolWidth: { pen: '适中', eraser: '极粗' },
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
  closeBrushStylesPicker() {
    this.setData({
      brushStylesPickerShown: false,
    })
  },
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
  handleUndo() {
    wx.showToast({
      title: '开发中',
      icon: 'none',
    })
  },
  async onLoad() {
    this.setData({
      myOpenId: await app.getOpenIdAsync(),
    })
  },
  onUnload(options) {

  },
  onReady() {

  },
  onShow() {

  },
  onHide() {

  },
  onUnload() {

  },
  onPullDownRefresh() {

  },
  onReachBottom() {

  },
  onShareAppMessage() {

  },
  async handleDrawMyself() {
    this.setData({
      drawingOpenId: await app.getOpenIdAsync(),
    })
  },
  handleWatch() {
    this.setData({
      drawingOpenId: '',
    })
  },
})