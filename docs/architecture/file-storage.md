# File storage

The target system stores profile photos, thesis PDFs, ZIP archives, message attachments, assignment PDFs, and defense minutes in private MinIO-compatible buckets. PostgreSQL stores ownership, versions, checksums, MIME type, size, source workflow record, and retention metadata. Uploads accept only the documented formats and reject files larger than 50 MB.

## Upload flow

```mermaid
sequenceDiagram
	participant C as Client
	participant A as App (server action)
	participant V as Validator
	participant M as MinIO
	participant P as PostgreSQL

	C->>A: upload request
	A->>V: check size, MIME, filename, ownership
	V-->>A: accept or reject
	A->>M: store object (server-generated key)
	M-->>A: object id
	A->>P: insert FileVersion (checksum, size, source)
	P-->>A: committed
	A-->>C: 201 with metadata
```

## Download flow

```mermaid
sequenceDiagram
	participant C as Client
	participant A as App
	participant P as PostgreSQL
	participant M as MinIO

	C->>A: download request
	A->>P: load file metadata + ownership
	A->>A: authorize role and ownership
	A->>M: request short-lived signed URL
	M-->>A: URL (<= 5 min)
	A-->>C: redirect to signed URL
```

Downloads use short-lived signed URLs or a signed-download proxy after a server-side ownership or role check. Object keys must not be exposed as authorization decisions, and file contents must not appear in logs. Version numbers are immutable so a final submission can be locked without losing its history.
