const { App } = require('@slack/bolt');
const Constants = require('./src/app/constants')
const cron = require('node-cron');
const routineCheck = require('./src/app/pages/routine_check');
const reportPanel = require('./src/app/pages/report.card');
const crypto = require("crypto");

const app = new App({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  token: process.env.SLACK_BOT_TOKEN
});


app.event('app_mention',({ event, say,payload }) => {  
  console.log('app mentioned')
 });

app.event(Constants.APP_HOME_OPENED, ({ event, say,payload }) => {  
 // avisEventsHandler.appOpened(event, say,payload);
});


function getRandomText(user){
  const id = crypto.randomBytes(16).toString("hex");
  const time = Date.now();
  let msg = "avis:"+user+":"+time+":"+id;
  console.log('msg :: ',msg)
  return msg
}

async function sendCheck(user){
  try {
    usersStore[user['id']].totalCheck = usersStore[user['id']].totalCheck + 1;
    console.log('user check total count :::',usersStore[user['id']].totalCheck)
    console.log('user checked count :::',usersStore[user['id']].checkedCount)
    console.log('user missed count :::',usersStore[user['id']].missedCount)
    let tknMeesage = getRandomText(user['id']);
    app.client.chat.postMessage({
      token: process.env.SLACK_BOT_TOKEN,
      channel: user['id'],
      text: 'Routine Check Please reply the below message :)',
      as_user: true,
      blocks: routineCheck.getCheckTaskRequestButton(user,tknMeesage)
    });
  }
  catch (error) {
    console.error(error);
  } 
}


// You probably want to use a database to store any user information ;)
let usersStore = {};
let userIdList = [];

// Fetch users using the users.list method
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

function saveUsers(usersArray) {
  usersArray.forEach(function(user){
    if(!user["deleted"] && !user["is_bot"]){
    userIdList.push(user["id"]);
    usersStore[user["id"]] = {user:user,totalCheck:0,checkedCount:0,missedCount:0,tokenMessages:[]}
    }
  });
}

app.error((error) => {
  console.error(message);
});


app.event('message', (message, body) => {
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
          usersStore[data[1]].missedCount = usersStore[data[1]].totalCheck - usersStore[data[1]].checkedCount;
          app.client.chat.postMessage({
            token: process.env.SLACK_BOT_TOKEN,
            channel: data[1],
            text: ':+1:',
            as_user: true,
            blocks: reportPanel.getReportPanel(usersStore,userIdList)
          });
        } else {
          usersStore[data[1]].missedCount = usersStore[data[1]].totalCheck - usersStore[data[1]].checkedCount;
          app.client.chat.postMessage({
            token: process.env.SLACK_BOT_TOKEN,
            channel: data[1],
            text: ':hourglass_flowing_sand: late reply. Token expired',
            as_user: true
          });
        }

      } catch (error) {
        console.error(error);
      }
    }else{
      app.client.chat.postMessage({
        token: process.env.SLACK_BOT_TOKEN,
        channel: data[1],
        text: ':interrobang: This token already submitted. I am little smart :yum: !!!!',
        as_user: true
      });
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
  cron.schedule('*/2 * * * *', () => {
    let today = new Date();
    console.log('running a task every two minutes');
    console.log('current time: ',formatAMPM(today))
    console.log('day of the week : ',today.getDay())
    let currentTime = formatAMPM(today).split(':');
    let openingDays = [ 1, 2, 3, 4 , 5 ];
    // userIdList.forEach(userId => {
    //   if (userId === 'U1FAMB9QR') {
    //     let user = usersStore[userId].user;
    //     sendCheck(user);
    //   }
    // });
    if(openingDays.includes( today.getDay() )){
    if (workingTime(currentTime)) {
      userIdList.forEach(userId => {
        if (userId === 'U1FAMB9QR') {
          let user = usersStore[userId].user;
          sendCheck(user);
        }
      });
    } else {
      console.log('its not working hour !!!!');
    }
  }else {
    console.log('its Weekend !!!!');
  }
  });
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
  fetchUsers();
  scheduleTask();
})();

