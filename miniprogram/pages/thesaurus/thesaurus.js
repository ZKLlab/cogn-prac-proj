// miniprogram/pages/thesaurus/thesaurus.js
const db=wx.cloud.database()
//const app = getApp()
//const cloud = require('wx-server-sdk')
//scloud.init()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    keywordList:"",
    openId:""
  },


  getData(){
    /*db.collection("keyword").get({
      success:res=>{
        console.log(res)
        this.setData({
          keywordList:res.data
        })
      }
    })*/
    db.collection("keyword").where({
      openid:result.openid
    }).get()
    .then(res=>{
      console.log(res)
      this.setData({
        keywordList:res.data
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

  getOpenid(){
    let that=this;
    wx.cloud.callFunction({
      name:"getOpenid",
      compelete:res=>{
        console.log(res.result.openId)
        var openid=res.result.openId;
        that.setData({
          openid:openid
        })
      }
    })
  },



  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

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