import { test, expect, type Page, type Route } from '@playwright/test';

// SPEC.md line 4: "Sections with ids: #hero #about #skills #projects #repos #contact. All six must exist."
test('SPEC L4: all six section ids exist', async ({ page }) => {
  await page.goto('./');
  for (const id of ['hero', 'about', 'skills', 'projects', 'repos', 'contact']) {
    await expect(page.locator(`#${id}`), `#${id} should exist exactly once`).toHaveCount(1);
  }
});

// SPEC.md line 5: "Responsive: no horizontal scroll at a viewport width of 375px."
test('SPEC L5: no horizontal scroll at 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto('./', { waitUntil: 'networkidle' });
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth, `scrollWidth ${scrollWidth} > clientWidth ${clientWidth}`).toBeLessThanOrEqual(clientWidth);
});

// SPEC.md line 6: "#repos lists public GitHub repos as cards, or shows a plain message
// if there are none or the fetch fails."
// The GitHub API is stubbed so each branch is checked deterministically and the
// tests do not depend on the unauthenticated rate limit.
test.describe('SPEC L6: #repos', () => {
  const stubGitHubApi = (page: Page, handler: (route: Route) => Promise<void>) =>
    page.route(/^https:\/\/api\.github\.com\//, handler);

  // Number of links in #repos pointing at a specific repo (github.com/<owner>/<repo>).
  // A link to a profile (github.com/<owner>) is allowed alongside a message.
  const countRepoLinks = (page: Page) =>
    page.locator('#repos a[href]').evaluateAll((as) =>
      as.filter((a) => /github\.com\/[^/]+\/[^/?#]+/.test((a as HTMLAnchorElement).href)).length,
    );

  test('lists repos returned by GitHub', async ({ page }) => {
    await stubGitHubApi(page, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            name: 'checker-fixture-repo',
            full_name: 'tyklol/checker-fixture-repo',
            html_url: 'https://github.com/tyklol/checker-fixture-repo',
            description: 'Fixture repo injected by the checker',
            language: 'TypeScript',
            stargazers_count: 7,
            fork: false,
            private: false,
          },
        ]),
      }),
    );
    await page.goto('./');
    await expect(page.locator('#repos')).toContainText('checker-fixture-repo');
    await expect(page.locator('#repos a[href*="/checker-fixture-repo"]')).not.toHaveCount(0);
  });

  test('shows a plain message when there are no repos', async ({ page }) => {
    await stubGitHubApi(page, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
    await page.goto('./', { waitUntil: 'networkidle' });
    await expect(page.locator('#repos')).toBeVisible();
    await expect(page.locator('#repos')).not.toHaveText(/^\s*$/);
    expect(await countRepoLinks(page), 'no repo cards expected').toBe(0);
  });

  test('shows a plain message when the fetch fails', async ({ page }) => {
    await stubGitHubApi(page, (route) => route.abort('failed'));
    await page.goto('./', { waitUntil: 'networkidle' });
    await expect(page.locator('#repos')).toBeVisible();
    await expect(page.locator('#repos')).not.toHaveText(/^\s*$/);
    expect(await countRepoLinks(page), 'no repo cards expected').toBe(0);
  });
});

// SPEC.md line 7: "#hero, #contact contain links to email, GitHub and LinkedIn."
for (const section of ['hero', 'contact']) {
  test(`SPEC L7: #${section} links to email, GitHub and LinkedIn`, async ({ page }) => {
    await page.goto('./');
    const s = page.locator(`#${section}`);
    await expect(s.locator('a[href^="mailto:"]'), 'email link').not.toHaveCount(0);
    await expect(s.locator('a[href*="github.com"]'), 'GitHub link').not.toHaveCount(0);
    await expect(s.locator('a[href*="linkedin.com"]'), 'LinkedIn link').not.toHaveCount(0);
  });
}
