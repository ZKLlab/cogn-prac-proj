const app = getApp()

const FATAL_REBUILD_TOLERANCE = 10
const SETDATA_SCROLL_TO_BOTTOM = {
  scrollTop: 100000,
  scrollWithAnimation: true,
}
const COLLECTION = 'chat'

Component({
  properties: {
    roomId: String,
    userInfo: Object,
    onGetUserInfo: {
      type: Function,
    },
  },

  data: {
    chats: [],
    textInputValue: '',
    openId: '',
    scrollTop: 0,
    scrollToMessage: '',
    hasKeyboard: false,
  },
  methods: {
    onGetUserInfo(e) {
      this.properties.onGetUserInfo(e)
    },
    mergeCommonCriteria(criteria) {
      return {
        roomId: this.data.roomId,
        ...criteria,
      }
    },
    async initRoom() {
      this.try(async () => {
        await this.initOpenId()

        const db = this.db = wx.cloud.database()
        const _ = db.command

        const { data: initList } = await db.collection(COLLECTION).where(this.mergeCommonCriteria()).orderBy('sendTimeTS', 'desc').get()
        this.setData({
          chats: initList.reverse(),
          scrollTop: 10000,
        })
        this.initWatch(initList.length ? {
          sendTimeTS: _.gt(initList[initList.length - 1].sendTimeTS),
        } : {})
      }, '初始化失败')
    },
    async initOpenId() {
      return this.try(async () => {
        const openId = await app.getOpenIdAsync()
        this.setData({
          openId,
        })
      }, '初始化 openId 失败')
    },
    async initWatch(criteria) {
      this.try(() => {
        const db = this.db
        const _ = db.command

        console.log(`开始监听`, criteria)
        this.messageListener = db.collection(COLLECTION).where(this.mergeCommonCriteria(criteria)).watch({
          onChange: this.onRealtimeMessageSnapshot.bind(this),
          onError: e => {
            if (!this.inited || this.fatalRebuildCount >= FATAL_REBUILD_TOLERANCE) {
              this.showError(this.inited ? '监听错误，已断开' : '初始化监听失败', e, '重连', () => {
                this.initWatch(this.data.chats.length ? {
                  sendTimeTS: _.gt(this.data.chats[this.data.chats.length - 1].sendTimeTS),
                } : {})
              })
            } else {
              this.initWatch(this.data.chats.length ? {
                sendTimeTS: _.gt(this.data.chats[this.data.chats.length - 1].sendTimeTS),
              } : {})
            }
          },
        })
      }, '初始化监听失败')
    },
    onRealtimeMessageSnapshot(snapshot) {
      console.log(`收到消息`, snapshot)
      if (snapshot.type === 'init') {
        this.setData({
          chats: [
            ...this.data.chats,
            ...[...snapshot.docs].sort((x, y) => x.sendTimeTS - y.sendTimeTS),
          ],
        })
        this.scrollToBottom()
        this.inited = true
      } else {
        let hasNewMessage = false
        let hasOthersMessage = false
        const chats = [...this.data.chats]
        for (const docChange of snapshot.docChanges) {
          switch (docChange.queueType) {
            case 'enqueue': {
              hasOthersMessage = docChange.doc._openid !== this.data.openId
              const ind = chats.findIndex(chat => chat._id === docChange.doc._id)
              if (ind > -1) {
                chats.splice(ind, 1, docChange.doc)
              } else {
                hasNewMessage = true
                chats.push(docChange.doc)
              }
              break
            }
          }
        }
        this.setData({
          chats: chats.sort((x, y) => x.sendTimeTS - y.sendTimeTS),
        })
        if (hasOthersMessage || hasNewMessage) {
          this.scrollToBottom()
        }
      }
    },
    async onConfirmSendText(e) {
      this.try(async () => {
        if (!e.detail.value) {
          return
        }
        const db = this.db
        const doc = {
          _id: `${Math.random()}_${Date.now()}`,
          roomId: this.data.roomId,
          avatar: this.data.userInfo.avatarUrl,
          nickName: this.data.userInfo.nickName,
          msgType: 'text',
          textContent: e.detail.value,
          sendTime: new Date(),
          sendTimeTS: Date.now(),
        }
        this.setData({
          textInputValue: '',
          chats: [
            ...this.data.chats,
            {
              ...doc,
              _openid: this.data.openId,
              writeStatus: 'pending',
            },
          ],
        })
        this.scrollToBottom(true)
        await db.collection(COLLECTION).add({
          data: doc,
        })
      })
    },
    scrollToBottom(force) {
      if (force) {
        console.log('force scroll to bottom')
        this.setData(SETDATA_SCROLL_TO_BOTTOM)
        return
      }
      this.createSelectorQuery().select('.chat-area').boundingClientRect(bodyRect => {
        this.createSelectorQuery().select('.chat-area').scrollOffset(scroll => {
          if (scroll.scrollTop + bodyRect.height * 3 > scroll.scrollHeight) {
            this.setData(SETDATA_SCROLL_TO_BOTTOM)
          }
        }).exec()
      }).exec()
    },
    async onScrollToUpper() {
      if (this.db && this.data.chats.length) {
        const _ = this.db.command
        const { data } = await this.db.collection(COLLECTION).where(this.mergeCommonCriteria({
          sendTimeTS: _.lt(this.data.chats[0].sendTimeTS),
        })).orderBy('sendTimeTS', 'desc').get()
        this.data.chats.unshift(...data.reverse())
        this.setData({
          chats: this.data.chats,
          scrollToMessage: `item-${data.length}`,
          scrollWithAnimation: false,
        })
      }
    },
    async try(fn, title) {
      try {
        await fn()
      } catch (e) {
        this.showError(title, e)
      }
    },
    showError(title, content, confirmText, confirmCallback) {
      console.error(title, content)
      wx.showModal({
        title,
        content: content.toString(),
        showCancel: confirmText ? true : false,
        confirmText,
        success: res => {
          res.confirm && confirmCallback()
        },
      })
    },
  },
  ready() {
    global.chatroom = this
    this.initRoom()
    this.fatalRebuildCount = 0
  },
})
