# Monthly Market Update — editing guide

For Geoff. About 20 minutes once the infographics are ready.

You only ever change **text, numbers, links and images.** Spacing, type, colour and layout are built into the template and cannot be knocked out of place.

## What's in this folder

- `smith-dobrowsky-market-update.html` — the template to import into Mailchimp
- `images/` — logos, headshot and map used by the template
- `images/burlington-market-intelligence.png`, `images/hamilton-market-intelligence.png` — last month's infographics, replace each month

## One-time setup in Mailchimp

1. Upload everything in `images/` to **Content → Content Studio**.
2. **Content → Email templates → Create → Code your own → Import HTML**, upload the HTML file, name it *SD Monthly Market Update*.
3. Click each image once and re-select it from Content Studio so it points at Mailchimp's hosted copy.
4. Save. From then on: **Create → Email → Saved templates → SD Monthly Market Update**.

Merge tags are already in place — do not retype them: `*|ARCHIVE|*`, `*|LIST:ADDRESS|*`, `*|UPDATE_PROFILE|*`, `*|UNSUB|*`, `*|MC:SUBJECT|*`. The greeting fills in the first name and falls back gracefully:

```
*|IF:FNAME|*Hello *|FNAME|*,*|ELSE:|*Hello,*|END:IF|*
```

## The sections, top to bottom

| Section | What it does | Each month |
|---|---|---|
| Preview sentence | The line shown in the inbox | **Replace this month** |
| Branded header | Logo and view-in-browser link | Do not edit |
| Opening message | Month label, greeting, two paragraphs | **Replace this month** |
| This month's key numbers | Four numbers with labels | **Replace this month** |
| Burlington market update | Name, month, headline, three numbers, written summary | **Replace this month** |
| Burlington infographic | Image, alt text, short summary, link, report button | **Replace this month** |
| Hamilton market update | Same as Burlington | Replace, or *optional — hide if unused* |
| Hamilton infographic | Same as Burlington | Replace, or *optional — hide if unused* |
| Geoff's perspective | Your read on the month | **Replace this month** |
| Local insight | Map, heading, one paragraph | Optional — replace paragraph or hide |
| Contact Geoff | Heading, sentence, Talk to Geoff button | Do not edit |
| Permanent footer | Contact, branding, social, legal, unsubscribe | Do not edit |

Each of the four market sections has its own **Hide** control. Hide *Hamilton market update* and *Hamilton infographic* together to publish a Burlington-only issue — the email still looks finished. The same works in reverse.

Everything listed as editable is a proper Mailchimp editable region, so it can all be changed in the campaign editor without touching code.

## How much to write

| Section | Aim for | Ceiling |
|---|---|---|
| Preview sentence | 12–18 words | 100 characters |
| Month label | e.g. "August 2026 · Market Update" | 5 words |
| Opening message | 55–75 words, two paragraphs | 90 words |
| Each key number | Number + short label + 4-word note | 6 words on the note |
| Market headline | 8–12 words, one full sentence | 14 words |
| Written market summary | 150–200 words, three paragraphs, each starting with a **bolded finding** | 200 words |
| Infographic summary | 25–40 words — what the graphic shows and the one thing it proves | 50 words |
| Geoff's perspective | 25–35 word lead line, then 45–60 words | 100 words |
| Local insight paragraph | 40–60 words — name a specific street, pocket or comparison | 70 words |

## Images

- **Market infographics** — 1280 px wide, any height, under 800 KB. They display full-width. Always leave them linked to the full report.
- **Alt text** — write it as a sentence naming the city, the month and what tapping gives them: *"Burlington Market Intelligence, June 2026 — market dashboard, scorecard and Market Balance Index. Tap to open the full-resolution report."*
- **Headshot** — 300 × 300 px minimum, square.
- **Map and logos** — permanent. Do not replace.

## Monthly checklist

- [ ] Preview sentence rewritten
- [ ] Month label updated
- [ ] Opening message rewritten — two paragraphs, sounds like you
- [ ] Four key numbers updated, and the month in their heading
- [ ] Burlington: month, headline, three numbers, written summary
- [ ] Burlington infographic replaced, alt text updated, summary rewritten, links checked
- [ ] Hamilton: same four items — or both Hamilton sections hidden
- [ ] Geoff's perspective rewritten
- [ ] Local insight paragraph tied to this month's findings (or section hidden)
- [ ] Numbers in the writing match the infographics
- [ ] Subject line and preview text set in Mailchimp
- [ ] Test sent to yourself and checked on your phone
- [ ] Footer untouched — address and unsubscribe still there

## Writing the market sections

Three short paragraphs, each opening with a **bolded finding** in plain language — *"Competition is returning, not prices."* The sentences after it support that finding with two or three numbers, no more.

The infographic already carries the full tables. Don't restate them: pick the two or three numbers that make the argument and leave the rest to the graphic.

Geoff's perspective is the centrepiece, not a sidebar. One sentence of judgement in the large serif, then a short paragraph translating it for a buyer and a seller.

## When images don't load

Every heading, number, finding, button and infographic summary is real text, so the email still makes its case with images switched off — and on a phone, where the infographic type is too small to read, the written summary underneath carries it. That's why the summary under each graphic matters more than it looks.
