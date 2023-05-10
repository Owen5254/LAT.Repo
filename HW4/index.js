'use strict';
const line = require('@line/bot-sdk');
const express = require('express');
const config = require('config');
const {TextAnalyticsClient, AzureKeyCredential} = require("@azure/ai-text-analytics");

//Line config
const configLine = {
  channelAccessToken: config.get('CHANNEL_ACCESS_TOKEN'),
  channelSecret: config.get('CHANNEL_SECRET')
};

//Azure Text Sentiment
const endpoint = config.get("ENDPOINT");
const apiKey = config.get("TEXT_ANALYTICS_API_KEY");
const client = new line.Client(configLine);
const app = express();
const port = process.env.PORT || process.env.port || 3001;

app.listen(port, () => {
  console.log(`listening on ${port}`);
});

app.post('/callback', line.middleware(configLine), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
  });

// Azure Text Sentiment Analysis
async function MS_TextSentimentAnalysis(thisEvent){
  console.log("[MS_TextSentimentAnalysis] in");
  const analyticsClient = new TextAnalyticsClient(endpoint, new AzureKeyCredential(apiKey));
  let documents = [];
  documents.push(thisEvent.message.text);
  const results = await analyticsClient.analyzeSentiment(documents, "zh-hant");
  console.log("[results] ", JSON.stringify(results));

  const resultMessage = {
    type: 'text',
    text: results[0].sentiment
  };
  client.replyMessage(thisEvent.replyToken, resultMessage);
}

function handleEvent(event){
  if(event.type !== 'message' || event.message.type !== 'text'){
    return Promise.resolve(null);
  }
  MS_TextSentimentAnalysis(event).catch((err) => {
    console.error("Error:", err);
  });
}


