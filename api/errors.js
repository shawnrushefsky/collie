module.exports = {
  ErrorLoadingIndex: {
    statusCode: 500,
    body: 'An error was encountered while trying to load the index.'
  },
  ErrorSavingIndex: {
    statusCode: 500,
    body: 'An error was encountered while trying to save the index.'
  },
  ErrorAddingToIndex: {
    statusCode: 500,
    body: 'An error was encountered while trying to enqueue your document for indexing.'
  },
  POSTSyntaxError: {
    statusCode: 400,
    body: 'You must include a JSON body like {primary_key, fields: []}'
  },
  PUTSyntaxError: {
    statusCode: 400,
    body: 'You must include a JSON body that includes .id'
  },
  GETSyntaxError: {
    statusCode: 400,
    body: 'Path should be /search/:index?query=<search-query>'
  },
  NonexistantIndexError: {
    statusCode: 404,
    body: 'Index does not exist'
  }
}