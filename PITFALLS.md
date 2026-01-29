# Common Pitfalls & Solutions

Learn from common mistakes to ensure your submission succeeds.

## 🚨 Critical Issues (Will Fail Automated Tests)

### 1. ❌ KV Storage Not Connected
**Problem**: Pastes don't persist, all reads return 404

**Symptoms**:
- Health check might pass
- Paste creation returns ID
- Immediate retrieval fails

**Solution**:
```bash
# In Vercel Dashboard:
1. Go to Storage tab
2. Create KV database
3. Connect to project
4. Redeploy application
```

**Verification**:
```bash
# Create and immediately retrieve
curl -X POST $APP_URL/api/pastes -d '{"content":"test"}' -H "Content-Type: application/json"
# Use the returned ID
curl $APP_URL/api/pastes/<id>
# Should return the content
```

---

### 2. ❌ View Count Not Atomic
**Problem**: Race condition allows exceeding view limits

**Bad Implementation**:
```typescript
// ❌ DON'T DO THIS
const paste = await getPaste(id);
paste.viewCount += 1;
await savePaste(paste);
```

**Good Implementation**:
```typescript
// ✅ DO THIS
await kvClient.hincrby(`paste:${id}`, 'viewCount', 1);
```

**Why**: Multiple simultaneous requests can read the same count before incrementing.

---

### 3. ❌ Checking View Limit After Incrementing
**Problem**: Allows one extra view beyond the limit

**Bad Flow**:
```typescript
// ❌ DON'T DO THIS
await incrementViewCount(id);
const paste = await getPaste(id);
if (paste.viewCount > paste.maxViews) {
  return 404;
}
return paste;
```

**Good Flow**:
```typescript
// ✅ DO THIS
const paste = await getPaste(id);
if (paste.viewCount >= paste.maxViews) {
  return 404;
}
await incrementViewCount(id);
return paste;
```

---

### 4. ❌ Not Using TEST_MODE Properly
**Problem**: Time-based tests fail

**Missing Implementation**:
```typescript
// ❌ DON'T DO THIS
const now = Date.now();
```

**Correct Implementation**:
```typescript
// ✅ DO THIS
function getCurrentTime(testNowMs?: string): number {
  if (process.env.TEST_MODE === '1' && testNowMs) {
    return parseInt(testNowMs, 10);
  }
  return Date.now();
}

// In route:
const testNowMs = request.headers.get('x-test-now-ms');
const currentTime = getCurrentTime(testNowMs);
```

---

### 5. ❌ XSS Vulnerability in Content Display
**Problem**: Malicious scripts can execute

**Bad HTML**:
```tsx
// ❌ DANGEROUS
<div dangerouslySetInnerHTML={{ __html: paste.content }} />
```

**Good HTML**:
```tsx
// ✅ SAFE
<div style={{ whiteSpace: 'pre-wrap' }}>
  {paste.content}
</div>
```

---

## ⚠️ Common Mistakes (May Cause Issues)

### 6. ⚠️ Hardcoded URLs
**Problem**: Automated tests fail, app breaks in production

**Examples to Avoid**:
```typescript
// ❌ DON'T
const url = `http://localhost:3000/p/${id}`;
const url = `https://my-app.vercel.app/p/${id}`;
```

**Correct Approach**:
```typescript
// ✅ DO
const host = request.headers.get('host');
const protocol = host.includes('localhost') ? 'http' : 'https';
const url = `${protocol}://${host}/p/${id}`;
```

---

### 7. ⚠️ Missing Environment Variables in Production
**Problem**: App works locally but fails on Vercel

**Checklist**:
- [ ] KV_URL set in Vercel
- [ ] KV_REST_API_URL set
- [ ] KV_REST_API_TOKEN set
- [ ] Environment variables connected to production

**Verification**:
```bash
# In Vercel Dashboard
Settings → Environment Variables
# Should see all KV_* variables
```

---

### 8. ⚠️ Invalid JSON Responses
**Problem**: Automated tests expect JSON for all API routes

**Bad Response**:
```typescript
// ❌ DON'T
return new Response('Paste not found', { status: 404 });
```

**Good Response**:
```typescript
// ✅ DO
return NextResponse.json(
  { error: 'Paste not found' },
  { status: 404 }
);
```

---

### 9. ⚠️ Global Mutable State
**Problem**: State shared across requests in serverless

**Bad Pattern**:
```typescript
// ❌ DON'T - file scope
let requestCount = 0;

