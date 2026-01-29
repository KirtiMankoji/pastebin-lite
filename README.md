# Pastebin Lite

A lightweight pastebin application that allows users to create and share text snippets with optional expiry times and view limits.

## Features

- Create text pastes with arbitrary content
- Optional time-to-live (TTL) expiration
- Optional view count limits
- Shareable URLs for each paste
- RESTful API endpoints
- Responsive web interface
- Deterministic time testing support for automated testing

## Tech Stack

- **Framework**: Next.js 14 (React)
- **Language**: TypeScript
- **Persistence**: Vercel KV (Redis)
- **Deployment**: Vercel
- **Runtime**: Node.js

## Persistence Layer

This application uses **Vercel KV** (Redis) as its persistence layer. Vercel KV is a serverless Redis database that provides:

- Durable storage that survives across serverless function invocations
- Atomic operations for view count tracking
- Native TTL support for automatic paste expiration
- Low-latency access from edge locations

The choice of Vercel KV was made because:
1. It integrates seamlessly with Vercel's deployment platform
2. It provides true persistence required for serverless environments
3. Redis TTL features align perfectly with paste expiration requirements
4. Atomic increment operations prevent race conditions in view counting

## Running Locally

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation Steps

1. Clone the repository:
```bash
git clone <your-repo-url>
cd pastebin-lite
```

2. Install dependencies:
```bash
npm install
```

3. Set up Vercel KV (required for local development):

   **Option A: Use Vercel CLI (Recommended)**
   ```bash
   # Install Vercel CLI if not already installed
   npm i -g vercel
   
   # Link to your Vercel project
   vercel link
   
   # Pull environment variables (including KV credentials)
   vercel env pull .env.local
   ```

   **Option B: Manual setup**
   - Create a Vercel KV database in your Vercel dashboard
   - Copy the KV credentials to `.env.local`:
   ```env
   KV_URL=your_kv_url
   KV_REST_API_URL=your_rest_api_url
   KV_REST_API_TOKEN=your_token
   KV_REST_API_READ_ONLY_TOKEN=your_read_only_token
   ```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## API Endpoints

### Health Check
```
GET /api/healthz
```
Returns the health status of the application and persistence layer.

**Response:**
```json
{
  "ok": true
}
```

### Create Paste
```
POST /api/pastes
```

**Request Body:**
```json
{
  "content": "Your text content here",
  "ttl_seconds": 3600,
  "max_views": 10
}
```

- `content` (required): Non-empty string containing the paste content
- `ttl_seconds` (optional): Integer ≥ 1, time-to-live in seconds
- `max_views` (optional): Integer ≥ 1, maximum number of views allowed

**Success Response (201):**
```json
{
  "id": "abc123",
  "url": "https://your-app.vercel.app/p/abc123"
}
```

**Error Response (400):**
```json
{
  "error": "content is required and must be a non-empty string"
}
```

### Get Paste (API)
```
GET /api/pastes/:id
```

**Success Response (200):**
```json
{
  "content": "Your text content here",
  "remaining_views": 9,
  "expires_at": "2026-01-30T12:00:00.000Z"
}
```

- `remaining_views`: Number of remaining views, or `null` if unlimited
- `expires_at`: ISO 8601 timestamp, or `null` if no expiry

**Note:** Each successful API fetch increments the view count.

**Error Response (404):**
```json
{
  "error": "Paste not found"
}
```

### View Paste (HTML)
```
GET /p/:id
```

Returns an HTML page displaying the paste content, or a 404 page if unavailable.

## Design Decisions

### 1. Atomic View Counting
View counts are incremented atomically using Redis `HINCRBY` to prevent race conditions when multiple requests fetch the same paste simultaneously.

### 2. Paste Expiration Strategy
The application uses a two-tier expiration approach:
- **Redis TTL**: Automatically removes expired pastes from storage
- **Application-level checks**: Validates expiration before serving to handle edge cases and test mode

### 3. Test Mode for Deterministic Testing
When `TEST_MODE=1` is set, the application accepts the `x-test-now-ms` header to override the current time for expiration logic. This enables reliable automated testing of time-based features.

### 4. ID Generation
Paste IDs are generated using a combination of timestamp (base36) and random string to ensure:
- Uniqueness across distributed deployments
- URL-safe characters
- Reasonable collision resistance

### 5. Safe Content Rendering
Paste content is rendered as plain text to prevent XSS attacks. The `pre-wrap` CSS ensures whitespace and line breaks are preserved.

### 6. Error Handling
All error responses return JSON with appropriate HTTP status codes:
- `400`: Invalid input
- `404`: Paste not found, expired, or view limit exceeded
- `500`: Server errors (rare)

### 7. Serverless Compatibility
The application is designed for serverless deployment:
- No global mutable state
- Stateless request handling
- External persistence (Vercel KV)
- Fast cold starts

## Environment Variables

Create a `.env.local` file for local development:

```env
# Vercel KV Configuration (obtained from Vercel dashboard)
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=

# Optional: Enable test mode for deterministic time testing
TEST_MODE=1
```

## Deployment

### Deploy to Vercel

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Import the project in Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository

3. Add Vercel KV storage:
   - In your Vercel project dashboard
   - Go to "Storage" tab
   - Create a new KV database
   - Connect it to your project

4. Deploy:
   - Vercel will automatically build and deploy
   - Environment variables are automatically configured

### Manual Deployment

```bash
vercel --prod
```

## Testing

The application is designed to pass automated tests that check:

- ✅ Health check endpoint
- ✅ Paste creation and retrieval
- ✅ View limits enforcement
- ✅ TTL expiration
- ✅ Combined constraints
- ✅ Error handling
- ✅ Concurrent access safety

### Test Mode

Enable test mode by setting `TEST_MODE=1` environment variable. When enabled, send the `x-test-now-ms` header with requests to simulate different points in time for expiration testing.

Example:
```bash
curl -H "x-test-now-ms: 1706659200000" https://your-app.vercel.app/api/pastes/abc123
```

## Project Structure

```
pastebin-lite/
├── app/
│   ├── api/
│   │   ├── healthz/
│   │   │   └── route.ts          # Health check endpoint
│   │   └── pastes/
│   │       ├── route.ts           # POST /api/pastes
│   │       └── [id]/
│   │           └── route.ts       # GET /api/pastes/:id
│   ├── p/
│   │   └── [id]/
│   │       ├── page.tsx           # HTML paste view
│   │       └── not-found.tsx      # 404 page
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Home page (create paste UI)
├── lib/
│   ├── kv.ts                      # KV client and operations
│   ├── time.ts                    # Time utilities and test mode
│   └── id.ts                      # ID generation
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

## License

MIT

## Author

Created as a take-home assignment for Aganitha Cognitive Solutions.

**Candidate ID**: Naukri0126

