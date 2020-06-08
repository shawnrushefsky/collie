const {
  PUTSyntaxError,
  ErrorLoadingIndex,
  ErrorSavingIndex
} = require('../errors');

const {
  loadIndex,
  saveIndex
} = require('../util');

async function addDocToIndexHandler(event, indexName) {
  if (!event.body) {
    return PUTSyntaxError
  }

  const body = JSON.parse(event.body);
  if (!body.hasOwnProperty('id')) {
    return PUTSyntaxError
  }

  try {
    const index = await loadIndex(indexName)
    index.addDoc(body);
    try {
      await saveIndex(indexName, index);
    } catch (e) {
      return ErrorSavingIndex
    }

    return {
      statusCode: 200,
      body: `Document added to index '${indexName}'`
    }
  } catch (e) {
    console.log(e);
    return ErrorLoadingIndex
  }
}

module.exports = {
  addDocToIndexHandler
}