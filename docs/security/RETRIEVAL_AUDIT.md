# Retrieval Audit Events

## Status

The retrieval audit contract is implemented in:

- `app/services/retrieval/audit.py` — event model, hashing helpers, logging sink, and failure-isolated emission.
- `app/services/retrieval/secure_retriever.py` — emits one audit event per retrieval decision.
- `tests/security/test_retrieval_audit.py` — unit coverage for the contract, redaction, outcomes, and sink failure isolation.

The default sink writes structured JSON logs. Persisting events to the Supabase
`audit_events` table is a follow-up and is not part of this change.

## Event Contract

`RetrievalAuditEvent` is a frozen dataclass with the following fields:

| Field | Type | Description |
|---|---|---|
| `timestamp` | `datetime` | UTC timestamp, serialized as ISO 8601. |
| `request_id` | `str \| None` | Request correlation ID, when supplied by the caller. |
| `user_id` | `int \| None` | Authenticated user ID, when supplied by the caller. |
| `query_hash` | `str` | SHA-256 hash of the raw query. |
| `principal_count` | `int` | Number of ACL principals supplied to retrieval. |
| `principal_types` | `tuple[str, ...]` | Distinct principal types, sorted. IDs are never recorded. |
| `filter_hash` | `str \| None` | SHA-256 hash of the canonical ACL filter. |
| `k` | `int` | Requested result count. |
| `result_count` | `int` | Number of documents returned to the caller. |
| `outcome` | `Literal["allowed", "denied", "error"]` | Authorization/retrieval outcome. |
| `latency_ms` | `float` | Retrieval latency in milliseconds, rounded to 3 decimals when serialized. |
| `error_type` | `str \| None` | Exception class name for `error` outcomes. |

`as_dict()` returns a JSON-serializable payload suitable for a log line or a
future database sink.

## Outcomes

| Outcome | When | Default log level |
|---|---|---|
| `allowed` | ACL filter built and vector search completed. | `INFO` |
| `denied` | No principals were supplied; retrieval short-circuits without calling the vector store. | `WARNING` |
| `error` | ACL filter construction or vector search raised an exception; retrieval fails closed. | `ERROR` |

## Redaction Rules

Audit events must be safe to retain and aggregate:

- Raw query text is replaced by `query_hash`.
- Principal IDs are replaced by `principal_count` and distinct `principal_types`.
- The ACL filter is replaced by `filter_hash`.
- Document content, chunk text, and retrieved IDs are not recorded by this contract.
- `request_id` and `user_id` are only recorded when the caller supplies them.

## Emission

`SecureRetriever` emits one event on every `retrieve()` call:

```python
from app.services.retrieval.secure_retriever import SecureRetriever

retriever = SecureRetriever(vector_store=vector_store)
documents = retriever.retrieve(
    query=query,
    principals=principals,
    k=4,
    request_id=request_id,
    user_id=user_id,
)
```

To send events somewhere other than logs, inject an `AuditSink`:

```python
class DatabaseAuditSink:
    def emit(self, event):
        # Persist event.as_dict() to the audit_events table.
        ...

retriever = SecureRetriever(vector_store=vector_store, audit_sink=DatabaseAuditSink())
```

## Failure Isolation

Audit emission must never change retrieval behavior. `emit_audit_event()` catches
exceptions from the sink, logs them, and continues. A failing audit sink therefore
does not turn an allowed retrieval into an error or expose additional data.

## Tests

`tests/security/test_retrieval_audit.py` covers:

- deterministic query and filter hashing;
- absence of raw queries and principal IDs from serialized events;
- sorted, distinct principal types;
- allowed, denied, and error event emission;
- latency and result counts;
- failure-isolated audit sinks;
- structured JSON logging.

## Follow-ups

- Persist events to the `audit_events` table once the model and migration are available.
- Add alerting or dashboards for repeated `denied` and `error` outcomes.
- Propagate `request_id` from the API layer into every retrieval call.
