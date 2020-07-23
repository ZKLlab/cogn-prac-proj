const cloud = require('wx-server-sdk')

const TIMEOUT = {
  PREPARATION: 5 * 1000,  // 准备：5秒
  CHOOSE_WORD: 15 * 1000,  // 选词：15秒
  ANSWER: 2 * 60 * 1000,  // 作答：2分钟
  ANSWER_RIGHT: 30 * 1000,  // 有人回答正确，余下剩余时间：30秒
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
      await db.collection('chat')
        .add({
          data: {
            _openid: '',
            roomId,
            msgType: 'system',
            sendTime: new Date(),
            sendTimeTS: Date.now(),
            textContent: '游戏开始！适度游戏益脑，过度游戏伤身，合理安排时间，享受健康生活。',
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
        const res = await db.collection('keyword')
          .where({
            key: _.nin(data.apperedWords),
          })
          .limit(100)
          .get()
        res.data.sort(() => Math.round(Math.random))
        await db.collection('room').doc(roomId).update({
          data: {
            'players.$[].answerRight': false,
            currentDrawingOpenId: data.players[playerIndex]._openid,
            currentWord: null,
            currentSelectableWord: res.data.slice(0, 2).map(item => item.key),
            choosingWord: true,
            round,
            timeoutTs: Date.now() + TIMEOUT.CHOOSE_WORD,
          }
        })
        await db.collection('chat')
          .add({
            data: {
              _openid: '',
              roomId,
              msgType: 'system',
              sendTime: new Date(),
              sendTimeTS: Date.now(),
              textContent: `现在轮到 ${data.players[playerIndex].nickName} 绘画，请做好回答准备！`,
            },
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
      await db.collection('chat')
        .add({
          data: {
            _openid: '',
            roomId,
            msgType: 'system',
            sendTime: new Date(),
            sendTimeTS: Date.now(),
            textContent: `${word.length} 个字，提示：XXX`,
          },
        })
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
          // 个人首次回答正确
          await db.collection('room').doc(roomId).update({
            data: {
              [`players.${playerIndex}.answerRight`]: true,
              [`players.${playerIndex}.score`]: _.inc(notAnswerRightCount * 10),  // 加 没答对人数 * 10 分
              timeoutTs: Math.min(data.timeoutTs, Date.now() + TIMEOUT.ANSWER_RIGHT),
            }
          })
          await db.collection('chat')
            .add({
              data: {
                _openid: '',
                roomId,
                msgType: 'system',
                sendTime: new Date(),
                sendTimeTS: Date.now(),
                textContent: `恭喜 ${data.players[playerIndex].nickName} 回答正确，得分 + ${notAnswerRightCount * 10} ！`,
              },
            })
          if ((await db.collection('users')
            .where({
              _id: wxContext.OPENID
            }).get()).data.length === 0) {
            await db.collection('users').add({
              data: {
                _id: wxContext.OPENID,
                avatarUrl: data.players[playerIndex].avatar,
                nickName: data.players[playerIndex].nickName,
                credit: notAnswerRightCount * 10,
                turns: 1,
              }
            })
          } else {
            await db.collection('users').doc(wxContext.OPENID)
              .update({
                data: {
                  avatarUrl: data.players[playerIndex].avatar,
                  nickName: data.players[playerIndex].nickName,
                  credit: _.inc(notAnswerRightCount * 10),
                  turns: _.inc(1),
                },
              })
          }
          if (notAnswerRightCount >= data.players.length - 1) {
            await goToNextStage()
          }
        } else {
          msg = data.currentDrawingOpenId === wxContext.OPENID ? '你是绘画者，不能发送正确答案！' : '你已经正确回答过！'
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
                msgType: 'text',
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