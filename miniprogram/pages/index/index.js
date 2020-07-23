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
  onShow() {
    wx.setNavigationBarTitle({
      title: '你画我猜',
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
    if (this.data.logged) {
      await wx.showLoading({
        title: '请稍等',
      })
      const res = await wx.cloud.callFunction({
        name: 'quickMatch',
        data: {
          userInfo: this.data.userInfo,
        }
      })
      if (res.result.type === 'create') {
        await wx.redirectTo({
          url: `../gameRoom/gameRoom?id=${res.result.data._id}`,
        })
        await wx.hideLoading()
      } else if (res.result.type === 'wait') {
        const watcher = db.collection('room')
          .doc(res.result.data._id)
          .watch({
            onChange: async snapshot => {
              if (snapshot.doc.roomId != null) {
                await wx.redirectTo({
                  url: `../gameRoom/gameRoom?id=${snapshot.doc.roomId }`,
                })
                await wx.hideLoading()
                watcher.close()
              }
            },
          })
      }
    }
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
        url: `../gameRoom/gameRoom?id=${res.result.data._id}`,
      })
      await wx.hideLoading()
    }
  },
})
