const {
  deleteIndex,
  acquireLock,
} = require('../util');

const {
  ErrorDeletingIndex,
  NonexistantIndexError
} = require('../errors');

async function deleteIndexHandler (event, indexName) {
  try {
    const release = await acquireLock(indexName);
    await deleteIndex(indexName);
    await release();
    return {
      statusCode: 200,
      body: `Index ${indexName} successfully deleted.`
    }
  } catch (e) {
    if (e.code === "AccessDenied") {
      return NonexistantIndexError
    }
    console.log(e);
    return ErrorDeletingIndex
  }
}

module.exports = {
  deleteIndexHandler
}