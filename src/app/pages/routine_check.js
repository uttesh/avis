let CheckListButton = 
[
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": "Hello! Please copy paste or drag&drop the message and reply to AVIS"
    }
  },
  {
    "type": "section",
    "block_id": "section1234",
    "fields": [
      {
        "type": "mrkdwn",
        "text": ""
      }
    ]
  }
];


exports.getCheckTaskRequestButton = (user,msg) => {
  CheckListButton[0].text.text = 'Hello! '+ user['real_name'] +', Please reply the below token message to AVIS in 5 minutes';
  CheckListButton[1].fields[0].text = '*Token Messge*\n *```'+msg+'```*';
  return CheckListButton;
}