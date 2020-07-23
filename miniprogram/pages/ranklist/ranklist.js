//var page = 1;
//var pre_ranking = [1, 2, 3, 4, 5];
Page({
  /**
   * 页面的初始数据
   */
  data: {
    uranking: 0,
    //ranking: [1, 2, 3, 4, 5],
    ranklist: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (element) {
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: async function () {
    wx.showLoading({
      title: '玩命加载中',
    })
    //page = 1,
    //pre_ranking = [1, 2, 3, 4, 5],
    this.setData({
      //ranking: [1, 2, 3, 4, 5],
      ranklist: []
    })
    this.getRankList(1, false)
    for (let index = 0; index < this.data.ranklist.length; index++){
      if (this.data.ranklist.data[index]._id == await app.getOpenIdAsync())
        uranking = index + 1
    }
    wx.hideLoading()
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
    //page = 1,
   // pre_ranking = [1, 2, 3, 4, 5],
    this.setData({
      //ranking: [1, 2, 3, 4, 5],
      ranklist: []
    })
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    wx.showNavigationBarLoading();
    this.onLoad();
    wx.hideNavigationBarLoading();
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   *//*
  onReachBottom: function () {
    wx.showLoading({
      title: '玩命加载中',
    })
    page++,
    this.getRankList(page, true),
    wx.hideLoading();
  },*/

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  getRankList: function (pagenum, flag) {
    wx.cloud.init({
      traceUser: true
    })
    wx.cloud.callFunction({
      name: 'getRankListResult',
      data: {
        pageid: pagenum
      },
      complete: res => {
        if (res) {
          this.setData({
            ranklist: res.result.data,
          })
        }

        

        /*if (flag) {
          pre_ranking[0] += 5,
          pre_ranking[1] += 5,
          pre_ranking[2] += 5,
          pre_ranking[3] += 5,
          pre_ranking[4] += 5,
          this.setData({
            ranking: pre_ranking
          })
        }*/
      }
    })
  },
})
