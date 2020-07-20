App({
  onLaunch() {
    wx.cloud.init({
      traceUser: true,
    })
    this.openId = null
    this.getRecordAuth = () => {
      wx.getSetting({
        success: (res) => {
          if (!res.authSetting['scope.record']) {
            wx.authorize({
              scope: 'scope.record',
              success() {
                console.log("succ auth")
              }, fail() {
                console.log("fail auth")
              }
            })
          } else {
            console.log("record has been authed")
          }
        },
        fail: (res) => {
          console.log("fail")
          console.log(res)
        }
      })
    }
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
