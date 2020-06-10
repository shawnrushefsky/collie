const { queryHandler } = require('./routes/query');
const { addDocToIndexHandler } = require('./routes/add-doc');
const { createIndexHandler } = require('./routes/create-index');
const { deleteIndexHandler } = require('./routes/delete-index');

exports.handler = async (event) => {
  const { method, path } = event.requestContext.http;
  const [ _, route, indexName ] = path.split('/');

  if (route === 'favicon.ico') {
    return {
      statusCode: 404
    }
  }
  
  if (!route || route.toLowerCase() !== 'search' || !indexName) {
    return {
      statusCode: 400,
      body: 'Path should be /search/:index'
    }
  }

  // This endpoint searches an index
  if (method === 'GET') {
    return await queryHandler(event, indexName);
  }

  // This endpoint updates an index
  else if (method === 'PUT') {
    return await addDocToIndexHandler(event, indexName);
  }

  // This endpoint creates an index. No-op if index already exists.
  else if (method === 'POST') {
    return await createIndexHandler(event, indexName);
  }

  else if (method === "DELETE") {
    return await deleteIndexHandler(event, indexName);
  }

  else {
    return {
      statusCode: 405
    }
  }
}