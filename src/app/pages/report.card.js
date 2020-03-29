var table = require('markdown-table')

let reportMsg = 
[
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "*date here, total report data*"
    }
  }
];


exports.getReportPanel = (userData,userIdList) => {
  userDataList = [];
  userDataList.push(['User','Total tokens','Submitted','Missed'])
  userIdList.forEach(item => {
    console.log('item')
    let element = userData[item];
    if(element){
     let section = {
      type: "section",
      text: {
				type: "mrkdwn",
				text: "*"+element.user.name+"*\nTotal Token: "+element.totalCheck+"\nReplied Token: "+element.checkedCount+"\nMissed Token: "+(element.totalCheck - element.checkedCount)
			}
     }
     reportMsg.push(section);
     reportMsg.push({
      type: "divider"
     });
    }
  });
  return reportMsg;
}