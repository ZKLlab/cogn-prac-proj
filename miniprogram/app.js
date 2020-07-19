App({
  onLaunch() {
    wx.cloud.init({
      traceUser: true,
    })
    this.openId = null
    this.getOpenIdAsync = async () => {
      if (this.openId == null) {
        const loginRes = await wx.cloud.callFunction({
          name: 'login',
        })
        this.openId = loginRes.result.openid
      }
      return this.openId
    }
    this.globalData = {}
  }
})
