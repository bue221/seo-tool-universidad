# Delta audit-contract: audit-intelligence-upgrade

**Target spec:** `openspec/specs/audit-contract/spec.md`
**Operation:** ADD (backward-compatible, optional fields)

## ADDED — Optional field `crawl`

```json
"crawl": {
  "pagesVisited": 12,
  "maxPages": 15,
  "truncated": true,
  "maxDepth": 2
}
```

- `pagesVisited` number >= 1
- `maxPages` number in [10, 15]
- `truncated` boolean
- `maxDepth` number >= 1

## ADDED — Optional field `siteStructure`

```json
"siteStructure": {
  "root": "example.com",
  "nodes": [
    {
      "id": "/",
      "label": "/",
      "depth": 0,
      "children": ["/blog", "/pricing"]
    }
  ]
}
```

## ADDED — Optional field `observability`

```json
"observability": {
  "stages": [
    { "name": "fetch", "status": "ok", "durationMs": 832 }
  ],
  "totalDurationMs": 2180
}
```

Stage status enum: `ok | warn | error | skipped`.

## ADDED — Optional field `recommendations`

```json
"recommendations": [
  {
    "id": "meta-description-length",
    "title": "Fix meta description length",
    "impact": "high",
    "effort": "low",
    "reason": "Current length is 42 chars"
  }
]
```

- `impact`: `low | medium | high`
- `effort`: `low | medium | high`

## Compatibility

Todos los campos agregados son opcionales; clientes actuales siguen funcionando sin cambios inmediatos.