export async function GET() {
  requestCount++; // Unreliable in serverless!
}
```

**Good Pattern**:
```typescript
// ✅ DO - use external storage
export async function GET() {
  await kvClient.incr('request_count');
}
```

---

### 10. ⚠️ Not Handling Edge Cases

**Missing Paste**:
```typescript
const paste = await getPaste(id);
if (!paste) {
  return NextResponse.json({ error: 'Paste not found' }, { status: 404 });
}
```

**Empty Content**:
```typescript
if (!content || content.trim() === '') {
  return NextResponse.json({ error: 'Content required' }, { status: 400 });
}
```

**Invalid Numbers**:
```typescript
if (!Number.isInteger(ttl_seconds) || ttl_seconds < 1) {
  return NextResponse.json({ error: 'Invalid TTL' }, { status: 400 });
}
```

---

## 🐛 Debugging Tips

### Issue: Health Check Fails

**Check**:
1. KV storage is created
2. KV is connected to project
3. Environment variables are set
4. Application was redeployed after KV connection

**Debug**:
```typescript
export async function GET() {
  try {
    await kvClient.ping();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('KV Error:', error); // Check Vercel logs
    return NextResponse.json({ ok: false });
  }
}
```

---

### Issue: Paste Creation Works But Retrieval Fails

**Possible Causes**:
1. Paste object not serialized correctly
2. TTL too short (already expired)
3. KV key mismatch

**Debug**:
```typescript
// Log what's being stored
console.log('Storing paste:', JSON.stringify(paste));

// Log what's retrieved
const retrieved = await getPaste(id);
console.log('Retrieved paste:', JSON.stringify(retrieved));
```

---

### Issue: View Limit Not Working

**Check**:
1. View count being incremented atomically
2. Checking limit BEFORE incrementing
3. Using >= not > for comparison

**Test**:
```bash
# Create paste with max_views=1
curl -X POST $APP_URL/api/pastes \
  -d '{"content":"test","max_views":1}' \
  -H "Content-Type: application/json"

# First request should work
curl $APP_URL/api/pastes/<id>

# Second request should be 404
curl $APP_URL/api/pastes/<id>
```

---

### Issue: TTL Not Expiring

**Check**:
1. TEST_MODE environment variable set correctly
2. Using x-test-now-ms header correctly
3. Expiry calculation is correct

**Debug**:
```typescript
console.log('Current time:', currentTime);
console.log('Expires at:', paste.expiresAt);
console.log('Is expired:', currentTime >= paste.expiresAt);
```

---

## 📋 Pre-Deployment Checklist

Run these checks before deploying:

```bash
# 1. Build succeeds locally
npm run build

# 2. No TypeScript errors
npx tsc --noEmit

# 3. No hardcoded URLs
grep -r "localhost:3000" app/ lib/
# Should return nothing

# 4. No committed secrets
git grep -E "(API_KEY|SECRET|PASSWORD|TOKEN)" .
# Should only show .env.example

# 5. .gitignore includes .env
cat .gitignore | grep ".env"
```

---

## 🔍 Vercel Deployment Checks

After deployment:

1. **Check Build Logs**
   - No errors during build
   - All dependencies installed
   - TypeScript compiled successfully

2. **Check Function Logs**
   - Click on a deployment
   - Go to "Functions" tab
   - Check for runtime errors

3. **Check Environment Variables**
   - Settings → Environment Variables
   - Verify all KV_* variables present
   - Verify they're assigned to Production

4. **Test Each Endpoint**
   - Use TESTING.md guide
   - Test health, create, retrieve, view
   - Test error cases

---

## ✅ Final Validation

Before submitting, verify:

```bash
#!/bin/bash
APP_URL="https://your-app.vercel.app"

echo "1. Health check..."
curl -f $APP_URL/api/healthz || echo "❌ FAILED"

echo "2. Create paste..."
RESULT=$(curl -X POST $APP_URL/api/pastes \
  -H "Content-Type: application/json" \
  -d '{"content":"test"}')
ID=$(echo $RESULT | jq -r '.id')
[ ! -z "$ID" ] || echo "❌ FAILED"

echo "3. Retrieve paste..."
curl -f $APP_URL/api/pastes/$ID || echo "❌ FAILED"

echo "4. View in browser..."
curl -f $APP_URL/p/$ID || echo "❌ FAILED"

echo "5. Test view limit..."
RESULT=$(curl -X POST $APP_URL/api/pastes \
  -H "Content-Type: application/json" \
  -d '{"content":"limited","max_views":1}')
ID=$(echo $RESULT | jq -r '.id')
curl -f $APP_URL/api/pastes/$ID > /dev/null
curl -f $APP_URL/api/pastes/$ID && echo "❌ Should be 404!" || echo "✅ PASSED"

echo "All critical tests passed! ✅"
```

---

## 🎓 Key Takeaways

1. **Always use atomic operations** for view counting
2. **Check constraints before incrementing** view count
3. **Support TEST_MODE** for deterministic testing
4. **Escape all user content** to prevent XSS
5. **Use dynamic URLs** - never hardcode
6. **Handle all edge cases** with proper error codes
7. **Test on Vercel** before submitting
8. **Include Candidate ID** in submission

---

**Remember**: The automated tests are strict but fair. Follow these guidelines and you'll pass! 🎯
