// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  try{
    for (var index in exent.ranklist.data){
      if (this.data.ranklist.data[index]._id == wxContext.OPENID)
        return index+1
    }
    return 0
  } catch(e){
    console.error(e);
  }
}