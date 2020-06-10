const elasticlunr = require('elasticlunr');
const S3 = require('aws-sdk/clients/s3');
const DynamoDBLockClient = require('dynamodb-lock-client');
const DynamoDB = require('aws-sdk/clients/dynamodb');

let {
  INDEX_S3_BUCKET,
  INDEX_S3_PREFIX,
  LOCK_TABLE,
  LOCK_TABLE_PARTITION_KEY
} = process.env;

INDEX_S3_PREFIX = INDEX_S3_PREFIX || '';

const s3 = new S3({
  apiVersion: '2006-03-01'
});

const dynamodb = new DynamoDB.DocumentClient({
  apiVersion: "2012-08-10"
});

const lock = new DynamoDBLockClient.FailOpen({
  dynamodb,
  lockTable: LOCK_TABLE,
  partitionKey: LOCK_TABLE_PARTITION_KEY,
  heartbeatPeriodMs: 300,
  leaseDurationMs: 5000,
  trustLocalTime: true
});

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

async function createIndex(indexName, body) {
  const index = elasticlunr(function(){
    this.setRef(body.primary_key);
    this.saveDocument(false);

    for (let field of body.fields) {
      this.addField(field);
    }
  });
  
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
  loadIndex,
  createIndex,
  indexExists,
  s3,
  lock
}