const {
  POSTSyntaxError,
  ErrorSavingIndex
} = require('../errors');

const {
  indexExists,
  createIndex,
  lock
} = require('../util');

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
      await lock.acquireLock(indexName);
      await createIndex(indexName, body);
      await lock.release(indexName);
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