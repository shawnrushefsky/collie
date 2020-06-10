const {
  PUTSyntaxError,
  ErrorAddingToIndex
} = require('../errors');

const SQS = require('aws-sdk/clients/sqs');
const sqs = new SQS({
  apiVersion: '2012-11-5'
});

const { QUEUE_URL } = process.env;


async function addDocToIndexHandler(event, indexName) {
  if (!event.body) {
    return PUTSyntaxError
  }

  const body = JSON.parse(event.body);
  if (!body.hasOwnProperty('id')) {
    return PUTSyntaxError
  }

  try {
    await sqs.sendMessage({
      MessageGroupId: indexName,
      MessageBody: JSON.stringify(body),
      QueueUrl: QUEUE_URL
    });
    
    return {
      statusCode: 202,
      body: `${indexName}: Document Queued For Indexing`
    }
  } catch (e) {
    console.log(e);
    return ErrorAddingToIndex
  }
}

module.exports = {
  addDocToIndexHandler
}