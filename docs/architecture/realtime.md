# Real-time events

The Socket.IO server runs as its own Node process (`pnpm events:start`, container `events`). It publishes live messaging, coordinator-capacity changes, proposal decisions, defense-session controls, and gradebook updates. The server authenticates each socket, derives channel membership from database permissions on every subscription, and rejects client-controlled channel names that do not match the channel grammar.

## Connection flow

```mermaid
sequenceDiagram
	participant C as Client
	participant S as Socket.IO server
	participant A as Next.js /api/auth/session
	participant P as PostgreSQL

	C->>S: connect (session cookie)
	S->>A: GET session with forwarded cookie
	A-->>S: userId + roles + expiry
	S-->>C: connected (disconnects at session expiry)
	C->>S: subscribe("conversation:<id>")
	S->>P: check membership
	P-->>S: member or not
	S-->>C: ack ok or forbidden
```

The handshake origin must equal `APP_URL`. Channel names match `kind:id` with `kind` in `conversation`, `thesis`, `coordinator`, `committee`, `defense`.

| Channel | Who may subscribe |
|---|---|
| `conversation:<id>` | The two conversation participants |
| `thesis:<id>` | The thesis student and coordinator, secretary, administrator |
| `coordinator:<profileId>` | That coordinator, any student, secretary, administrator |
| `committee:<id>` | Committee members, secretary, administrator |
| `defense:<slotId>` | Committee members of the slot, the thesis student and coordinator, secretary, administrator |

## Publishing

Route handlers and server actions publish after their transaction commits by calling `publishEvent`, which posts to `POST /internal/publish` on the events server with `Authorization: Bearer EVENTS_INTERNAL_TOKEN`. The server accepts only catalogued event names and valid channels, emits to the channel, and returns the number of distinct users in the channel other than `excludeUserId`. Callers use that count to detect offline recipients. Publishing never throws. If the server is unreachable the count is 0.

## Event catalog

| Event | Publisher | Payload | Audience |
|---|---|---|---|
| `proposal.decided` | Route handler | proposal id, state | Student, coordinator |
| `capacity.changed` | Route handler | coordinator id, remaining | Authorized students |
| `message.created` | Server | message id, conversation id, sender id | Conversation members |
| `message.read` | Server | conversation id, reader id, message ids, read time | Conversation members |
| `message.typing` | Socket server | conversation id, user id, typing flag | Other conversation members |
| `defense.slot.changed` | Route handler | session id, slot | Committee, secretary |
| `gradebook.updated` | Route handler | session id, mean | Committee, president |
| `gradebook.closed` | Route handler | session id, result | Committee, student |

Events are emitted after the transaction that changes the source record commits. Message events carry identifiers only. Clients load content through an authorized server action. Gradebook events carry only the authorized session state and the computed average needed by participants. Offline recipients receive email alerts for unread messages instead of relying on a socket connection.
