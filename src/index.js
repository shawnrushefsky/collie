const elasticlunr = require('elasticlunr');
const DynamoDB = require('aws-sdk/clients/dynamodb');

const {
  INDEX_DYNAMO_TABLE
} = process.env;

const dynamo = new DynamoDB({
  apiVersion: '2012-08-10'
});

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

async function loadIndex(indexName) {
  const rootParams = {
    Key: {
      id: {
        S: `${indexName}-root`
      }
    },
    TableName: INDEX_DYNAMO_TABLE
  }
  const { Item: { content: {S: rootDocRaw }}} = await dynamo.getItem(rootParams).promise();
  const rootDoc = JSON.parse(rootDocRaw);

  console.log(rootDoc);

  const allPromises = [];
  const keys = [];

  const docStoreParams = {
    Key: {
      id: {
        S: rootDoc.documentStore
      }
    },
    TableName: INDEX_DYNAMO_TABLE
  }
  allPromises.push(dynamo.getItem(docStoreParams).promise());
  keys.push('documentStore');

  for (let key in rootDoc.index) {
    const indexParams = {
      Key: {
        id: {
          S: rootDoc.index[key]
        }
      },
      TableName: INDEX_DYNAMO_TABLE
    }
    allPromises.push(dynamo.getItem(indexParams).promise());
    keys.push(key);
  }

  const resolved = await Promise.all(allPromises);
  rootDoc.documentStore = JSON.parse(resolved[0].Item.content.S);
  for (let i = 1; i < resolved.length; i++) {
    rootDoc.index[keys[i]] = JSON.parse(resolved[i].Item.content.S);
  }

  console.log(rootDoc);

  return elasticlunr.Index.load(rootDoc);
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

async function saveIndex(indexName, index) {
  const allPromises = [];
  const rootDoc = {
    version: elasticlunr.version,
    fields: index._fields,
    ref: index._ref,
    documentStore: `${indexName}-documentStore`,
    pipeline: index.pipeline.toJSON(),
    index: {}
  }

  for (let field of rootDoc.fields) {
    rootDoc.index[field] = `${indexName}-index-${field}`

    const indexParams = {
      Item: { 
        content: { 
          S: JSON.stringify(index.index[field]) 
        },
        id: {
          S: `${indexName}-index-${field}`
        }
      },
      TableName: INDEX_DYNAMO_TABLE
    };
    allPromises.push(dynamo.putItem(indexParams).promise());
  }

  const docStoreParams = {
    Item: {
      content: {
        S: JSON.stringify(index.documentStore)
      },
      id: {
        S: `${indexName}-documentStore`
      }
    },
    TableName: INDEX_DYNAMO_TABLE
  }
  allPromises.push(dynamo.putItem(docStoreParams).promise());

  const rootParams = {
    Item: {
      content: {
        S: JSON.stringify(rootDoc)
      },
      id: {
        S: `${indexName}-root`
      }
    },
    TableName: INDEX_DYNAMO_TABLE
  }
  allPromises.push(dynamo.putItem(rootParams).promise());

  await Promise.all(allPromises);
}

async function updateIndex(indexName, oldIndex, newIndex) {
  
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