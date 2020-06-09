const {
  PUTSyntaxError,
  ErrorAddingToIndex
} = require('../errors');

const {
  sqs,
  getQueueName
} = require('../util');


async function addDocToIndexHandler(event, indexName) {
  if (!event.body) {
    return PUTSyntaxError
  }

  const body = JSON.parse(event.body);
  if (!body.hasOwnProperty('id')) {
    return PUTSyntaxError
  }

  const { accountId } = event.requestContext;
  try {
    const { QueueUrl } = await sqs.getQueueUrl({
      QueueName: getQueueName(indexName),
      QueueOwnerAWSAccountId: accountId
    });

    await sqs.sendMessage({
      MessageBody: JSON.stringify(body),
      QueueUrl
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