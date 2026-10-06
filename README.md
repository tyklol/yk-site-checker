# yk-site-checker

Functional tests for [yk-site](https://github.com/tyklol/yk-site), written from `SPEC.md` only.
Playwright + TypeScript, Chromium. Tests run against the URL in `BASE_URL`.

```bash
npm ci
npx playwright install chromium
BASE_URL=http://localhost:8000 npm test
```
