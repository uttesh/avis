const https = require('https');
const Constants = require('../constants')
const axios = require('axios');

class TrendService {

  async getNasaTrends() {
    await https.get('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY', (resp) => {
      let data = '';
      resp.on('data', (chunk) => {
        data += chunk;
      });
      resp.on('end', () => {
        console.log(JSON.parse(data).explanation);
      });
    }).on("error", (err) => {
      console.log("Error: " + err.message);
    });
  }

  async getYoutubeTrends() {
    return await axios.get('https://www.googleapis.com/youtube/v3/videos?part=contentDetails&chart=mostPopular&regionCode=IN&maxResults=25&key=' + process.env.YOUTUBE_API_KEY)
      .then(response => {
        let items = response.data.items;
        let randomId = items[this.randomNumber(items.length)].id;
        const link =  'https://www.youtube.com/watch?v='+randomId;
        return link;
      })
      .catch(error => {
        console.log(error);
      });
  }

  randomNumber(size) {
    return Math.floor(Math.random() * (size - 1) + 1);
  }
}

module.exports = TrendService;