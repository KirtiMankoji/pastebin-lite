# Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User / Browser                            │
└────────────────┬──────────────────────┬─────────────────────────┘
                 │                      │
                 │ HTTP                 │ HTTP
                 ▼                      ▼
    ┌────────────────────┐  ┌──────────────────────┐
    │   GET /p/:id       │  │   UI (Homepage)      │
    │   (HTML Page)      │  │   Create Paste Form  │
    └────────────────────┘  └──────────────────────┘
                 │                      │
                 │                      │ POST
                 │                      ▼
                 │          ┌──────────────────────┐
                 │          │  POST /api/pastes    │
                 │          │  (Create Paste)      │
                 │          └──────────────────────┘
                 │                      │
                 │                      │
    ┌────────────▼──────────────────────▼───────────────────────┐
    │                                                             │
    │              Next.js API Routes (Serverless)               │
    │                                                             │
    │  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐ │
    │  │ GET /healthz    │  │ POST /pastes │  │ GET /pastes  │ │
    │  │                 │  │              │  │     /:id     │ │
    │  │ - Ping KV       │  │ - Validate   │  │ - Get paste  │ │
    │  │ - Return status │  │ - Generate ID│  │ - Check TTL  │ │
    │  │                 │  │ - Store KV   │  │ - Check views│ │
    │  │                 │  │ - Return URL │  │ - Increment  │ │
    │  └─────────────────┘  └──────────────┘  └──────────────┘ │
    │                              │                   │         │
    └──────────────────────────────┼───────────────────┼─────────┘
                                   │                   │
                                   │                   │
                        ┌──────────▼───────────────────▼──────┐
                        │                                      │
                        │      Application Logic Layer        │
                        │                                      │
                        │  ┌────────────┐  ┌──────────────┐  │
                        │  │  lib/kv.ts │  │ lib/time.ts  │  │
                        │  │            │  │              │  │
                        │  │ - getPaste │  │ - TEST_MODE  │  │
                        │  │ - create   │  │ - getCurrent │  │
                        │  │ - increment│  │   Time       │  │
                        │  │   Views    │  │ - isExpired  │  │
                        │  │            │  │ - checkViews │  │
                        │  └────────────┘  └──────────────┘  │
                        │                                      │
                        └──────────────────┬───────────────────┘
                                           │
                                           │ @vercel/kv
                                           ▼
                        ┌──────────────────────────────────────┐
                        │                                      │
                        │      Vercel KV (Redis)              │
                        │      Persistence Layer               │
                        │                                      │
                        │  Data Structure:                     │
                        │  ┌─────────────────────────────┐    │
                        │  │ paste:{id}                  │    │
                        │  │ {                           │    │
                        │  │   id: string                │    │
                        │  │   content: string           │    │
                        │  │   createdAt: number         │    │
                        │  │   expiresAt: number | null  │    │
                        │  │   maxViews: number | null   │    │
                        │  │   viewCount: number         │    │
                        │  │ }                           │    │
                        │  └─────────────────────────────┘    │
                        │                                      │
                        │  Operations:                         │
                        │  - SET paste:{id}                    │
                        │  - GET paste:{id}                    │
                        │  - HINCRBY paste:{id} viewCount 1    │
                        │  - EXPIRE paste:{id} <seconds>       │
                        │                                      │
                        └──────────────────────────────────────┘
```

## Request Flow Diagrams

### Creating a Paste

```
User                 UI               API              Logic           KV
 │                   │                │                │               │
 │ Fill Form         │                │                │               │
 │──────────────────>│                │                │               │
 │                   │                │                │               │
 │ Click Submit      │                │                │               │
 │──────────────────>│                │                │               │
 │                   │ POST /pastes   │                │               │
 │                   │───────────────>│                │               │
 │                   │                │ Validate       │               │
 │                   │                │───────────────>│               │
 │                   │                │                │ Generate ID   │
 │                   │                │                │──────────────>│
 │                   │                │                │               │
 │                   │                │                │ SET paste:id  │
 │                   │                │                │──────────────>│
 │                   │                │                │               │
 │                   │                │                │ EXPIRE (TTL)  │
 │                   │                │                │──────────────>│
 │                   │                │<───────────────│               │
 │                   │                │ Success        │               │
 │                   │<───────────────│                │               │
 │                   │ {id, url}      │                │               │
 │<──────────────────│                │                │               │
 │ Display URL       │                │                │               │
 │                   │                │                │               │
