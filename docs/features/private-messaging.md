# Private messaging

The target private conversation is limited to the assigned student and coordinator, with authorized attachments, message timestamps, read receipts, and typing indicators. Socket events are scoped to conversation membership. Offline recipients receive email alerts for unread messages, while the message remains the authoritative record in PostgreSQL.

```mermaid
sequenceDiagram
	participant S as Student
	participant N as Next.js
	participant P as PostgreSQL
	participant IO as Socket.IO
	participant C as Coordinator

	S->>N: POST message
	N->>N: authorize conversation membership
	N->>P: insert message (tx)
	P-->>N: committed
	N->>IO: emit message.created
	IO-->>C: deliver event
	C-->>IO: read receipt
	IO-->>S: delivery state
```
