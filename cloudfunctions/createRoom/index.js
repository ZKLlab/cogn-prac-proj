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
    players: [{
      _openid: wxContext.OPENID,
      nickName: event.userInfo.nickName,
      avatar: event.userInfo.avatarUrl,
      score: 0,
      answerRight: false,
    }],
    appearedWords: [],
    //// 游戏状态机
    currentDrawingOpenId: null,  // 当前轮到的玩家
    currentWordSignature: null,  // 当前词的哈希签名
    currentWordLength: null,  // 长度提示
    started: false,  // 正式游戏阶段
    choosingWord: false,  // 选词阶段
    answering: false,  // 猜词阶段
    round: 0,  // 轮次：0或1
  }

  const data = await db.collection('room')
    .add({
      data: room,
    })

  return {
    data,
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
}