const { App } = require('@slack/bolt');
const Constants = require('./src/app/constants')
const cron = require('node-cron');
const routineCheck = require('./src/app/pages/routine_check');
const BotService = require('./src/app/services/bot.service');
const UserStoreService = require('./src/app/services/userstore.service')
const TokenService = require('./src/app/services/token.service')

const botService = new BotService();
const userStoreService = new UserStoreService();
const tokenService = new TokenService();

// You probably want to use a database to store any user information ;)
let usersStore = userStoreService.getStore();
let userIdList = userStoreService.getUserIDsList();


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
    let tknMeesage = botService.generateToken(userId);
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
    let token = message.payload.text;
    let tokenObject = tokenService.getTokenDetails(token);
    console.log('tokenObject :::',tokenObject)
    let tknMsg =  message.payload.text.replace(/```/g,'');
    console.log('tknMsg :::', tknMsg)
    console.log('tknMsg msg exists in the list :::', usersStore[tokenObject.user].tokenMessages.indexOf(tknMsg))
    if (tokenService.isValidPublishedToken(tokenObject.user,tknMsg) && usersStore[tokenObject.user].tokenMessages.indexOf(tknMsg) == -1) {
      let flag = botService.repliedInTime(tokenObject.sentTime);
      usersStore[tokenObject.user].tokenMessages.push(tknMsg);
      console.log(usersStore[tokenObject.user].tokenMessages);
      try {
        if (flag) {
          usersStore[tokenObject.user].checkedCount = usersStore[tokenObject.user].checkedCount + 1;
          botService.postMessage(app,Constants.Messages.TOKEN_RECEIVED_MSG,tokenObject.user)
          //botService.sendReport(app);
        } else {
          botService.postMessage(app,Constants.Messages.TOKEN_LATE_REPLY,tokenObject.user)
        }
      } catch (error) {
        console.error(error);
      }
    }else{
      botService.postMessage(app,Constants.Messages.TOKEN_RE_SUBMIT,tokenObject.user)
    }
  }
});

async function scheduleTask() {
  cron.schedule('*/30 * * * *', async() => {
     if(userIdList.length == 0){
        await fetchUsers();
      }
    let today = new Date();
    console.log('running a task every two minutes');
    console.log('current time: ',botService.formatAMPM(today))
    console.log('day of the week : ',today.getDay())
    let currentTime = botService.formatAMPM(today).split(':');
    let openingDays = [ 1, 2, 3, 4 , 5 ];
    console.log('userIdList :: ',userIdList.length)
    // userIdList.forEach(userId => {
    //   if (userId === 'U1FAMB9QR') {
    //     let user = usersStore[userId].user;
    //     sendCheck(user);
    //   }
    // });
    if(openingDays.includes( today.getDay() )){
    if (botService.workingTime(currentTime)) {
      if(userIdList.length == 0){
        await fetchUsers();
      }
      userIdList.forEach(userId => {
        //if (userId === 'U1FAMB9QR') {
          let user = usersStore[userId].user;
          sendCheck(user);
        //}
      });
    } else {
      if(botService.isReportTime(currentTime)){
        botService.sendReport(app);
        userStoreService.resetAll();
      }
      console.log('its not working hour !!!!');
    }
  }else {
    console.log('its Weekend !!!!');
  }
  });
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