```

### Viewing a Paste (API)

```
User            API              Logic                 KV
 │              │                │                     │
 │ GET /pastes/:id                │                     │
 │─────────────>│                │                     │
 │              │ Get paste      │                     │
 │              │───────────────>│                     │
 │              │                │ GET paste:id        │
 │              │                │────────────────────>│
 │              │                │<────────────────────│
 │              │                │ {paste data}        │
 │              │<───────────────│                     │
 │              │                │                     │
 │              │ Check expiry   │                     │
 │              │───────────────>│                     │
 │              │<───────────────│                     │
 │              │ Not expired    │                     │
 │              │                │                     │
 │              │ Check views    │                     │
 │              │───────────────>│                     │
 │              │<───────────────│                     │
 │              │ Under limit    │                     │
 │              │                │                     │
 │              │ Increment      │                     │
 │              │───────────────>│                     │
 │              │                │ HINCRBY viewCount 1 │
 │              │                │────────────────────>│
 │              │                │<────────────────────│
 │              │<───────────────│                     │
 │              │                │                     │
 │<─────────────│                │                     │
 │ {content,    │                │                     │
 │  remaining,  │                │                     │
 │  expires_at} │                │                     │
 │              │                │                     │
```

### View Limit Enforcement

```
Paste created with max_views=2

Request 1:
  GET /pastes/:id
  ├─> viewCount = 0
  ├─> 0 < 2 ✓ (allowed)
  ├─> HINCRBY → viewCount = 1
  └─> Return 200 {remaining_views: 1}

Request 2:
  GET /pastes/:id
  ├─> viewCount = 1
  ├─> 1 < 2 ✓ (allowed)
  ├─> HINCRBY → viewCount = 2
  └─> Return 200 {remaining_views: 0}

Request 3:
  GET /pastes/:id
  ├─> viewCount = 2
  ├─> 2 >= 2 ✗ (limit reached)
  └─> Return 404 (no increment)
```

## Data Flow

```
┌──────────────────────────────────────────────────────────┐
│                     Create Paste                          │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  Input (JSON)                                            │
│  ┌─────────────────────────────────────────────┐        │
│  │ {                                            │        │
│  │   "content": "Hello World",                 │        │
│  │   "ttl_seconds": 60,                        │        │
│  │   "max_views": 5                            │        │
│  │ }                                            │        │
│  └─────────────────────────────────────────────┘        │
│                       │                                   │
│                       ▼                                   │
│  Validation                                              │
│  ┌─────────────────────────────────────────────┐        │
│  │ ✓ content is non-empty string               │        │
│  │ ✓ ttl_seconds >= 1                          │        │
│  │ ✓ max_views >= 1                            │        │
│  └─────────────────────────────────────────────┘        │
│                       │                                   │
│                       ▼                                   │
│  Processing                                              │
│  ┌─────────────────────────────────────────────┐        │
│  │ id = generateId()                           │        │
│  │ createdAt = Date.now()                      │        │
│  │ expiresAt = createdAt + (60 * 1000)        │        │
│  └─────────────────────────────────────────────┘        │
│                       │                                   │
│                       ▼                                   │
│  Storage                                                 │
│  ┌─────────────────────────────────────────────┐        │
│  │ Paste Object:                               │        │
│  │ {                                            │        │
│  │   id: "abc123",                             │        │
│  │   content: "Hello World",                   │        │
│  │   createdAt: 1706659200000,                 │        │
│  │   expiresAt: 1706659260000,                 │        │
│  │   maxViews: 5,                              │        │
│  │   viewCount: 0                              │        │
│  │ }                                            │        │
│  │                                              │        │
│  │ Redis Commands:                             │        │
│  │ SET paste:abc123 <object>                   │        │
│  │ EXPIRE paste:abc123 60                      │        │
│  └─────────────────────────────────────────────┘        │
│                       │                                   │
│                       ▼                                   │
│  Output (JSON)                                           │
│  ┌─────────────────────────────────────────────┐        │
│  │ {                                            │        │
│  │   "id": "abc123",                           │        │
│  │   "url": "https://app.vercel.app/p/abc123" │        │
│  │ }                                            │        │
│  └─────────────────────────────────────────────┘        │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## Component Relationships

