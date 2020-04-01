const { App } = require('@slack/bolt');
const Constants = require('./src/app/constants')
const cron = require('node-cron');
const routineCheck = require('./src/app/pages/routine_check');
const BotService = require('./src/app/services/bot.service');
const UserStoreService = require('./src/app/services/userstore.service')
const TokenService = require('./src/app/services/token.service')
const TrendService = require('./src/app/services/trends.service')

const delay = require('delay');
const botService = new BotService();
const userStoreService = new UserStoreService();
const tokenService = new TokenService();
const trendService = new TrendService();
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
app.event('app_mentioned', ({ event, say,payload }) => {  
  console.log('\n\n app_mentioned *************** ')
});

app.event('message.app_home', ({ event, say,payload }) => {  
  console.log('\n\n message.app_home ************** ')
  console.log('message.app_home::: event',event)
  console.log('message.app_home::: ')
});

app.event('app_uninstalled', ({ event, say,payload }) => {  
  console.log('\n\n app_uninstalled :: **************** ')
  console.log('app_uninstalled event :: ',event)
  console.log('app_uninstalledp payload :: ',payload)
});

app.event('app_rate_limited', ({ event, say,payload }) => {  
  console.log('\n\n app_rate_limited **************** ')
  console.log('app_uninstalled event :: ',event)
  console.log('app_uninstalled payload :: ',payload)
});

app.event('message.im', ({ event, say,payload }) => {  
  console.log('\n\n message.im ********************')
 // avisEventsHandler.appOpened(event, say,payload);
});

app.event('message.channels', ({ event, say,payload }) => {  
  console.log('\n\n message.channels ********************')
 // avisEventsHandler.appOpened(event, say,payload);
});

app.event(Constants.APP_HOME_OPENED, ({ event, say,payload }) => {  
  console.log('app opend :::::::')
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
    await app.client.chat.postMessage({
      token: process.env.SLACK_BOT_TOKEN,
      channel: userId,
      text: Constants.Messages.TOKEN_CHECK_MSG,
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

app.message('avis:',async ({ message, context }) => {
 console.log('received message in channel:message',message.text);
 console.log('received message in channel:context ',context);
 processReply(message.text)
});

/**
 * Any app related error will be logged here
 */
app.error((error) => {
  console.error(message);
});

/**
 * Read all the incoming message and check for the token related message (This methis need to be changes, its looking in all messages which is not good of the performance)
 */
async function processReply(message) {
  if (message) {
    console.log('replied message :::', message);
    let token = message;
    let tokenObject = tokenService.getTokenDetails(token);
    console.log('tokenObject :::', tokenObject)
    let tknMsg = message.replace(/```/g, '');
    console.log('tknMsg :::', tknMsg);
    let userObject = usersStore[tokenObject.user];
    if (userObject && userObject.tokenMessages) {
      console.log('token replied by user :: ',userObject.user.real_name)
      if (tokenService.isValidPublishedToken(tokenObject.user, tknMsg) && userObject.tokenMessages.indexOf(tknMsg) == -1) {
        let flag = botService.repliedInTime(tokenObject.sentTime);
        userObject.tokenMessages.push(tknMsg);
        console.log(userObject.tokenMessages);
        try {
          if (flag) {
            userObject.checkedCount = usersStore[tokenObject.user].checkedCount + 1;
            botService.postMessage(app, Constants.Messages.TOKEN_RECEIVED_MSG, tokenObject.user)
          } else {
            botService.postMessage(app, Constants.Messages.TOKEN_LATE_REPLY, tokenObject.user)
          }
        } catch (error) {
          console.error(error);
        }
      } else {
        botService.postMessage(app, Constants.Messages.TOKEN_RE_SUBMIT, tokenObject.user)
      }
    }
  }
}

async function scheduleTask() {
  cron.schedule('*/30 * * * *', async() => {
     if(userIdList.length == 0){
        await fetchUsers();
      }
    let today = new Date();
    console.log('running a task every 30 minutes');
    console.log('current time: ',botService.formatAMPM(today))
    console.log('day of the week : ',today.getDay())
    let currentTime = botService.formatAMPM(today).split(':');
    let openingDays = [ 1, 2, 3, 4 , 5 ];
    console.log('userIdList :: ',userIdList.length)
    if(openingDays.includes( today.getDay() )){
    if (botService.workingTime(currentTime)) {
      for (userId of userIdList){
        if(Constants.config.PROD_USERS.includes(userId)){
          let user = usersStore[userId].user;
          console.log('user present in test list ',user.name)
          await sendCheck(user);
          console.log('before deplay :: ', new Date())
          await delay(30 * 1000);
          console.log('after deplay :: ', new Date())
        }
      }
    } else {
      console.log('its not working hours,check for report generation')
      if(botService.isReportTime(currentTime)){
        if(userIdList.length != 0){
          botService.sendReport(app);
          userStoreService.resetAll();
        }else{
          console.log('report laready generated')
        }
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
  console.log('⚡️ AVIS app is awake! Running in: '+Constants.config.MODE+" Mode");

  if(Constants.config.MODE === 'DEV'){
    development()
  }else{
    production()
  }
})();

async function development(){
  //After the app starts, fetch users and put them in a simple, in-memory cache
  if(userIdList.length == 0){
    await fetchUsers();
  }
  for (userId of userIdList){
    console.log('userId :: ',userId)
    let user = usersStore[userId].user;
    if(Constants.config.DEV_TEST_USERS.indexOf(userId)!=-1){
      let user = usersStore[userId].user;
      console.log('user present in test list ',user.name)
      await sendCheck(user);
      console.log('before deplay :: ', new Date())
      await delay(30 * 1000);
      console.log('after deplay :: ', new Date())
    }
  }
}

async function production(){
  scheduleTask();
    //  let trendYoutubeLink = await trendService.getYoutubeTrends();
  //  console.log('trendYoutubeLink :: ',trendYoutubeLink)
}

