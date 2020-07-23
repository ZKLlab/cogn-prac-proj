const cloud = require('wx-server-sdk')

const PLAYERS_NUM = 2;
const TIMEOUT = {
  QUICK_MATCH: 30 * 1000,  // 快速匹配：30秒
  PREPARE: 10 * 60 * 1000,  // 准备：10秒
}

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()

  const res = await db.collection('match')
    .where({
      _openid: _.neq(wxContext.OPENID),
      timeoutTs: _.lt(Date.now()),
      roomId: _.eq(null),
    })
    .limit(PLAYERS_NUM - 1)
    .get()

  if (res.data.length === PLAYERS_NUM - 1) {
    const room = {
      _openid: wxContext.OPENID,
      createTime: new Date(),
      players: res.data.map(player => ({
        _openid: player._openid,
        nickName: player.nickName,
        avatar: player.avatar,
        score: 0,
        answerRight: false,
      })).concat([{
        _openid: wxContext.OPENID,
        nickName: player.nickName,
        avatar: player.avatar,
        score: 0,
        answerRight: false,
      }]),
      appearedWords: [],
      currentDrawingOpenId: null,
      currentWord: null,
      currentSelectableWord: null,
      started: true,
      choosingWord: false,
      answering: false,
      round: 0,
      timeoutTs: Date.now() + TIMEOUT.PREPARE,
    }

    const data = await db.collection('room')
      .add({
        data: room,
      })

    res.data.forEach(player => {
      await db.collection('match').doc(player._id)
        .update({
          data: {
            roomId: data._id,
          },
        })
    })
    await db.collection('chat')
      .add({
        data: {
          _openid: '',
          roomId: data._id,
          msgType: 'system',
          sendTime: new Date(),
          sendTimeTS: Date.now(),
          textContent: '游戏开始！',
        },
      })
    return {
      event,
      type: 'create',
      data,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    }
  } else {
    const data = await db.collection('match').add({
      data: {
        _openid: wxContext.OPENID,
        nickName: event.userInfo.nickName,
        avatar: event.userInfo.avatarUrl,
        roomId: null,
        timeoutTs: Date.now() + TIMEOUT.QUICK_MATCH,
      },
    })
    return {
      event,
      type: 'wait',
      data,
      openid: wxContext.OPENID,
      appid: wxContext.APPID,
      unionid: wxContext.UNIONID,
    }
  }
}