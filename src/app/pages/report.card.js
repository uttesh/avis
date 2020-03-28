var table = require('markdown-table')

let reportMsg = 
[
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": ""
    }
  }
];


exports.getReportPanel = (userData) => {
  userDataList = [];
  userDataList.push(['User','Total tokens','Submitted','Missed'])
  userData.forEach(element => {
    userDataList.push([element.user.name,element.totalCheck,element.checkedCount,element.missedCount])
  });
  let reportTable = table(userDataList);
  console.log(reportTable);
  reportMsg[0].text.text = reportTable;
  return reportMsg;
}