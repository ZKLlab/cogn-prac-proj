const app = getApp()
var systemInfo = wx.getSystemInfoSync();

Page({
  data: {
    drawerOpenId: '',
    selectorWidth:['超级细','细','适中','粗','超级粗'],
    selectorColor:['黑色','蓝色','白色','黄色','绿色','红色']
  },
  selectorChange:function(e){
    let i = e.detail.value;
    let value = this.data.selectorItems[i];
    this.setData({selector:value});
  },
  onUnload(options) {

  },
  onReady() {

  },
  onShow() {

  },
  onHide() {

  },
  onUnload() {

  },
  onPullDownRefresh() {

  },
  onReachBottom() {

  },
  onShareAppMessage() {

  },
  handleDrawMyself() {
    this.setData({
      drawerOpenId: app.globalData.openid,
    })
  },
  handleWatch() {
    this.setData({
      drawerOpenId: '',
    })
  },
})