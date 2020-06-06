const elasticlunr = require('elasticlunr');
const S3 = require('aws-sdk/clients/s3');

const {
  INDEX_S3_BUCKET,
  INDEX_S3_PREFIX
} = process.env;

const s3 = new S3({
  apiVersion: '2006-03-01'
})

const GETSyntaxError = {
  statusCode: 400,
  body: 'Path should be /search/:index?query=<search-query>'
}

const PUTSyntaxError = {
  statusCode: 400,
  body: 'You must include a JSON body that includes .id'
}

const POSTSyntaxError = {
  statusCode: 400,
  body: 'You must include a JSON body like {primary_key, fields: []}'
}

const ErrorSavingIndex = {
  statusCode: 500,
  body: 'An error was encountered while trying to save the index.'
}

const ErrorLoadingIndex = {
  statusCode: 500,
  body: 'An error was encountered while trying to load the index.'
}

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

    for (let field of body.fields) {
      this.addField(field);
    }
  });

  await saveIndex(indexName, index);
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

  // This endpoint updates an index
  else if (method === 'PUT') {
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

  // This endpoint creates an index. No-op if index already exists.
  else if (method === 'POST') {
    try {
      const index = await loadIndex(indexName);

      return {
        statusCode: 200,
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
        await createIndex(indexName, body);

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

  else {
    return {
      statusCode: 405
    }
  }
}