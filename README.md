# [My Day Harbor](https://mydayharbor.com/)

A public, noncommercial personal news, wellbeing and growth website built with Vinext and React, deployed with Sites.

Live website: [mydayharbor.com](https://mydayharbor.com/) · [www.mydayharbor.com](https://www.mydayharbor.com/)

The GitHub repository contains the website source. The live website runs on Sites; pushing to GitHub does not automatically deploy it.

## Current features
- Original linked headlines from BBC News and The Economic Times RSS feeds.
- World, Technology, AI, U.S. markets, and India markets views.
- News → Tech Leaders shows posts mentioning any of 33 named leaders, with a person selector and technology filters. It uses free Google News RSS searches and matching posts from OpenAI, Google AI, NVIDIA and Microsoft feeds; no X API or AI model is called.
- Tech Leaders keeps original publisher attribution, labels company posts separately from reporting, and shows original publication times. It matches names in headlines, source excerpts or author fields, not company affiliation alone. Coverage can be incomplete and automatic matching can make mistakes; these are not imported personal X posts.
- Tech Leaders uses source-attached article images when available, otherwise an identified Wikimedia Commons portrait of the relevant leader with photographer and license links. Portraits are labeled separately from article photos; missing or failed images are omitted.
- Tech Leaders requests recent posts on page load and every five minutes while the page is visible, with per-source in-flight deduplication, five-minute caches, retained posts during partial failures and source health details. It is not an unattended background monitor. Some linked publishers have paywalls.
- Browser-local topic preferences; the news feed remains public.
- Past-seven-days filter, publication dates with timezone, refresh every five minutes while visible.
- Graceful partial-feed failures and cached fallback within a running server isolate.
- Oat cream background, white article cards, publisher-provided images and the Balanced Leaves logo.
- Accessible topic and preference controls; responsive desktop and mobile layout.
- Device-local dates and times, including daylight-saving changes and daily log dates.
- WebMCP read_current_news and set_news_interests when the browser supports them.
- Public Communities tab with eight external startup programs and networks, practical guides and a six-stage idea-to-launch path. Browsing requires no sign-in; participation happens on the linked organizations' websites.

- Private Fitness & Nutrition tab with ChatGPT sign-in, D1 meal/portion/activity logs, editable goals and dietary exclusions.
- USDA reference estimates for protein, fiber, magnesium, 13 vitamins (with documented form limits), amino acids, energy and other nutrients. Missing values remain unknown and each nutrient reports food coverage.
- Seven-day food-log review and deterministic meal combinations ranked against logged protein, fiber and magnesium. No deficiency diagnosis or inferred intake on unlogged days.
- Manual workout minutes, steps and user-reported calorie estimates. No Fitbit/phone-health connection yet.

No OpenAI API or other paid API is used. This release has no notifications, AI-generated summaries, or live stock-gainer rankings.

## Nutrition data and privacy
The server-only catalog contains 7,793 USDA SR Legacy foods (April 2018 release) and 469 primary Foundation Foods (April 2026 release), from https://fdc.nal.usda.gov/download-datasets/. Values are per 100 grams of edible food; portions preserve their original quantity and gram weight. Negative calculated carbohydrate values are omitted, explicit zeros retained, missing values omitted. Biotin and amino-acid coverage varies. K1 is not all vitamin K; niacin is not niacin equivalents. General references are FDA label Daily Values, not personalized prescriptions.

Every private API request checks a verified personal-account session or dispatch-provided ChatGPT identity. All SQL reads and writes bind the authenticated user ID; caller-supplied identity fields are rejected. Private API responses use no-store. Logs are never stored in browser localStorage. Search queries use the bundled public USDA dataset and no third-party nutrition API. Production account isolation depends on the Sites dispatcher stripping untrusted identity headers.

Generated D1 migrations are packaged with the site. Local test data lives only in the ignored `.wrangler` directory. Run `node scripts/check-wellness.mjs` for calculation and input-validation checks.

## Sources
- BBC RSS usage: https://www.bbc.co.uk/usingthebbc/terms/can-i-use-bbc-content/
- Economic Times RSS usage: https://economictimes.indiatimes.com/rss_index.cms

Keep original headline text and direct article links with linked publisher attribution. No advertising or commercial syndication is implemented. Recheck publisher permissions before adding either.

## Development
Use Node 22.13 or later and npm ci, then npm run dev. npm run build creates the Worker output. The Sites lifecycle scripts manage publication.

## Running the checks

```sh
node scripts/check-device-time.mjs
node scripts/check-wellness.mjs
node scripts/check-tech-leaders.mjs
```

## Hosting your own copy

The GitHub export omits the live deployment identifier. To deploy a separate copy, configure a new Sites project and its database binding. Personal accounts require the database tables, private authentication secret, verified email delivery, and canonical account URL. Legacy ChatGPT sign-in also relies on the Sites identity gateway; another host must remove or replace that gateway integration before exposing private log routes.

Local runtime files, environment secrets, private database contents and user logs are not included in the GitHub repository. News photos remain at their original publishers rather than being bundled here. Existing third-party license notices and data-source attribution are included.

## Fitness & Nutrition dashboard

The /wellness route now opens a light soft-surface dashboard with parallel weight reference lines, an account-private profile, inline workout/nutrition tabs and weekly check-ins. Profiles/reviews are stored under the fitness key in existing D1 wellness_settings JSON; no new migration is required. Legacy settings updates use JSON merge to preserve profiles.

Original three-week foundation routines reference all six user-supplied WeightTraining.guide and Muscle & Strength libraries. The routine uses equipment, experience, available days, time, recovery and logged strength sessions; linked publisher libraries retain their original instructions and are not republished wholesale.

Energy uses the Mifflin–St Jeor equation with approximate activity factors. Adult age/sex nutrient references derive from USDA DRI / NIH ODS; training protein targets are explicit product defaults within general sports-nutrition ranges. Health restrictions, unsupported ages, unspecified sex reference and weight/BMI bounds pause automatic targets. This is not condition-specific medical treatment or a guarantee of complete nutrition.

Vegan, Indian-inspired (only chicken/shrimp/fish meats) and American-style ingredient combinations are scaled using the existing USDA catalog. Logged meal slots are removed and remaining energy used only when logged energy coverage is complete. Food exclusions and source data gaps remain visible. Check food labels for allergy cross-contact.

Photo: Healthy Vegan Buddha Bowl by FitTasteTic, Wikimedia Commons, CC BY-SA 2.0. Resized and cropped for display. Source: https://commons.wikimedia.org/wiki/File:Healthy_Vegan_Buddha_Bowl.jpg . License: https://creativecommons.org/licenses/by-sa/2.0/ .

Validation: scripts/check-fitness.mjs exercises calculations, health gates, dietary restrictions, isolated D1 profile storage, ownership, CSRF and legacy-settings preservation; scripts/check-wellness.mjs covers portion and missing-nutrient calculations.

## Google sign-in

Status: implementation and isolated tests are ready; Google Console policy acceptance, OAuth client setup, and live sign-in verification are still pending.

Google OAuth uses the existing Better Auth/D1 account tables; no new database or paid identity service is required. Configure a Google **Web application** OAuth client with the exact redirect URI `https://mydayharbor.com/api/account/callback/google`. Add `GOOGLE_CLIENT_ID` and the secret `GOOGLE_CLIENT_SECRET` to Sites runtime settings and deploy to activate the button. Without both values, the existing email/password flow remains available. Keep Google Cloud billing disabled; only basic `openid`, `email`, and `profile` scopes are requested, with online access.

Google users do not need a separate username or site password. Verified Google identities are required. Existing email/password users must first sign in and explicitly connect the Google account with the same email; accounts and health logs are not merged by email. ChatGPT-linked data keeps its original owner. OAuth state, PKCE, callback validation, secure cookies, and token encryption are handled by Better Auth. Sign-in begins on the canonical account host so callback cookies are available there.

Validation: `scripts/check-google-accounts.mjs` exercises a complete isolated OAuth flow with synthetic signed Google responses, returning users, explicit linking, wrong-owner rejection, and invalid state/redirect rejection. A real Google browser sign-in still needs to be confirmed after configuration.
