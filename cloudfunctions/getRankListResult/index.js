// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const db = cloud.database();
  const wxContext = cloud.getWXContext()
  try{
    return await db.collection('users')
      .orderBy('credit', 'desc')
      .orderBy('credit_turn', 'desc')
      .orderBy('turns', 'desc')
      .limit(20)
      .get({
        success: function(res){
          return res
        }
      });
  } catch(e){
    console.error(e);
  }
}