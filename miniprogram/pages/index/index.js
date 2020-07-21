const app = getApp()

Page({
  data: {
    avatarUrl: './user-unlogin.png',
    userInfo: {},
    logged: false,
  },
  onLoad() {
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: res => {
              this.setData({
                avatarUrl: res.userInfo.avatarUrl,
                userInfo: res.userInfo,
              })
            },
          })
        }
      },
    })
  },
  processLoginCallback(event) {
    if (!this.data.logged && event.detail.userInfo) {
      this.setData({
        logged: true,
        avatarUrl: event.detail.userInfo.avatarUrl,
        userInfo: event.detail.userInfo,
      })
    }
  },
  async handleQuickStart(event) {
    this.processLoginCallback(event)
    wx.showToast({
      title: '开发中',
      icon: 'none',
    })
  },
  async handleCreateRoom(event) {
    this.processLoginCallback(event)
    if (this.data.logged) {
      // TODO: 选择词库
      await wx.showLoading({
        title: '请稍等',
      })
      const res = await wx.cloud.callFunction({
        name: 'createRoom',
        data: {
          userInfo: this.data.userInfo,
        }
      })
      await wx.redirectTo({
        url: `../gameRoom/gameRoom?id=${res.result.data._id}&type=create`,
      })
      await wx.hideLoading()
    }
  },
})
