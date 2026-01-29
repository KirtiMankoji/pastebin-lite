# Assignment Requirements Checklist

Use this to verify your submission meets all requirements.

## ✅ Functional Requirements

### User Capabilities
- [x] Create a paste containing arbitrary text
- [x] Receive a shareable URL for that paste
- [x] Visit the URL to view the paste
- [x] Pastes may become unavailable based on constraints

### Constraints on Paste
- [x] Time-based expiry (TTL) - optional
- [x] View-count limit - optional
- [x] Paste becomes unavailable when either constraint triggers
- [x] Combined constraints work correctly

---

## ✅ Required Routes

### GET /api/healthz
- [x] Returns HTTP 200
- [x] Returns valid JSON
- [x] Responds quickly
- [x] Reflects persistence layer accessibility
- [x] Example response: `{"ok": true}`

### POST /api/pastes
- [x] Accepts JSON request body
- [x] `content` field is required and non-empty string
- [x] `ttl_seconds` is optional, must be integer ≥ 1
- [x] `max_views` is optional, must be integer ≥ 1
- [x] Returns 2xx with `id` and `url`
- [x] URL format: `https://your-app.vercel.app/p/<id>`
- [x] Invalid input returns 4xx with JSON error

### GET /api/pastes/:id
- [x] Returns 200 with paste content
- [x] Returns `remaining_views` (number or null)
- [x] Returns `expires_at` (ISO string or null)
- [x] Each API fetch counts as a view
- [x] Missing paste returns 404
- [x] Expired paste returns 404
- [x] View limit exceeded returns 404
- [x] All error cases return JSON

### GET /p/:id
- [x] Returns HTML (200) with paste content
- [x] Returns 404 if paste unavailable
- [x] Content is rendered safely (no script execution)
- [x] HTML escaping prevents XSS

---

## ✅ Deterministic Time for Testing

- [x] Supports `TEST_MODE=1` environment variable
- [x] Accepts `x-test-now-ms` request header
- [x] Treats header as current time for expiry logic
- [x] Uses real system time when header absent
- [x] Only affects expiry logic (not creation time)

---

## ✅ Persistence Requirement

- [x] Uses persistent storage (not in-memory only)
- [x] Storage survives across requests
- [x] Suitable for serverless deployment
- [x] Documented in README

**Persistence Layer**: Vercel KV (Redis)

---

## ✅ Automated Tests Coverage

### Service Checks
- [x] `/api/healthz` returns HTTP 200 and valid JSON
- [x] All API responses return valid JSON
- [x] Correct `Content-Type` header
- [x] Requests complete within reasonable timeout

### Paste Creation
- [x] Creating paste returns valid `id` and `url`
- [x] URL points to `/p/:id` on correct domain
- [x] No hardcoded URLs to localhost

### Paste Retrieval
- [x] Fetching existing paste returns original content
- [x] Visiting `/p/:id` returns HTML with content

### View Limits
- [x] Paste with `max_views=1`: first fetch → 200, second → 404
- [x] Paste with `max_views=2`: two successful, third → 404
- [x] No negative remaining view counts

### Time-to-Live (TTL)
- [x] Paste with TTL is available before expiry
- [x] After expiry (using `x-test-now-ms`), paste → 404

### Combined Constraints
- [x] Paste with TTL and max views
- [x] Becomes unavailable when first constraint triggers

### Error Handling
- [x] Invalid inputs return 4xx with JSON errors
- [x] Unavailable pastes consistently return 404

### Robustness
- [x] No negative remaining view counts
- [x] Handles small concurrent load correctly
- [x] Atomic view counting

---

## ✅ UI Expectations

- [x] Users can create paste via UI
- [x] Users can view paste via shared link
- [x] Errors shown clearly (invalid input, expired paste)
- [x] UI design is functional (styling not critical)

---

## ✅ Repository Guidelines

### Repository Structure
- [x] `README.md` exists at repository root
- [x] README contains project description
- [x] README contains local run instructions
- [x] README describes persistence layer
- [x] Repository contains source code (not just builds)

### Code Quality
- [x] No hardcoded absolute URLs to localhost
- [x] No secrets/tokens/credentials committed
- [x] No global mutable state that breaks serverless

### Build & Runtime
- [x] Project installs with documented commands
- [x] Project starts with documented commands
- [x] Deployed app starts without manual migrations
- [x] No shell access required for deployment

---

## ✅ Submission Requirements

### What to Submit
- [ ] Deployed URL (e.g., `https://your-app.vercel.app`)
- [ ] Public Git repository URL
- [ ] **Candidate ID**: Naukri0126 (MANDATORY)

### Documentation
- [x] README.md with:
  - [x] How to run locally
  - [x] Persistence layer description
  - [x] Important design decisions
- [x] Clear project structure
- [x] Comments where helpful (not excessive)

---

## ✅ Technical Implementation

### Architecture
- [x] Next.js 14 (or equivalent stack)
- [x] TypeScript for type safety
- [x] Serverless-compatible
- [x] API routes in `/app/api/`
- [x] Pages in `/app/`

### Data Storage
- [x] Vercel KV (Redis) integration
- [x] Atomic operations for view counting
- [x] TTL support for auto-expiration
- [x] Proper error handling

### Security
- [x] Input validation
- [x] XSS prevention in HTML rendering
- [x] No SQL injection (using KV store)
- [x] Safe content display

### Testing
- [x] Manually tested all endpoints
- [x] Verified UI functionality
- [x] Tested edge cases
- [x] Verified error handling

---

## ✅ Code Quality

### Best Practices
- [x] Consistent code style
- [x] Meaningful variable names
- [x] Proper error handling
- [x] No console.logs in production (only errors)
- [x] TypeScript types used properly

### Organization
- [x] Clean file structure
- [x] Separation of concerns
- [x] Utilities in `/lib/`
- [x] API routes properly organized

---

## ✅ Deployment

### Vercel Setup
- [ ] Project deployed to Vercel
- [ ] KV storage connected
- [ ] Environment variables configured
- [ ] Deployment successful
- [ ] No build errors

### Verification
- [ ] Health check working
- [ ] Can create paste via API
- [ ] Can retrieve paste via API
- [ ] Can view paste in browser
- [ ] TTL works correctly
- [ ] View limits work correctly
- [ ] Error handling works

---

## ✅ Final Checks

### Before Submission
- [ ] All tests pass
- [ ] No errors in Vercel logs
- [ ] UI is functional
- [ ] README is complete and accurate
- [ ] Repository is PUBLIC
- [ ] No secrets in repository
- [ ] .gitignore includes .env files
- [ ] Candidate ID ready: **Naukri0126**

### Submission
- [ ] Deployed URL copied
- [ ] GitHub URL copied
- [ ] Form filled with Candidate ID
- [ ] Notes prepared (see SUBMISSION.md)
- [ ] Submitted before deadline (2 days from email)

---

## 📊 Estimated Completion Status

- Functional Requirements: ✅ 100%
- Required Routes: ✅ 100%
- Testing Support: ✅ 100%
- Persistence: ✅ 100%
- UI: ✅ 100%
- Repository Guidelines: ✅ 100%
- Documentation: ✅ 100%
- Code Quality: ✅ 100%

---

## 🎯 Ready for Submission?

If all checkboxes above are marked, you're ready to submit!

1. Double-check your Deployed URL works
2. Ensure GitHub repository is PUBLIC
3. Fill the Google Form with:
   - Deployed URL
   - GitHub URL
   - **Candidate ID: Naukri0126** (MANDATORY)
4. Submit before deadline

---

**Good luck!** 🚀
