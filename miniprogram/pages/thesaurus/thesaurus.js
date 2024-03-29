// miniprogram/pages/thesaurus/thesaurus.js
const db = wx.cloud.database()
const app = getApp()
//const cloud = require('wx-server-sdk')
//scloud.init()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    keywordList: "",
    myOpenId: ""
  },


  getData() {
    console.log(this.data.myOpenId),
      /*db.collection("keyword").get({
        success:res=>{
          console.log(res)
          this.setData({
            keywordList:res.data
          })
        }
      })*/

      db.collection("keyword").where({
        _openid: this.data.myOpenId
      }).get()
        .then(res => {
          console.log(res)
          this.setData({
            keywordList: res.data
          })
        })
  },



  /*exports.main = async (event, context) => {
    try {
      const result = await cloud.openapi.soter.verifySignature({
          openid: '$openid',
          jsonString: '$resultJSON',
          jsonSignature: '$resultJSONSignature'
        })
      return result
    } catch (err) {
      return err
    }
  },*/

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  removeKeyword(event) {
    wx.showModal({
      title: `确定要删除“${event.currentTarget.dataset.word}”吗？`,
      content: '此操作不可恢复。',
      confirmColor: 'red',
      success: async (res) => {
        if (res.confirm) {
          await db.collection('keyword').doc(event.currentTarget.dataset.id).remove()
          await this.fetchData()
        }
      },
    })
  },
  async fetchData() {
    this.setData({
      myOpenId: await app.getOpenIdAsync()
    })
    const res = await db.collection('keyword')
      .where({
        _openid: this.data.myOpenId,
      })
      .get()
    console.log(res)
    this.setData({
      keywordList: res.data
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  async onReady() {
    await this.fetchData()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})