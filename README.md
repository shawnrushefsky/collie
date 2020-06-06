# collie
A serverless, pay-on-demand search engine for small applications, built on elasticlunr.

## Why "collie"?

Like the Border Collie for which it is named, collie is pretty good at small search jobs, but still a little derpy.

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