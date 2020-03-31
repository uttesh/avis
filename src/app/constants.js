module.exports = {
  APP_HOME_OPENED         : "app_home_opened",
  DELETED : 'deleted',
  IS_BOT : 'is_bot',
  ID: 'id'
}

module.exports.pages = {
}

module.exports.events = {
  MESSAGE : "message"
}


module.exports.config = {
  TOKEN_EXPIRE_TIME: 5,
  AVIS_STATUS_CHANNEL_ID: 'C010LSWKG2W',
  PROD_USERS: [
    'U1FAMB9QR', // Uttesh
    'U7LG4ADM5', // Raghavendra
    'U1H1V4CCD', // Sandya
    'U04H3AR26', // Sinivas kommareddi
    'U1F9R3XJ7', // Yallanki
    'U1FAPJPHA', // Suriya
    'U1FB3HX2B', // Narayan
    'U1FBBANSE', // Muni
    'U1FE6HWHE', // Ganeshan
    'U1JB29HEV', // Santhosh
    'U24C267K4', // Revathi
    'UUDFZGBTJ', // Sunel
    'UEV7A3MK6', // Sreedhar Nare
    'UGH3M0S5T', // Ravi Putta
    'UHB842U1Y', // Nagarjuna Chowkilla
    'UK9M16E64'  // Shobha Katagi
  ],
  DEV_TEST_USERS: [
    'U1FAMB9QR' // Uttesh
  ]
}



module.exports.Messages = {
  TOKEN_CHECK_MSG : 'Routine Check Please reply the below message :)',
  TOKEN_RECEIVED_MSG : ':+1: Received the Token, Continue your work.',
  TOKEN_LATE_REPLY : ':hourglass_flowing_sand: late reply. Token expired',
  TOKEN_RE_SUBMIT : ':interrobang: This token is invalid/already submitted. I am little smart :yum: !!!!'
}