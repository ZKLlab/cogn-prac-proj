const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  const room = {
    _openid: wxContext.OPENID,
    createTime: new Date(),
    currentDrawingOpenId: null,
    players: [{
      _openid: wxContext.OPENID,
      nickName: '房主',  // TODO: 获取用户昵称
      avatar: '/pages/index/user-unlogin.png',  // TODO: 获取用户头像
      score: 0,
      answerRight: false,
    }],
    appearedWords: [],
    currentWordSignature: null,
    currentWordLength: null,
    status: 'WAITING',
    round: 0,
  }

  const data = await db.collection('room')
    .add(room)

  return {
    data,
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
}