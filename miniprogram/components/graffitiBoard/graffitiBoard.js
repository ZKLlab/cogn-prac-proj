const app = getApp()

Component({
  options: {
    pureDataPattern: /^_/,
  },
  properties: {
    roomId: String,
    drawingOpenId: String,
    color: String,
    width: String,
  },
  data: {
    myTurn: false,
    // 以下：纯数据字段
    _watcher: null,
    _strokes: [],
    _strokesQueue: [],
    _drawingStrokes: {},
    _ctx: null,
    _realWidth: null,
    _addStrokesFlag: false,
  },
  methods: {
    //// 触摸事件
    // 触摸开始事件
    handleTouchStart(event) {
      if (this.data.myTurn) {
        event.changedTouches.forEach(touch => {
          let { identifier, x, y } = touch
          x = Math.round(x * 750 / this.data._realWidth)
          y = Math.round(y * 750 / this.data._realWidth)
          this.data._drawingStrokes[identifier] = {
            roomId: this.properties.roomId,
            strokeStyle: this.properties.color,
            lineWidth: this.properties.width,
            points: [[x, y]],
          }
        })
        this.redraw()
      }
    },
    // 触摸移动事件
    handleTouchMove(event) {
      if (this.data.myTurn) {
        event.changedTouches.forEach(touch => {
          let { identifier, x, y } = touch
          x = Math.round(x * 750 / this.data._realWidth)
          y = Math.round(y * 750 / this.data._realWidth)
          this.data._drawingStrokes[identifier].points.push([x, y])
        })
        this.redraw()
      }
    },
    // 触摸结束事件
    handleTouchEnd(event) {
      if (this.data.myTurn) {
        event.changedTouches.forEach(touch => {
          let { identifier, x, y } = touch
          if (this.data._drawingStrokes[identifier].points.length > 1) {
            x = Math.min(Math.max(Math.round(x * 750 / this.data._realWidth), 0), 750)
            y = Math.min(Math.max(Math.round(y * 750 / this.data._realWidth), 0), 600)
            this.data._drawingStrokes[identifier].points.push([x, y])
          } else {
            x = this.data._drawingStrokes[identifier].points[0][0]
            y = this.data._drawingStrokes[identifier].points[0][1]
            this.data._drawingStrokes[identifier].points.push([x, y])
          }
          this.data._strokes.push(this.data._drawingStrokes[identifier])
          this.data._strokesQueue.push(this.data._drawingStrokes[identifier])
          delete this.data._drawingStrokes[identifier]
        })
        this.redraw()
        this.addStrokes()
      }
    },
    //// 绘制
    // 使用stroks数组的数据重绘画板
    redraw() {
      if (this.data._ctx != null) {
        this.data._ctx.fillStyle = '#ffffff'
        this.data._ctx.fillRect(0, 0, this.data._realWidth, this.data._realWidth)
        this.data._strokes.concat(Object.values(this.data._drawingStrokes)).forEach((stroke, index) => {
          this.data._ctx.beginPath()
          this.data._ctx.lineWidth = Math.ceil(stroke.lineWidth * this.data._realWidth / 750)
          this.data._ctx.strokeStyle = stroke.strokeStyle
          this.data._ctx.lineCap = 'round'
          for (let i = 0; i < stroke.points.length - 1; i++) {
            const point1 = stroke.points[i]
            const point2 = stroke.points[i + 1]
            this.data._ctx.moveTo(point1[0] * this.data._realWidth / 750, point1[1] * this.data._realWidth / 750)
            this.data._ctx.lineTo(point2[0] * this.data._realWidth / 750, point2[1] * this.data._realWidth / 750)
          }
          this.data._ctx.closePath()
          this.data._ctx.stroke()
          if (index >= this.data._strokes.length && stroke.strokeStyle === '#FFFFFF') {
            this.data._ctx.beginPath()
            const point = stroke.points[stroke.points.length - 1]
            this.data._ctx.lineWidth = 1
            this.data._ctx.strokeStyle = '#CCCCCC'
            this.data._ctx.arc(point[0] * this.data._realWidth / 750, point[1] * this.data._realWidth / 750, Math.ceil(stroke.lineWidth * this.data._realWidth / 750 / 2), 0, 2 * Math.PI)
            this.data._ctx.closePath()
            this.data._ctx.stroke()
          }
        })
      }
    },
    //// 同步相关
    // 初始化实时画板更新事件
    initStrokeWatch() {
      const db = wx.cloud.database()
      this.data._watcher = db.collection('stroke')
        .where({
          roomId: this.properties.roomId,
        })
        .watch({
          onChange: snapshot => {
            console.log(JSON.stringify(snapshot.docs).length)
            console.log(snapshot.docs)
            if (!this.data.myTurn) {
              this.data._strokes = snapshot.docs
              this.redraw()
            }
          },
          onError: () => {
            wx.showToast({
              title: '同步的时候发生了错误',
            })
          }
        })
    },
    // 取消实时画板更新事件
    stopStrokeWatch() {
      if (this.data._watcher != null) {
        console.log('closed')
        this.data._watcher.close()
        this.data._watcher = null
      }
    },
    // 循环向数据库添加笔画
    async addStrokes() {
      if (!this.data._addStrokesFlag) {
        this.data._addStrokesFlag = true
        while (this.data._strokesQueue.length > 0) {
          const data = this.data._strokesQueue.shift()
          const db = wx.cloud.database()
          await db.collection('stroke').add({ data })
        }
        this.data._addStrokesFlag = false
      }
    },
    async clearAll() {
      this.data._strokes = []
      this.data._strokesQueue = []
      this.data._drawingStrokes = {}
      await wx.cloud.callFunction({
        name: 'clearMyStrokes',
      })
      this.redraw()
    }
  },
  //// 观察者
  observers: {
    async drawingOpenId(drawingOpenId) {
      this.data._strokes = []
      this.data._strokesQueue = []
      this.data._drawingStrokes = {}
      this.redraw()
      if (drawingOpenId !== await app.getOpenIdAsync()) {
        this.setData({
          myTurn: false,
        })
      }
      await wx.cloud.callFunction({
        name: 'clearMyStrokes',
      })
      if (drawingOpenId === await app.getOpenIdAsync()) {
        this.setData({
          myTurn: true,
        })
      }
    },
  },
  //// 生命周期函数
  async attached() {
    await wx.cloud.callFunction({
      name: 'clearMyStrokes',
    })
    const query = wx.createSelectorQuery().in(this)
    query.select('#graffitiCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = wx.getSystemInfoSync().pixelRatio
        canvas.width = res[0].width * dpr
        canvas.height = res[0].height * dpr
        ctx.scale(dpr, dpr)
        this.data._ctx = ctx
        this.data._realWidth = res[0].width
        this.redraw()
      })
    this.initStrokeWatch()
  },
  detached() {
    this.stopStrokeWatch()
  },
})