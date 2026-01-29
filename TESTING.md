# Testing Guide

This guide helps you manually test all features before submission.

## Prerequisites

- Application deployed and running
- KV storage connected
- Base URL noted (e.g., `https://your-app.vercel.app`)

## Test Checklist

### ✅ 1. Health Check

```bash
curl https://your-app.vercel.app/api/healthz
```

**Expected:**
- Status: 200
- Response: `{"ok":true}`

---

### ✅ 2. Create Simple Paste

```bash
curl -X POST https://your-app.vercel.app/api/pastes \
  -H "Content-Type: application/json" \
  -d '{"content":"Hello, World!"}'
```

**Expected:**
- Status: 201
- Response contains `id` and `url`
- URL format: `https://your-app.vercel.app/p/<id>`

---

### ✅ 3. Retrieve Paste via API

```bash
# Use the ID from previous test
curl https://your-app.vercel.app/api/pastes/<paste-id>
```

**Expected:**
- Status: 200
- Response contains:
  - `content`: "Hello, World!"
  - `remaining_views`: null
  - `expires_at`: null

---

### ✅ 4. View Paste in Browser

Open the URL from test #2 in your browser.

**Expected:**
- Status: 200
- Page displays "Hello, World!"
- Clean HTML rendering

---

### ✅ 5. Create Paste with TTL

```bash
curl -X POST https://your-app.vercel.app/api/pastes \
  -H "Content-Type: application/json" \
  -d '{"content":"Expires in 60 seconds","ttl_seconds":60}'
```

**Expected:**
- Status: 201
- Response contains valid `id` and `url`

Check immediately:
```bash
curl https://your-app.vercel.app/api/pastes/<paste-id>
```
- Status: 200
- `expires_at` is ~60 seconds in the future

---

### ✅ 6. Create Paste with View Limit

```bash
curl -X POST https://your-app.vercel.app/api/pastes \
  -H "Content-Type: application/json" \
  -d '{"content":"Max 2 views","max_views":2}'
```

**First view:**
```bash
curl https://your-app.vercel.app/api/pastes/<paste-id>
```
- Status: 200
- `remaining_views`: 1

**Second view:**
```bash
curl https://your-app.vercel.app/api/pastes/<paste-id>
```
- Status: 200
- `remaining_views`: 0

**Third view:**
```bash
curl https://your-app.vercel.app/api/pastes/<paste-id>
```
- Status: 404
- Error message about view limit

---

### ✅ 7. Test Combined Constraints

```bash
curl -X POST https://your-app.vercel.app/api/pastes \
  -H "Content-Type: application/json" \
  -d '{"content":"TTL and views","ttl_seconds":300,"max_views":5}'
```

**Verify both constraints are present:**
```bash
curl https://your-app.vercel.app/api/pastes/<paste-id>
```
- Status: 200
- `expires_at`: ~5 minutes in future
- `remaining_views`: 4

---

### ✅ 8. Test Invalid Inputs

**Empty content:**
```bash
curl -X POST https://your-app.vercel.app/api/pastes \
  -H "Content-Type: application/json" \
  -d '{"content":""}'
```
- Status: 400
- Error message about content

**Invalid TTL:**
```bash
curl -X POST https://your-app.vercel.app/api/pastes \
  -H "Content-Type: application/json" \
  -d '{"content":"test","ttl_seconds":0}'
```
- Status: 400
- Error message about ttl_seconds

**Invalid max_views:**
```bash
curl -X POST https://your-app.vercel.app/api/pastes \
  -H "Content-Type: application/json" \
  -d '{"content":"test","max_views":-1}'
```
- Status: 400
- Error message about max_views

---

### ✅ 9. Test Non-Existent Paste

```bash
curl https://your-app.vercel.app/api/pastes/nonexistent123
```
- Status: 404
- JSON error response

---

### ✅ 10. Test UI Flow

1. Open `https://your-app.vercel.app` in browser
2. Enter some text in the content field
3. Optionally set TTL and max views
4. Click "Create Paste"
5. Verify success message appears
6. Click "Open" button
7. Verify paste displays correctly

---

### ✅ 11. Test Time-Based Expiry (with Test Mode)

**Note:** This requires `TEST_MODE=1` environment variable set in Vercel.

Create a paste with 60-second TTL:
```bash
curl -X POST https://your-app.vercel.app/api/pastes \
  -H "Content-Type: application/json" \
  -d '{"content":"Test expiry","ttl_seconds":60}'
```

Get current timestamp + 70 seconds:
```bash
# Calculate: current_time_ms + 70000
# Example: 1706659200000 + 70000 = 1706659270000
```

Fetch with future time:
```bash
curl https://your-app.vercel.app/api/pastes/<paste-id> \
  -H "x-test-now-ms: 1706659270000"
```
- Status: 404 (paste should be expired)

---

## Quick Test Script

Save this as `test.sh`:

```bash
#!/bin/bash
BASE_URL="https://your-app.vercel.app"

echo "Testing health check..."
curl -s "$BASE_URL/api/healthz" | jq

echo -e "\nCreating paste..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/pastes" \
  -H "Content-Type: application/json" \
  -d '{"content":"Test paste"}')
echo $RESPONSE | jq

PASTE_ID=$(echo $RESPONSE | jq -r '.id')
echo -e "\nPaste ID: $PASTE_ID"

echo -e "\nFetching paste..."
curl -s "$BASE_URL/api/pastes/$PASTE_ID" | jq

echo -e "\nTesting view limit..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/pastes" \
  -H "Content-Type: application/json" \
  -d '{"content":"Limited views","max_views":1}')
LIMITED_ID=$(echo $RESPONSE | jq -r '.id')

echo "First view:"
curl -s "$BASE_URL/api/pastes/$LIMITED_ID" | jq

echo "Second view (should be 404):"
curl -s "$BASE_URL/api/pastes/$LIMITED_ID" | jq

echo -e "\nAll tests complete!"
```

Run with:
```bash
chmod +x test.sh
./test.sh
```

---

## Pre-Submission Checklist

- [ ] Health check returns 200
- [ ] Can create paste via API
- [ ] Can retrieve paste via API
- [ ] Can view paste in browser
- [ ] TTL expiration works
- [ ] View limits work correctly
- [ ] Combined constraints work
- [ ] Invalid inputs return 400
- [ ] Missing pastes return 404
- [ ] UI can create pastes
- [ ] UI can view pastes
- [ ] No hardcoded localhost URLs in code
- [ ] README.md is complete
- [ ] Repository is public on GitHub
- [ ] Candidate ID mentioned in submission

---

## Common Issues

### Paste always returns 404
- Check KV connection via health check
- Verify paste was created successfully
- Check Vercel function logs

### View count not incrementing
- Check Redis HINCRBY is working
- Verify KV permissions

### TTL not working
- Ensure KV expire command succeeds
- Check system time vs. expires_at

### UI not loading
- Check browser console for errors
- Verify API endpoints are working
- Check Vercel deployment logs

---

## Support

If tests fail, check:
1. Vercel deployment logs
2. KV storage connection
3. Environment variables
4. API response headers and status codes
