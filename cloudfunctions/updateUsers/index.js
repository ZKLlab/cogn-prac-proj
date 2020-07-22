// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { userId } = event,
  const flag = false,
  const db = cloud.database(),
  const _ = db.command,
  try {
    db.collection('users')
    .where({
      openid: event.id
    }).get({
      success: function(res){
        if(res.data.length == 0){
          flag = true
        }
      }
    })
    if (flag){
      return await db.collection('users').add({
          data: {
            _id: wxContext.OPENID,
            avatarUrl: event.userInfo.avatarUrl,
            nickName: event.userInfo.nickNam,
            credit: event.to_credit,
            turns: 1,
            creditTurn: event.to_credit
          }
        })
    } else{
      return await db.collection("users").doc(event)
        .update({
          data: {
            credit: _.inc(event.to_credit),
            turns: _.inc(1),
            creditTurn: 
              db.collection('users')
              .where({
                data: {
                  openid : event.to_id
                }
              }).get({
                success: function(res){
                  return res.data[0].credit
                }
              })
              /
              db.collection('users')
              .where({
                data: {
                  openid: event.to_id
                }
              }).get({
                success: function(res){
                  return res.data[0].turns
                }
              })
          },
          success: console.log,
          fail: console.error
        })
    }
  }  catch(e){
    console.error(e);
  }  
}