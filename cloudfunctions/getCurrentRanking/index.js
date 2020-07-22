// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  try{
    for (const index in event.ranklist.data){
      if (event.ranklist.data[index].openid == event.openid)
        return index+1
    }
    return 0
  } catch(e){
    console.error(e);
  }
}