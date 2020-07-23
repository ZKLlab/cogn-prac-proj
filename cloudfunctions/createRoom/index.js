const cloud = require('wx-server-sdk')

const TIMEOUT = {
  SETUP_ROOM: 10 * 60 * 1000,  // 组建房间：10分钟
}

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()

exports.main = async (event) => {
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
    currentWord: null,  // 当前词
    currentSelectableWord: null,  // 当前可选词
    started: false,  // 正式游戏阶段
    choosingWord: false,  // 选词阶段
    answering: false,  // 猜词阶段
    round: 0,  // 轮次：0或1
    timeoutTs: Date.now() + TIMEOUT.SETUP_ROOM,  // 时序管理：超时时间戳，组建房间限时10分钟
  }

  const data = await db.collection('room')
    .add({
      data: room,
    })

  await db.collection('chat')
    .add({
      data: {
        _openid: '',
        roomId: data._id,
        msgType: 'system',
        sendTime: new Date(),
        sendTimeTS: Date.now(),
        textContent: '房间创建成功，快叫小伙伴们进来玩吧！',
      },
    })

  return {
    data,
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
}