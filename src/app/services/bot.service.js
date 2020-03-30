const crypto = require("crypto");
const Constants = require('../constants')
const TokenService = require('../services/token.service')
const reportPanel = require('../pages/report.card')
const UserStoreService = require('../services/userstore.service')
const userStoreService = new UserStoreService();
const tokenService = new TokenService()
let usersStore = userStoreService.getStore();
let userIdList = userStoreService.getUserIDsList();
class BotService {

  /**
   * Generate Token message
   * @param {token  message} user 
   */
  generateToken(user){
    const id = crypto.randomBytes(16).toString("hex");
    const time = Date.now();
    let token = "avis:"+user+":"+time+":"+id;
    console.log('token text: ',token)
    tokenService.addToken(token)
    return token
  }

  /**
   * Send the message to user/channel
   * @param {app instance} app 
   * @param {Message} msg 
   * @param {user or channel} target 
   */
  postMessage(app,msg,target){
    app.client.chat.postMessage({
      token: process.env.SLACK_BOT_TOKEN,
      channel: target,
      text: msg,
      as_user: true
    });
  } 
  
  /**
   * Check the replied time is with in the configure time
   * @param {time} sentTime 
   */
  repliedInTime(sentTime) {
    let now = new Date();
    console.log('now :: ', now)
    console.log('sent time input::' + sentTime.trim() + ':::')
    let sendTime = new Date(parseInt(sentTime, 10));
    console.log('sendTime :: ', sendTime)
    let CONFIG_MIN = Constants.config.TOKEN_EXPIRE_TIME * 60 * 1000;
    console.log('CONFIG_MIN minutes :: ', CONFIG_MIN)
    console.log('differnce :: ', (now - sendTime))
    if ((now - sendTime) > CONFIG_MIN) {
      console.log('Delayed by more than '+Constants.config.TOKEN_EXPIRE_TIME+' mins');
      return false;
    }
    return true;
  }
  /**
   * Formate the current time
   * @param {date} date 
   */
  formatAMPM(date) {
    var currentTime = new Date();
    var currentOffset = currentTime.getTimezoneOffset();
    var ISTOffset = 330;   // IST offset UTC +5:30 
    var ISTTime = new Date(currentTime.getTime() + (ISTOffset + currentOffset)*60000);
  // ISTTime now represents the time in IST coordinates
    var hours = ISTTime.getHours();
    var minutes = ISTTime.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    var strTime = hours + ':' + minutes + ':' + ampm;
    return strTime;
  }

  /**
   * Send report at the end of the day
   * @param {app instance} app 
   */
  sendReport(app){
    try {
        app.client.chat.postMessage({
          token: process.env.SLACK_BOT_TOKEN,
          channel: Constants.config.AVIS_STATUS_CHANNEL_ID,
          text: ':+1:',
          blocks: reportPanel.getReportPanel(usersStore,userIdList)
        });
    } catch (error) {
      console.error(error);
    } 
  }
  
  /**
   * validate the is the report generation and post time
   * @param {current timestamp} currentTime 
   */
  isReportTime(currentTime){
    console.log('currentTime :: ',currentTime)
    let ampm = currentTime[2];
    let hour  = currentTime[0]
    let minute = currentTime[1];
    if(ampm == 'pm' && hour == 6 && minute >=30){
      return true;
    }
  }

/* 
  Ignore the below logic..its hurry code, this code need re-look its horrible logics..pure vanila logic
*/
workingTime(currentTime){
  console.log('currentTime :: ',currentTime)
  let ampm = currentTime[2];
  let hour  = currentTime[0]
  let minute = currentTime[1];
  if(ampm == 'am'){
    if(hour == 9){
      if(minute >=30){
        return true;
      }
    }
    if(hour > 9 && hour < 12){
      return true;
    }
  }
  if(ampm == 'pm'){
    if(hour > 12 || hour <= 1){
      return true;
    }
    if(hour >=1 && hour <=2){
      console.log('its lunch break :::')
    }
    if(hour >= 2 || hour <= 6){
      return true;
    }
    if(hour == 6 && minute <=30){
      return true;
    }
  }
  return false;
}

 
}

module.exports = BotService