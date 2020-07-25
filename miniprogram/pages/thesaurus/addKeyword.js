// miniprogram/pages/thesaurus/addKeyword.js
const db = wx.cloud.database()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    keywordList: "",
    myOpenId: null,
  },
  handleInput(e) {
    //console.log(e);
    const { keywordValue } = e.detail;
  },

  async btnSub(res) {
    await wx.showLoading({
      title: '正在更新词库...',
      mask: true,
    })
    const { key, cue } = res.detail.value
    await db.collection('keyword').add({
      data: {
        key,
        cue,
      }
    })
    await wx.hideLoading()
    await wx.navigateBack()
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

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