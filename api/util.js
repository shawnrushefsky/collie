const elasticlunr = require('elasticlunr');
const S3 = require('aws-sdk/clients/s3');
const SQS = require('aws-sdk/clients/sqs');

const {
  INDEX_S3_BUCKET,
  INDEX_S3_PREFIX,
  STACK_NAME
} = process.env;

const s3 = new S3({
  apiVersion: '2006-03-01'
})
const sqs = new SQS({
  apiVersion: '2012-11-5'
});

function getKeyName(indexName){
  return `${INDEX_S3_PREFIX}${INDEX_S3_PREFIX ? '/' : ''}${indexName}-index.json`
}

function getQueueName(indexName) {
  return `${STACK_NAME}${STACK_NAME ? '-' : ''}${INDEX_S3_PREFIX}${INDEX_S3_PREFIX ? '-' : ''}${indexName}-ingest`
}

async function loadIndex(indexName) {
  const { Body } = await s3.getObject({
    Bucket: INDEX_S3_BUCKET,
    Key: getKeyName(indexName)
  }).promise();

  return elasticlunr.Index.load(JSON.parse(Body.toString()));
}

async function createIndex(indexName, body) {
  const index = elasticlunr(function(){
    this.setRef(body.primary_key);
    this.saveDocument(false);

    for (let field of body.fields) {
      this.addField(field);
    }
  });
  console.log(getQueueName(indexName))
  const { QueueUrl } = await sqs.createQueue({
    QueueName: getQueueName(indexName),
    Attributes: {
      FifoQueue: String(true),
      VisabilityTimeout: String(60 * 5) // 5 minutes
    }
  }).promise();
  console.log(QueueUrl);

  await saveIndex(indexName, index);
}

async function indexExists(indexName) {
  await s3.headObject({
    Bucket: INDEX_S3_BUCKET,
    Key: getKeyName(indexName)
  }).promise();
}

async function saveIndex(indexName, index) {
  const params = {
    Bucket: INDEX_S3_BUCKET,
    Key: getKeyName(indexName),
    Body: JSON.stringify(index)
  }
  await s3.putObject(params).promise()
}


module.exports = {
  getKeyName,
  getQueueName,
  loadIndex,
  createIndex,
  saveIndex,
  indexExists,
  s3,
  sqs
}