let json = require('../quotes/quotes.json');
let programJson = require('../quotes/programming_quotes.json')

class QuoteService {

  getQuote() {
    return json[this.randomNumber(5421)];
  }

  getProgramQuote(){
     return programJson[this.randomNumber(501)];
  }

  randomNumber(limit) {
    return Math.floor(Math.random() * (limit - 1) + 1);
  }
}

module.exports = QuoteService