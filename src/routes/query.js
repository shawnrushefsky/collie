const { ErrorLoadingIndex } = require('../errors');
const { loadIndex } = require('../util');

async function queryHandler(event, indexName) {
  if (!event.queryStringParameters) {
    return GETSyntaxError
  }

  const { query } = event.queryStringParameters;
  if (!query) {
    return GETSyntaxError
  }

  try {
    const index = await loadIndex(indexName);

    return {
      statusCode: 200,
      body: JSON.stringify(index.search(query))
    }
  } catch (e) {
    console.log(e);
    return ErrorLoadingIndex
  }
}


module.exports = {
  queryHandler
}