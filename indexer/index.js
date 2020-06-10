const elasticlunr = require('elasticlunr');
const S3 = require('aws-sdk/clients/s3');

let {
  INDEX_S3_BUCKET,
  INDEX_S3_PREFIX,
} = process.env;

INDEX_S3_PREFIX = INDEX_S3_PREFIX || '';

const s3 = new S3({
  apiVersion: '2006-03-01'
})

function getKeyName(indexName){
  return `${INDEX_S3_PREFIX}${INDEX_S3_PREFIX ? '/' : ''}${indexName}-index.json`
}

async function loadIndex(indexName) {
  const { Body } = await s3.getObject({
    Bucket: INDEX_S3_BUCKET,
    Key: getKeyName(indexName)
  }).promise();

  return elasticlunr.Index.load(JSON.parse(Body.toString()));
}

async function saveIndex(indexName, index) {
  const params = {
    Bucket: INDEX_S3_BUCKET,
    Key: getKeyName(indexName),
    Body: JSON.stringify(index)
  }
  await s3.putObject(params).promise()
}

exports.handler = async (event) => {
  console.log(JSON.stringify(event));
  const messages = {};

  for (let record of event.Records) {
    const indexName = record.attributes.MessageGroupId;
    if (!messages.hasOwnProperty(indexName)) {
      messages[indexName] = [];
    }

    messages[indexName].push(JSON.parse(record.body));
  }

  console.log(messages);

  for (let indexName in messages) {
    const index = await loadIndex(indexName);

    for (let record of messages[indexName]) {
      index.addDoc(record);
    }

    await saveIndex(indexName);
  }

  return {}
}