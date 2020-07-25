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
    await wx.showToast({
      title: '开发中',
      icon: 'none',
    })
    return
    if (this.data.logged) {
      await wx.showLoading({
        title: '正在匹配',
        mask: true,
      })
      const timer = setTimeout(async () => {
        await wx.hideLoading()
        await wx.showToast({
          title: '匹配超时！',
          icon: 'none',
          duration: 3000,
        })
      }, 30 * 1000)
      const res = await wx.cloud.callFunction({
        name: 'quickStart',
        data: {
          userInfo: this.data.userInfo,
        }
      })
      if (res.result.type === 'create') {
        await wx.redirectTo({
          url: `../gameRoom/gameRoom?id=${res.result.data._id}`,
        })
        await wx.hideLoading()
        clearTimeout(timer)
      } else if (res.result.type === 'wait') {
        const db = wx.cloud.database()
        const watcher = db.collection('match')
          .doc(res.result.data._id)
          .watch({
            onChange: async snapshot => {
              if (snapshot.docs[0].roomId != null) {
                await wx.redirectTo({
                  url: `../gameRoom/gameRoom?id=${snapshot.docs[0].roomId}`,
                })
                watcher.close()
              }
            },
            onError: async () => {
              clearTimeout(timer)
              await wx.hideLoading()
              await wx.showToast({
                title: '匹配错误！',
                icon: 'none',
                duration: 3000,
              })
            },
          })
      }
    }
  },
  async handleCreateRoom(event) {
    this.processLoginCallback(event)
    if (this.data.logged) {
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
