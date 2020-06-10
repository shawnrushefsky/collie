const NodeCache = require( "node-cache" );

const { ErrorLoadingIndex, NonexistantIndexError } = require('../errors');
const { loadIndex } = require('../util');

const {
  INDEX_CACHE_TTL_SECONDS
} = process.env;

const indexCache = new NodeCache({
  stdTTL: Number(INDEX_CACHE_TTL_SECONDS),
  useClones: false,
  deleteOnExpire: true,
  checkperiod: 0
});

async function loadIndexFromCache(indexName) {
  let index = indexCache.get(indexName);
  if (!index) {
    index = await loadIndex(indexName);
    indexCache.set(indexName, index);
  }
  return index;
}

async function queryHandler(event, indexName) {
  if (!event.queryStringParameters) {
    return GETSyntaxError
  }

  const { query } = event.queryStringParameters;
  if (!query) {
    return GETSyntaxError
  }

  try {
    const index = await loadIndexFromCache(indexName);

    return {
      statusCode: 200,
      body: JSON.stringify(index.search(query))
    }
  } catch (e) {
    if (e.code === "AccessDenied") {
      return NonexistantIndexError
    }
    console.log(e);
    return ErrorLoadingIndex
  }
}


module.exports = {
  queryHandler
}