const crypto = require("crypto");

class BotService {

  getTokenText(user){
    const id = crypto.randomBytes(16).toString("hex");
    const time = Date.now();
    let msg = "avis:"+user+":"+time+":"+id;
    console.log('token text: ',msg)
    return msg
  }

  postMessage(app,msg,target){
    app.client.chat.postMessage({
      token: process.env.SLACK_BOT_TOKEN,
      channel: target,
      text: msg,
      as_user: true
    });
  } 
}

module.exports = BotService