```
┌────────────────────────────────────────────────────────┐
│                   Frontend (UI)                         │
│                                                         │
│  app/page.tsx                                          │
│  ├─ Create paste form                                  │
│  ├─ Input validation (client-side)                     │
│  ├─ Submit to POST /api/pastes                         │
│  └─ Display result URL                                 │
│                                                         │
│  app/p/[id]/page.tsx                                   │
│  ├─ Server-side fetch paste                            │
│  ├─ Check availability                                 │
│  ├─ Render content safely                              │
│  └─ Display or 404                                     │
│                                                         │
└────────────────────────────────────────────────────────┘
                         │
                         │ HTTP Requests
                         ▼
┌────────────────────────────────────────────────────────┐
│                   API Layer                             │
│                                                         │
│  app/api/healthz/route.ts                             │
│  └─ Check KV connection                                │
│                                                         │
│  app/api/pastes/route.ts                              │
│  ├─ Validate input                                     │
│  ├─ Generate ID                                        │
│  ├─ Call lib/kv.createPaste()                         │
│  └─ Return ID and URL                                  │
│                                                         │
│  app/api/pastes/[id]/route.ts                         │
│  ├─ Call lib/kv.getPaste()                            │
│  ├─ Call lib/time utilities                           │
│  ├─ Increment view count                               │
│  └─ Return paste or 404                                │
│                                                         │
└────────────────────────────────────────────────────────┘
                         │
                         │ Function Calls
                         ▼
┌────────────────────────────────────────────────────────┐
│                  Business Logic                         │
│                                                         │
│  lib/kv.ts                                             │
│  ├─ getPaste(id): Promise<Paste | null>               │
│  ├─ createPaste(paste): Promise<void>                 │
│  ├─ incrementViewCount(id): Promise<void>             │
│  └─ deletePaste(id): Promise<void>                    │
│                                                         │
│  lib/time.ts                                           │
│  ├─ getCurrentTime(testNowMs?): number                │
│  ├─ isPasteExpired(expiresAt, now): boolean           │
│  └─ isViewLimitExceeded(max, count): boolean          │
│                                                         │
│  lib/id.ts                                             │
│  └─ generatePasteId(): string                          │
│                                                         │
└────────────────────────────────────────────────────────┘
                         │
                         │ Redis Commands
                         ▼
┌────────────────────────────────────────────────────────┐
│                  Data Layer (KV)                        │
│                                                         │
│  @vercel/kv                                            │
│  ├─ kv.get(key)                                        │
│  ├─ kv.set(key, value)                                 │
│  ├─ kv.hincrby(key, field, increment)                  │
│  ├─ kv.expire(key, seconds)                            │
│  ├─ kv.del(key)                                        │
│  └─ kv.ping()                                          │
│                                                         │
└────────────────────────────────────────────────────────┘
```

## Security Flow

```
┌─────────────────────────────────────────────────┐
│          User Input (Untrusted)                  │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
      ┌──────────────────────┐
      │  Input Validation    │
      │                      │
      │  ✓ Type checking     │
      │  ✓ Range validation  │
      │  ✓ Required fields   │
      │  ✓ No SQL injection  │
      └──────────────────────┘
                 │
                 ▼
      ┌──────────────────────┐
      │   Data Processing    │
      │                      │
      │  ✓ Sanitization      │
      │  ✓ Transformation    │
      └──────────────────────┘
                 │
                 ▼
      ┌──────────────────────┐
      │   Safe Storage       │
      │                      │
      │  Redis (typed)       │
      └──────────────────────┘
                 │
                 ▼
      ┌──────────────────────┐
      │   Safe Rendering     │
      │                      │
      │  ✓ No dangerousHTML  │
      │  ✓ Text only         │
      │  ✓ pre-wrap CSS      │
      │  ✓ XSS prevention    │
      └──────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│           Safe Output (HTML/JSON)                │
└─────────────────────────────────────────────────┘
```

---

This architecture ensures:
- ✅ Separation of concerns
- ✅ Scalability (serverless)
- ✅ Security (validation + XSS prevention)
- ✅ Reliability (atomic operations)
- ✅ Testability (clear interfaces)
