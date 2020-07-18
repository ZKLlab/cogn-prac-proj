App({
  onLaunch() {
    wx.cloud.init({
      traceUser: true,
    })
    this.globalData = {}
  }
})
