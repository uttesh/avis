const { App } = require('@slack/bolt');
const Constants = require('./src/app/constants')
const cron = require('node-cron');
const routineCheck = require('./src/app/pages/routine_check');
const reportPanel = require('./src/app/pages/report.card');
const BotService = require('./src/app/services/bot.service');
const UserStoreService = require('./src/app/services/userstore.service')

const botService = new BotService();
const userStoreService = new UserStoreService();

// You probably want to use a database to store any user information ;)
let usersStore = userStoreService.getStore();
let userIdList = userStoreService.getUserIDsList();
let publishedToken = [];

/**
 * Initializing the app object from the keys
 */
const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN
});

 /**
  * Do Something when user opens the bot char window
  */
app.event(Constants.APP_HOME_OPENED, ({ event, say,payload }) => {  
 // avisEventsHandler.appOpened(event, say,payload);
});

/**
 *  Send the Token message to the User, DM to user
 * @param {User Id} user 
 */
async function sendCheck(user){
  try {
    let userId = user['id'];
    userStoreService.addTotalCheckForUser(userId);
    let totalCheck =  userStoreService.getTotalCheckByUser(userId)
    let tknMeesage = botService.getTokenText(userId);
    app.client.chat.postMessage({
      token: process.env.SLACK_BOT_TOKEN,
      channel: userId,
      text: Constants.Messages.TOKEN_CHECK_MSG,
      as_user: true,
      blocks: routineCheck.getCheckTaskRequestButton(totalCheck,user,tknMeesage)
    });
  }
  catch (error) {
    console.error(error);
  } 
}

/**
 * Fetch the all user from the client
 */
async function fetchUsers() {
  try {
    // Call the users.list method using the built-in WebClient
    const result = await app.client.users.list({
      // The token you used to initialize your app
      token: process.env.SLACK_BOT_TOKEN
    });
    saveUsers(result.members);
  }
  catch (error) {
    console.error(error);
  }
}

/**
 * save the user data
 * @param {} usersArray 
 */
async function saveUsers(usersArray) {
  usersArray.forEach(function (user) {
    if (!user[Constants.DELETED] && !user[Constants.IS_BOT]) {
      userIdList.push(user.id);
      userStoreService.initStoreByUser(user)
    }
  });
}

/**
 * Any app related error will be logged here
 */
app.error((error) => {
  console.error(message);
});

/**
 * Read all the incoming message and check for the token related message (This methis need to be changes, its looking in all messages which is not good of the performance)
 */
app.event(Constants.events.MESSAGE, (message, body) => {
  if (!message.subtype && message.payload.text.indexOf('avis:') >= 0) {
    console.log('replied message :::', message.payload.text);
    let data = message.payload.text.split(":");
    console.log('data :::', message.payload.text)
    let tknMsg =  message.payload.text.replace(/```/g,'');
    console.log('data :::', message.payload.text)
    console.log('tknMsg :::', tknMsg)
    console.log('tknMsg msg exists in the list :::', usersStore[data[1]].tokenMessages.indexOf(tknMsg))
    if (usersStore[data[1]].tokenMessages.indexOf(tknMsg) == -1) {
      let flag = repliedInTime(data[2]);
      usersStore[data[1]].tokenMessages.push(tknMsg);
      console.log(usersStore[data[1]].tokenMessages);
      try {
        if (flag) {
          usersStore[data[1]].checkedCount = usersStore[data[1]].checkedCount + 1;
          botService.postMessage(app,Constants.Messages.TOKEN_RECEIVED_MSG,data[1])
        } else {
          botService.postMessage(app,Constants.Messages.TOKEN_LATE_REPLY,data[1])
        }
      } catch (error) {
        console.error(error);
      }
    }else{
      botService.postMessage(app,Constants.Messages.TOKEN_RE_SUBMIT,data[1])
    }
  }
});

function repliedInTime(sentTime) {
  let now = new Date();
  console.log('now :: ', now)
  console.log('sent time input::' + sentTime.trim() + ':::')
  let sendTime = new Date(parseInt(sentTime, 10));
  console.log('sendTime :: ', sendTime)
  let FIVE_MIN = 5 * 60 * 1000;
  console.log('five minutes :: ', FIVE_MIN)
  console.log('differnce :: ', (now - sendTime))

  if ((now - sendTime) > FIVE_MIN) {
    console.log('Delayed by more than 5 mins');
    return false;
  }
  return true;
}

function formatAMPM(date) {
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

async function scheduleTask() {
  cron.schedule('*/2 * * * *', async() => {
     if(userIdList.length == 0){
        await fetchUsers();
      }
    let today = new Date();
    console.log('running a task every two minutes');
    console.log('current time: ',formatAMPM(today))
    console.log('day of the week : ',today.getDay())
    let currentTime = formatAMPM(today).split(':');
    let openingDays = [ 1, 2, 3, 4 , 5 ];
    console.log('userIdList :: ',userIdList.length)
    userIdList.forEach(userId => {
      if (userId === 'U1FAMB9QR') {
        let user = usersStore[userId].user;
        sendCheck(user);
      }
    });
  //   if(openingDays.includes( today.getDay() )){
  //   if (workingTime(currentTime)) {
  //     if(userIdList.length == 0){
  //       fetchUsers();
  //     }
  //     userIdList.forEach(userId => {
  //       if (userId === 'U1FAMB9QR') {
  //         let user = usersStore[userId].user;
  //         sendCheck(user);
  //       }
  //     });
  //   } else {
  //     if(isReportTime(currentTime)){
  //         sendReport();
  //         reset();
  //     }
  //     console.log('its not working hour !!!!');
  //   }
  // }else {
  //   console.log('its Weekend !!!!');
  // }
  });
}

function reset(){
  usersStore = {};
  userIdList = [];
  publishedToken = [];
}

function sendReport(){
  try {
      app.client.chat.postMessage({
        token: process.env.SLACK_BOT_TOKEN,
        channel: 'C010LSWKG2W',
        text: ':+1:',
        as_user: true,
        blocks: reportPanel.getReportPanel(usersStore,userIdList)
      });
  } catch (error) {
    console.error(error);
  } 
}

function isReportTime(currentTime){
  console.log('currentTime :: ',currentTime)
  ampm = currentTime[2];
  hour  = currentTime[0]
  minute = currentTime[1];
  if(ampm == 'pm' && hour == 6 && minute >=30){
    return true;
  }
}

/* 
  Ignore the below logic..its hurry code
*/
function workingTime(currentTime){
  console.log('currentTime :: ',currentTime)
  ampm = currentTime[2];
  hour  = currentTime[0]
  minute = currentTime[1];
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

// Start your app
(async () => {
  console.log('process.env.SLACK_SIGNING_SECRET : ',process.env.SLACK_SIGNING_SECRET)
  console.log('process.env.SLACK_BOT_TOKEN : ',process.env.SLACK_BOT_TOKEN)
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ AVIS app is awake!');
  // After the app starts, fetch users and put them in a simple, in-memory cache
 // fetchUsers();
  scheduleTask();
})();

