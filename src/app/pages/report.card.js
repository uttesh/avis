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
    let element = userData[item];
    if(element){
     let section = {
      type: "section",
      text: {
				type: "mrkdwn",
				text: "*"+element.user.name+"*\n Total Token: "+element.totalCheck+" | Replied Token: "+element.checkedCount+" | Missed Token: "+(element.totalCheck - element.checkedCount)
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