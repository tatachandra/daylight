# Daylight

A personal news, meals and fitness web app built with Vinext and React, deployed with Sites.

[Open the live Daylight website](https://daylight-personal-news.d55rbvzrks.chatgpt.site)

This repository is a source snapshot of the published app. The live website continues to run on Sites; pushing here does not automatically deploy it.

## Current features
- Original linked headlines from BBC News and The Economic Times RSS feeds.
- World, Technology, AI, U.S. markets, and India markets views.
- Browser-local topic preferences; the news feed remains public.
- Past-seven-days filter, publication dates with timezone, refresh every five minutes while visible.
- Graceful partial-feed failures and cached fallback within a running server isolate.
- Oat cream background, white article cards and authentic publisher-provided images.
- Accessible topic and preference controls; responsive desktop and mobile layout.
- Device-local dates and times, including daylight-saving changes and daily log dates.
- WebMCP read_current_news and set_news_interests when the browser supports them.

- Private Meals & Fitness tab with ChatGPT sign-in, D1 meal/portion/activity logs, editable goals and dietary exclusions.
- USDA reference estimates for protein, fiber, magnesium, 13 vitamins (with documented form limits), amino acids, energy and other nutrients. Missing values remain unknown and each nutrient reports food coverage.
- Seven-day food-log review and deterministic meal combinations ranked against logged protein, fiber and magnesium. No deficiency diagnosis or inferred intake on unlogged days.
- Manual workout minutes, steps and user-reported calorie estimates. No Fitbit/phone-health connection yet.

No OpenAI API or other paid API is used. This release has no notifications, AI-generated summaries, or live stock-gainer rankings.

## Nutrition data and privacy
The server-only catalog contains 7,793 USDA SR Legacy foods (April 2018 release) and 469 primary Foundation Foods (April 2026 release), from https://fdc.nal.usda.gov/download-datasets/. Values are per 100 grams of edible food; portions preserve their original quantity and gram weight. Negative calculated carbohydrate values are omitted, explicit zeros retained, missing values omitted. Biotin and amino-acid coverage varies. K1 is not all vitamin K; niacin is not niacin equivalents. General references are FDA label Daily Values, not personalized prescriptions.

Every private API request checks dispatch-provided ChatGPT identity. All SQL reads and writes bind the authenticated user ID; caller-supplied identity fields are rejected. Private API responses use no-store. Logs are never stored in browser localStorage. Search queries use the bundled public USDA dataset and no third-party nutrition API. Production account isolation depends on the Sites dispatcher stripping untrusted identity headers.

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
```

## Hosting your own copy

The live deployment identifier has been removed from this export. To deploy a separate copy, configure a new Sites project and its database binding. Production sign-in relies on the Sites identity gateway; another hosting setup must replace that trusted identity integration before exposing private log routes.

Local runtime files, environment secrets, private database contents and user logs are not included in this repository. News photos remain at their original publishers rather than being bundled here. Existing third-party license notices and data-source attribution are included.
