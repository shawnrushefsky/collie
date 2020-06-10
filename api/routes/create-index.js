const {
  POSTSyntaxError,
  ErrorSavingIndex
} = require('../errors');

const {
  indexExists,
  createIndex,
  acquireLock
} = require('../util');

const util = require('util');

async function createIndexHandler(event, indexName) {
  try {
    await indexExists(indexName);

    return {
      statusCode: 403,
      body: `Index ${indexName} already existed.`
    }
  } catch (e) {
    if (!event.body) {
      return POSTSyntaxError
    }

    const body = JSON.parse(event.body);

    if (!body.hasOwnProperty('primary_key')) {
      return POSTSyntaxError
    }
    if (!body.hasOwnProperty('fields') || !Array.isArray(body.fields)) {
      return POSTSyntaxError
    }

    try {
      const lock = await acquireLock(indexName);
      await createIndex(indexName, body);
      await util.promisify(lock.release)();
      return {
        statusCode: 200,
        body: `Index ${indexName} successfully created.`
      }
    } catch (e) {
      console.log(e);
      return ErrorSavingIndex
    }
  }
}

module.exports = {
  createIndexHandler
}