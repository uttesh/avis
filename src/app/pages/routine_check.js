const QuoteService = require('../services/quote.service')
const TrendService = require('../services/trends.service')

const quoteService = new QuoteService();
const trendService = new TrendService();

let topics = ['quote','programQuotes','quote']

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
    "type": "context",
    "elements": [
      {
        "type": "mrkdwn",
        "text": "Quote for the moment"
      }
    ]
  },
  {
    "type": "divider"
  },
  {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": ""
    }
  },
  {
    "type": "divider"
  },
  {
    "type": "section",
    "text": {
        "type": "mrkdwn",
        "text": ""
    }
  }
];

function getTrends(){
  let index  = Math.floor(Math.random() * (2 - 1) + 1);
  if(topics[index] === 'quote'){
    let quote = quoteService.getQuote();
    return quote;
  }else if(topics[index] === 'programQuotes'){
    let quote = quoteService.getProgramQuote();
    return {'quoteText':quote.en, 'quoteAuthor': quote.author};
  }
  // else {
  //   return {'quoteText':trendService.getYoutubeTrends(), 'quoteAuthor': 'You'};
  // }
}

exports.getCheckTaskRequestButton = (totalCount,user,msg) => {
  CheckListButton[0].text.text = 'Hello! '+ user['real_name'] +',';
  let quote = getTrends();
  CheckListButton[3].text.text = "_"+quote.quoteText+"_\n"+"*_"+quote.quoteAuthor+"_*";
  CheckListButton[5].text.text = '\nPlease reply the below token message to AVIS within 5 minutes, In this window only.\n*Token Message #'+totalCount+'*\n *```'+msg+'```*';
  return CheckListButton;
}