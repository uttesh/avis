const { App } = require('@slack/bolt');
const Constants = require('./src/app/constants')
const cron = require('node-cron');
const routineCheck = require('./src/app/pages/routine_check');
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
    app.client.chat.postMessage({
      token: process.env.SLACK_BOT_TOKEN,
      channel: user['id'],
      text: 'Routine Check Please reply the below message :)',
      as_user: true,
      blocks: routineCheck.getCheckTaskRequestButton(user,getRandomText(user['id']))
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
    usersStore[user["id"]] = user
    }
  });
}

app.error((error) => {
  console.error(message);
});


app.event('message', (message, body) => {
  if (!message.subtype && message.payload.text.indexOf('avis:') >= 0) {
    console.log('replied message :::',message.payload.text)
    let data = message.payload.text.split(":");
    console.log('data :::',message.payload.text)
    let flag = repliedInTime(data[2]);
    try {
      if(flag){
        app.client.chat.postMessage({
          token: process.env.SLACK_BOT_TOKEN,
          channel: data[1],
          text: ':+1:',
          as_user: true
        });
      }else{
        app.client.chat.postMessage({
          token: process.env.SLACK_BOT_TOKEN,
          channel: data[1],
          text: ':hourglass_flowing_sand: late reply.',
          as_user: true
        });        
      }

    }
    catch (error) {
      console.error(error);
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

async function scheduleTask(){
  cron.schedule('*/2 * * * *', () => {
    console.log('running a task every two minutes');
    userIdList.forEach(userId =>{
      if(userId === 'U1FAMB9QR'){
        let user = usersStore[userId];
        sendCheck(user);
      }
     
    });
  });
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

