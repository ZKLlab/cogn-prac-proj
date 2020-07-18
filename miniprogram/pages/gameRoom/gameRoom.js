const app = getApp()

Page({
  data: {
    drawerOpenId: '',
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
  handleDrawMyself() {
    this.setData({
      drawerOpenId: app.globalData.openid,
    })
  },
  handleWatch() {
    this.setData({
      drawerOpenId: '',
    })
  },
})