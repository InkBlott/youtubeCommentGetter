require('dotenv').config();
const { google } = require('googleapis');
const fetch = require("node-fetch");
const slackWebhookUrl = 'https://hooks.slack.com/services/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';
const videoId = process.argv[2];
const keyword = process.argv[3];
let comments = [];
let replies = [];
let firstGo = true;

getComments()
setInterval(() => getComments(), 10000)

function getComments() {
    google.youtube('v3').commentThreads.list({
        key: process.env.YT_TOKEN,
        part: ['snippet, id, replies'],
        searchTerms: keyword,
        videoId: videoId,   
        maxResults: getResultNumber(), 
    })
    .then(function (response) {
        const { data } = response;
        data.items.forEach(dataItem => {
            let messageText = dataItem.snippet.topLevelComment.snippet.textOriginal;
            checkAndPost(comments, replies, messageText, dataItem)
        })
    })
}

function checkAndPost(comments, replies, stringToCheck, apiItem){
    if ((comments.some(comment => comment.id.includes(apiItem.id)) === false) && stringToCheck.includes(keyword)) {
        comments.push({id: apiItem.id, message: stringToCheck});
        console.log('message: ' + stringToCheck);
        postToSlack(slackWebhookUrl, 'message: ' + stringToCheck)
    } 
    if (apiItem.replies !== undefined){
        apiItem.replies.comments.forEach(reply => {
            if ((replies.some(item=> item.id.includes(reply.id)) === false) && reply.snippet.textOriginal.includes(keyword)){
                replies.push({ message: reply.snippet.textOriginal, id: reply.id});
                console.log('reply: ' + reply.snippet.textOriginal);
                postToSlack(slackWebhookUrl, 'reply: ' + reply.snippet.textOriginal)
            }
        })
    }
}

function getResultNumber() {
    if(firstGo){
        firstGo = false;
        return 100
    } else return 10
}

async function postToSlack(url, data) {
    await fetch(url, {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json'
      },
      referrerPolicy: 'no-referrer',
      body: JSON.stringify({'text' : data})
    });
  }
