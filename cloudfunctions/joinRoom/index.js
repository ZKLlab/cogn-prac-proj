const cloud = require('wx-server-sdk')

const MAX_PLAYERS = 6;

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()
const _ = db.command

exports.main = async event => {
  const wxContext = cloud.getWXContext()
  const { roomId } = event
  const { data } = await db.collection('room').doc(roomId).get()
  if (data.players.length < MAX_PLAYERS
    && data.players.findIndex(player => player._openid === wxContext.OPENID) < 0
    && !data.started) {
    await db.collection('room').doc(roomId).update({
      data: {
        players: _.push([{
          _openid: wxContext.OPENID,
          nickName: event.userInfo.nickName,
          avatar: event.userInfo.avatarUrl,
          score: 0,
          answerRight: false,
        }]),
      },
    })
  }
  return {
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
}