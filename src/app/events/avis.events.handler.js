const pages = require('../pages/task.request');

class AvisEventsHandler {

 appOpened(event, say,payload){
    var hour = new Date().getHours();
    let greet = " Good " + (hour<12 && "Morning" || hour<18 && "Afternoon" || "Evening ");
    say('Hi'+ greet + ` <@${event.user}> !`);
    say(pages.getTaskRequestButton());
  }

}

module.exports = AvisEventsHandler;