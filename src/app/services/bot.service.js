const crypto = require("crypto");

class BotService {

  getTokenText(user){

    const id = crypto.randomBytes(16).toString("hex");
    const time = Date.now();
    let msg = "avis:"+user+":"+time+":"+id;
    console.log('token text: ',msg)
    return msg
  }
  
}

module.exports = BotService