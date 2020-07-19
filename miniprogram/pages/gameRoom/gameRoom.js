const app = getApp()

Page({
  data: {
    drawingOpenId: '',
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