const cloud = require('wx-server-sdk')

const TIMEOUT = {
  PREPARATION: 5 * 1000,  // 准备：5秒
  CHOOSE_WORD: 15 * 1000,  // 选词：15秒
  ANSWER: 2 * 60 * 1000,  // 作答：2分钟
  ROUND_SETTLEMENT: 10 * 1000,  // 回合结算：10秒
}

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const db = cloud.database()
const _ = db.command

exports.main = async event => {
  const wxContext = cloud.getWXContext()
  const { roomId, msgType, content } = event
  const { data } = await db.collection('room').doc(roomId).get()
  let msg = null

  const goToNextStage = async () => {
    const { started, choosingWord, answering } = data
    if (!started) {
      // 未开始 -> 准备开始
      await db.collection('room').doc(roomId).update({
        data: {
          started: true,
          currentWord: '准备好！',
          timeoutTs: Date.now() + TIMEOUT.PREPARATION,
        },
      })
    } else if (!choosingWord && !answering) {
      // 准备开始 或 回合结算 -> 玩家选词 或 关闭房间
      // TODO: 从词库中选词，并排除已出现词 appearedWords
      const playerIndexBefore = data.players.findIndex(player => player._openid === data.currentDrawingOpenId)
      let playerIndex = playerIndexBefore + 1
      let { round } = data
      if (playerIndex >= data.players.length) {
        round += 1
        playerIndex = 0
      }
      if (round < 2) {
        await db.collection('room').doc(roomId).update({
          data: {
            'players.$[].answerRight': false,
            currentDrawingOpenId: data.players[playerIndex]._openid,
            currentWord: null,
            currentSelectableWord: ['小米', '华为'],
            choosingWord: true,
            round,
            timeoutTs: Date.now() + TIMEOUT.CHOOSE_WORD,
          }
        })
      } else {
        await db.collection('room').doc(roomId).remove()
      }
    } else if (choosingWord) {
      // 选词 -> 作画作答
      if (data.currentWord == null) {
        const word = data.currentSelectableWord[Math.floor(Math.random() * 2)]
        await db.collection('room').doc(roomId).update({
          data: {
            currentWord: word,
            apperedWords: _.push([word]),
            choosingWord: false,
            answering: true,
            timeoutTs: Date.now() + TIMEOUT.ANSWER,
          }
        })
      } else {
        await db.collection('room').doc(roomId).update({
          data: {
            choosingWord: false,
            answering: true,
            timeoutTs: Date.now() + TIMEOUT.ANSWER,
          }
        })
      }
    } else if (answering) {
      // 作画作答 -> 回合结算
      await db.collection('room').doc(roomId).update({
        data: {
          choosingWord: false,
          answering: false,
          timeoutTs: Date.now() + TIMEOUT.ROUND_SETTLEMENT,
        }
      })
    }
  }
  const stageAssert = (s, c, a) => {
    const { started, choosingWord, answering } = data
    if (!(s === started && c === choosingWord && a === answering)) {
      throw 'assert'
    }
  }

  switch (msgType) {
    case 'start':
      stageAssert(false, false, false)
      await goToNextStage()
      break
    case 'choose':
      stageAssert(true, true, false)
      await db.collection('room').doc(roomId).update({
        data: {
          apperedWords: _.push([content]),
          currentWord: content,
        },
      })
      await goToNextStage()
      break
    case 'text':
      if (data.currentWord != null && content.indexOf(data.currentWord) >= 0) {
        const playerIndex = data.players.findIndex(player => player._openid === wxContext.OPENID && !player.answerRight)
        const notAnswerRightCount = data.players.filter(player => !player.answerRight).length
        if (data.currentDrawingOpenId !== wxContext.OPENID && data.currentWord != null && playerIndex >= 0) {
          // 首次回答正确
          await db.collection('room').doc(roomId).update({
            data: {
              [`players.${playerIndex}.answerRight`]: true,
              [`players.${playerIndex}.score`]: _.inc(notAnswerRightCount * 10),  // 加 没答对人数 * 10 分
            }
          })
          // TODO: 更新排行榜
          const flag = false,
          const db = cloud.database(),
          const _ = db.command,
          try {
            db.collection('users')
            .where({
              _id: wxContext.OPENID
            }).get({
              success: function(res){
                if(res.data.length == 0){
                  flag = true
                }
              }
            })
            if (flag){
              await db.collection('users').add({
                  data: {
                    _id: wxContext.OPENID,
                    avatarUrl: data.players[playerIndex].avatar,
                    nickName: data.players[playerIndex].nickName,
                    credit: data.players[playerIndex].score,
                    turns: 1,
                  }
                })
            } else{
              await db.collection("users").doc(wxContext.OPENID)
                .update({
                  data: {
                    avatarUrl: data.players[playerIndex].avatar,
                    nickName: data.players[playerIndex].nickName,
                    credit: _.inc(data.players[playerIndex].score),
                    turns: _.inc(1),
                  },
                })
            }
          }  catch(e){
            console.error(e);
          }            
          //
          if (notAnswerRightCount >= data.players.length - 1) {
            await goToNextStage()
          }
        }
      } else {
        const playerIndex = data.players.findIndex(player => player._openid === wxContext.OPENID)
        if (playerIndex >= 0) {
          let safe = true
          try {
            await cloud.openapi.security.msgSecCheck({
              content,
            })
          } catch (e) {
            safe = false
          }
          await db.collection('chat')
            .add({
              data: {
                _openid: wxContext.OPENID,
                roomId,
                avatar: data.players[playerIndex].avatar,
                nickName: data.players[playerIndex].nickName,
                sendTime: new Date(),
                sendTimeTS: Date.now(),
                textContent: safe ? content : '***',
              },
            })
        }
      }
      break
    default:
      if (Date.now() > data.timeoutTs) {
        await goToNextStage()
      }
  }

  return {
    event,
    msg,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
}