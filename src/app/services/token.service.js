

let publishedToken = [];

class TokenService{

  addToken(token){
    publishedToken.push(token);
  }

  getPublishedTokens(){
    return publishedToken;
  }

  isValidPublishedToken(user, token) {
    console.log('isValidPublishedToken :: token :'+token)
    if (token) {
      let data = this.getTokenDetails(token);
      if (publishedToken.indexOf(token.toString().trim()) >=0 && data.user === user) {
        console.log('its valid token !!!')
        return true;
      }
    }
    return false;
  }

  getTokenDetails(token){
    let data = token.split(":");
    return {
      user:data[1],
      sentTime: data[2],
      id:data[3]
    }
  }

}

module.exports = TokenService