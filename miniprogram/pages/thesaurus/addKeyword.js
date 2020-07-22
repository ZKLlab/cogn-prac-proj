// miniprogram/pages/thesaurus/addKeyword.js
const db=wx.cloud.database()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    keywordList:"",
    myOpenId: null,
  },
  handleInput(e){
    //console.log(e);
    const {keywordValue}=e.detail;
  },
  addData(){
    wx.showLoading({
      title: '正在更新词库...',
    })
    db.collection("keyword").add({
      data:{
        key:"{keywordValue}"
      }
    }).then(res=>{
      console.log(res)
      wx.hideLoading()
    })
  },

  btnSub(res){
    wx.showLoading({
      title: '正在更新词库...',
    })
    var key=res.detail.value.key
    var cue=res.detail.value.cue
    db.collection("keyword").add({
      data:{
        key:key,
        cue:cue
      }
    }).then(res=>{
      console.log(key,cue)
      wx.hideLoading()
    })
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