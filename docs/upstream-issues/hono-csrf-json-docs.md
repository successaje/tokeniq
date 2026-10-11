# Draft: make clear that `csrf()` does not protect JSON endpoints

**Project:** hono, version 4.13 (`hono/csrf`)
**Type:** documentation suggestion
**Status:** draft, not filed. Check the current docs first; they may already say this.

## Summary

`csrf()` validates the `Origin` header only for requests whose `Content-Type` is a form type (`application/x-www-form-urlencoded`, `multipart/form-data`, `text/plain`). That makes sense, because those are the requests a browser sends cross-site without a CORS preflight. But teams building JSON APIs can read "CSRF protection" as covering every state-changing request.

In our API, a cross-site `POST` with `Content-Type: application/json` passed `csrf()`. CORS and SameSite cookies still limit real-world exploitability, depending on configuration.

## Suggestion

Add one sentence and an example to the middleware docs: "JSON requests are not checked. If your API accepts cookies and JSON, validate `Origin` yourself or require a custom header."

## Our approach

`apps/api/src/app.ts` rejects any non-GET `/api/v1` request whose `Origin` (or, failing that, `Referer`) is not an allowed app origin. The response is 403 `bad_origin`, and a test covers it.
