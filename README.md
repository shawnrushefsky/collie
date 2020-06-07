# collie
A serverless, pay-on-demand search engine for small applications, built on elasticlunr.

## Why "collie"?

Like the Border Collie for which it is named, collie is pretty good at small search jobs, but still a little derpy.

### Benefits

- Collie is very small. In fact, the zipped lambda code is less than 200KB, and it uses less than 128MB of memory when in use. With an average response time of less than 400ms, collie costs around $0.0000010332/request, or 967,866 requests per dollar.
- Collie very cheap. It uses [Amazon S3](https://aws.amazon.com/s3/) to store its index, and its index will never exceed 25MB. This means storage costs will never exceed $0.026/mo. Plus, S3 offers 11 nines of durability, so your data isn't going anywhere.

These factors combined mean Collie is the absolute cheapest, smallest hosted search engine in the world, with performance that is technically usable.

### Considerations

You should probably not use Collie for a business. Its performance is very slow per request (400ms response times) compared to something like elasticsearch.

However, Collie is perfect for hobbie projects where you expect relatively low use, or extreme performance is not important.

## Deploying

Collie must be run as a Lambda behind an API Gateway. You should grab `collie.zip` from the lastest release, and deploy that as your lambda code. Do not attempt to deploy the raw source code from this repo, as it is ~60MB instead of the 182KB of the compressed and minified artifact.

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