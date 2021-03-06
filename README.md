# collie
A serverless, pay-on-demand search engine for small applications, built on elasticlunr.

## Why "collie"?

Like the Border Collie for which it is named, collie is pretty good at small search jobs, but still a little derpy.

### Benefits

- Collie is very small. In fact, the zipped lambda code is less than 300KB, and it uses less than 128MB of memory when in use. No index ever exceeds 25MB.
- Collie is very cheap. It uses [Amazon S3](https://aws.amazon.com/s3/) to store its index and [AWS Lambda](https://aws.amazon.com/lambda/) to execute search queries.  With an average response time of less than 400ms, Collie costs around $0.0000010332/request, or 967,866 requests per dollar. The small index size means storage costs will never exceed $0.026/mo.

These factors combined mean Collie is the absolute cheapest, smallest hosted search engine in the world, with performance that is still technically usable.

### Considerations

You should probably not use Collie for a business. Its performance is very slow per request (400ms response times) compared to something like elasticsearch.

However, Collie is perfect for hobbie projects where you expect relatively low use, or extreme performance is not important.

## Deploying

Collie must be run as a Lambda behind an API Gateway. You should grab `collie-api.zip` and `collie-indexer.zip` from the [lastest release](https://github.com/shawnrushefsky/collie/releases/latest), and deploy that as your lambda code. Do not attempt to deploy the raw source code from this repo, as it is ~60MB instead of the <300KB of the compressed and minified artifact.

You can easily deploy the entire stack with [terraform.](https://github.com/shawnrushefsky/collie-stack)

## API

### GET /search/:index?query=<search>

This will search the index and return a JSON Array of results:

```json
[{"ref":"1","score":0.7071067811865475}]
```

The `ref` field is the primary key value of the document that matched.

### PUT /search/:index

```json
{
  "id": 0,
  "title": "Scooby Doo",
  "year": 1974,
  "description": "scooby dooby doo, where are you?"
}
```

### POST /search/:index

```json
{
  "primary_key": "id",
  "fields": [
    "title",
    "year",
    "description"
  ]
}
```

### DELETE /search/:index

deletes an index