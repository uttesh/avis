let json = require('../quotes/quotes.json');

class QuoteService {

  getQuote(){
    return json[this.randomNumber()];
  }

  randomNumber() {  
    return Math.floor(Math.random() * (5421 - 1) + 1); 
} 
}

module.exports = QuoteService