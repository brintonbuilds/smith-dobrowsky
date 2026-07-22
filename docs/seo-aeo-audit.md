# Smith-Dobrowsky Technical SEO and AEO Audit

Audit date: 2026-07-21  
Current public base URL: `https://brintonbuilds.github.io/smith-dobrowsky`  
Domain status: temporary GitHub Pages preview; final production domain is not confirmed

## Executive Summary

The site now has a complete technical SEO and answer-engine foundation across all six canonical public pages. Each page has a distinct search purpose, unique title and description, an absolute canonical URL, Open Graph and social metadata, one H1, source-level navigation, stable image dimensions, and valid JSON-LD.

The entity graph establishes one consistent identity for the Smith Dobrowsky Team, Geoff Smith, Katrinna Smith-Dobrowsky, Coldwell Banker Burnhill Realty, and the Burlington-Hamilton-Waterdown service region. Buyer and seller pages are connected to accurate regional service entities. Local Insight is represented as a collection of three community guides without inventing FAQ, review, rating, property, or unsupported local-business data.

Approved visible copy on the six existing pages was preserved exactly. The implementation changed metadata, semantics, crawlability, assets, and machine-readable relationships. The only new visible page is the required branded 404.

## Current Page Inventory

| Page | Canonical URL | Purpose | Primary search intent | Indexing |
|---|---|---|---|---|
| Home | `/` | Establish the team, Geoff, local positioning, and regional scope | Smith Dobrowsky Team; Geoff Smith; Burlington-Hamilton real estate guidance | Index |
| Listings | `/listings.html` | Curate current opportunities and demonstrate representation record | Smith Dobrowsky listings; represented homes; regional property representation | Index |
| Buyers | `/buyers.html` | Explain regional buyer guidance and decision support | buying a home in Burlington, Hamilton, or Waterdown; regional buyer guidance | Index |
| Sellers | `/sellers.html` | Explain preparation, pricing, presentation, negotiation, and timing | selling a home in Burlington, Hamilton, or Waterdown; regional seller guidance | Index |
| Local Insight | `/local-insight.html` | Provide current street-level context for three communities | Burlington market insight; Hamilton market insight; Waterdown local guidance | Index |
| Contact | `/contact.html` | Provide direct contact with Geoff and trust validation | contact Geoff Smith; Smith Dobrowsky phone and email | Index |
| Error | `/404.html` | Recover users from missing URLs | None | `noindex,follow`; excluded from sitemap |

No about page, dedicated Geoff page, legal page, article archive, neighbourhood page, or canonical city page exists. No public route is orphaned: every canonical page is linked from the source-level primary navigation and footer.

## Search-Intent Map

| Intent cluster | Existing destination | Role and boundary |
|---|---|---|
| Smith Dobrowsky branded searches | Home | Definitive team identity and overall regional positioning |
| Geoff Smith branded searches | Home and Contact | Home builds trust; Contact owns direct-contact intent |
| Burlington, Hamilton, and Waterdown real estate guidance | Home | Regional overview only; should not compete with future city pages |
| Regional buyer guidance | Buyers | Owns process, risk reduction, neighbourhood evaluation, and offer guidance |
| Regional seller guidance | Sellers | Owns preparation, pricing, presentation, launch, negotiation, and timing |
| Current properties and representation record | Listings | Curated opportunities and proof; Odyssey remains the property-detail destination |
| Current local-market interpretation | Local Insight | Monthly or periodic community intelligence, not an evergreen generic blog |
| Contact and trust validation | Contact | Geoff's direct phone, email, form, service area, and team image |

The existing site should not create separate pages for keyword variations such as "Burlington realtor," "realtor Burlington," and "Burlington real estate agent." One future definitive Burlington page should serve that geographic intent with original local guidance.

## Existing Page-to-Query Mapping

- Home: team and Geoff brand queries; calm regional real estate guidance; Burlington-Hamilton-Waterdown awareness.
- Listings: team listings, current opportunities, represented homes, and regional representation history.
- Buyers: regional home-buying guidance, buyer process, neighbourhood evaluation, offer protection, and decision confidence.
- Sellers: regional home-selling guidance, preparation, pricing, presentation, launch, negotiation, and sale timing.
- Local Insight: street-level Burlington, Hamilton, and Waterdown market interpretation and current market context.
- Contact: Geoff Smith contact information, team contact information, phone, email, and consultation intent.

## Burlington, Hamilton, and Waterdown Architecture

The homepage remains the regional overview. Buyer and seller pages remain transactional-guidance pages. Local Insight remains the changing market-intelligence layer. Future city pages should be evergreen local decision guides.

Recommended structure:

```text
/
├── buyers.html
├── sellers.html
├── listings.html
├── local-insight.html
├── contact.html
└── communities/
    ├── burlington/
    ├── hamilton/
    └── waterdown/
```

Waterdown should be its own local market page, while its relationship to the broader Hamilton region is explained naturally. It should not be a duplicated Hamilton page with city names replaced.

## Technical SEO Findings

Initial findings:

- No canonical tags, Open Graph metadata, Twitter metadata, structured data, sitemap, robots file, or 404 page.
- Primary navigation links were generated with `document.write`, leaving them absent from the original HTML source.
- The homepage description contained an unverified and conflicting experience-year claim.
- Most images lacked explicit dimensions, increasing layout-shift risk.
- Large photographic PNG files were used below the fold and in interactive process sections.
- The main stylesheet duplicated the Google Fonts request already present in each document head.
- Six privacy-policy links pointed to `#`, creating dead links and misleading interaction.
- Several Local Insight headings skipped directly to H5; listings community names were paragraphs despite heading sections.
- There was no automated check for title duplication, canonicals, H1 counts, JSON-LD syntax, broken links, missing anchors, or image attributes.

## Technical Changes Implemented

- Added unique page titles and calm, page-specific meta descriptions to all six public pages.
- Removed the conflicting year claim from homepage metadata; visible copy was not changed.
- Added `index,follow,max-image-preview:large` to public pages and `noindex,follow` to the 404.
- Added absolute canonicals for the current public base URL.
- Added Open Graph and large-image social metadata with accurate image alternatives and dimensions.
- Replaced JavaScript-generated primary navigation with crawlable source HTML; retained shared JavaScript only for behaviour.
- Added `aria-current="page"` to the active source navigation at runtime.
- Added intrinsic width and height to every HTML image.
- Added eager loading, preload, and high fetch priority to hero images; retained lazy loading below the fold.
- Deferred noninitial homepage carousel downloads and reused the source hero image instead of replacing it immediately.
- Re-encoded rendered photographic assets as WebP. The optimized variants total 5.84 MB versus 49.95 MB for their source equivalents, an 88.3% reduction across that conversion set.
- Replaced the rendered 80px preloader mark with a lossless 160px WebP: 9.1 KB versus the previous 1.4 MB source PNG. The original artwork remains in the repository.
- Removed the duplicate font import from `css/styles.css`.
- Corrected Local Insight heading levels and changed listings community labels to semantic H3 elements without changing their appearance or wording.
- Removed dead `href="#"` privacy links while preserving the visible label. A real privacy page remains a launch requirement.
- Added a branded `404.html`, excluded from the sitemap and marked `noindex,follow`.
- Added `site.config.json`, sitemap/robots generation, base-URL migration tooling, and a dependency-free site validator.

## Canonical and Deployment Architecture

`site.config.json` is the source of truth for the current public base URL and canonical page inventory. `scripts/generate-seo-files.mjs` generates `sitemap.xml` and `robots.txt`. `scripts/set-public-base-url.mjs` replaces the temporary GitHub Pages base URL in all canonical, social, schema, sitemap, and robots references when the final domain is confirmed.

The current GitHub Pages project URL is used because it is the only verified public origin. It is explicitly marked as temporary in configuration. Before a custom-domain launch, run:

```bash
node scripts/set-public-base-url.mjs https://final-domain.example
node scripts/generate-seo-files.mjs
node scripts/validate-site.mjs
```

Important GitHub Pages limitation: a robots file at `/smith-dobrowsky/robots.txt` is not authoritative for the shared `brintonbuilds.github.io` host. Robots rules apply only from the host root. The file is ready for a custom-domain root, while page-level robots metadata is active now. The sitemap itself remains valid and can be submitted directly.

## Local Entity Findings

Verified and implemented:

- Team name: The Smith Dobrowsky Team.
- People named visibly: Geoff Smith and Katrinna Smith-Dobrowsky.
- Phone: `+1-905-639-3355`.
- Email: `geoff@yourrealpro.com`.
- Brokerage displayed in the footer: Coldwell Banker Burnhill Realty, Brokerage.
- Brokerage address displayed in the footer: 514 Guelph Line, Burlington, ON L7R 3M4.
- Verified social profile present in the source: Instagram account `smith_dobrowsky_team`.
- Core service areas supported throughout visible content: Burlington, Hamilton, and Waterdown.

The brokerage address is assigned only to the brokerage entity, not silently reclassified as the team's own business location.

## Structured-Data Inventory

| Entity | Scope | Notes |
|---|---|---|
| `RealEstateAgent` | All public pages | Team identity, phone, email, members, and supported service areas |
| `Person` | All public pages | Geoff; Katrinna is included where the full team graph is present |
| `Organization` | Home | Brokerage entity and visible brokerage address |
| `WebSite` | All public pages | Stable site identity and publisher relationship |
| `WebPage` | Home, Buyers, Sellers | Page identity and relationship to the site |
| `CollectionPage` | Listings, Local Insight | Accurate collection-level classification |
| `ContactPage` | Contact | Direct contact page with the team as main entity |
| `Service` | Buyers, Sellers | Home buying and selling guidance with team provider and service areas |
| `ItemList` | Local Insight | Burlington, Hamilton, and Waterdown community guides |
| `City` / `Place` | Regional entities | Burlington and Hamilton as cities; Waterdown as a place to avoid misclassification |
| `BreadcrumbList` | Interior pages | Home-to-section hierarchy matching the site's source navigation |
| `ImageObject` | Applicable pages | Logo, team image, and primary page images with dimensions |

No `FAQPage`, `Review`, `AggregateRating`, `PostalAddress` for the team, opening hours, coordinates, award, credential, property, listing, or social-profile claim was fabricated.

## AEO Foundation Implemented

- Stable names and `@id` relationships connect Geoff, Katrinna, the team, brokerage, website, services, places, and pages.
- Existing buyer and seller question sections remain readable static HTML with corrected heading associations.
- Local Insight is machine-readable as a three-community collection while its actual visible market commentary remains the source of truth.
- Page purpose is explicit through type, title, description, headings, and `mainEntity`/`about` relationships.
- Geographic signals are consistent across metadata, visible content, links, and schema.
- Navigation and body content are crawlable without requiring JavaScript execution.
- Existing call-to-action links clarify relationships among regional guidance, local insight, listings, and contact.

## AEO Opportunities Requiring Future Content

These opportunities require visible, owner-approved content and were not published:

| User question | Best page | Why current content is insufficient | Recommended format | Intent |
|---|---|---|---|---|
| Who is Geoff Smith, and how does he advise clients? | Future Geoff/About page | Geoff is the trust anchor, but no complete verified biography exists | Concise profile with specific working philosophy and verified professional facts | Brand and trust validation |
| How does Geoff distinguish one Burlington street from another? | Future Burlington page | The philosophy is visible, but Burlington-specific examples are not | Evergreen local guide with original examples | Burlington local decision intent |
| How do Hamilton's submarkets differ for buyers and sellers? | Future Hamilton page | Current monthly data does not provide an evergreen geographic orientation | Evergreen guide organized by real decision factors | Hamilton local decision intent |
| What makes Waterdown distinct from Hamilton and Burlington? | Future Waterdown page | Current content gives a broad description but not enough original local detail | Focused local-market guide | Waterdown local decision intent |
| Where do the monthly figures and Market Balance Index inputs come from? | Local Insight | Methodology is summarized, but source attribution and update governance are incomplete | Short visible methodology and source note | Trust, accuracy, and citation readiness |
| What happens after someone submits the contact form? | Contact | The page explains who replies but not the operational handling or privacy terms | Short privacy/process note linked to a real privacy policy | Contact trust and compliance |

Do not add FAQ schema unless qualifying visible question-and-answer content is approved and current search-engine eligibility supports its use. FAQ schema is not necessary for AEO.

## Performance and Accessibility Findings

Implemented:

- Hero resources are discoverable in the head and use high fetch priority.
- Below-fold assets use lazy loading and asynchronous decoding.
- Every HTML image has intrinsic dimensions.
- Heavy rendered assets use compressed WebP variants; source assets remain available in the repository.
- Homepage carousel slides after the first are not requested immediately.
- Duplicate font loading was removed.
- Primary navigation is present in source HTML and remains keyboard operable.
- The mobile-menu toggle has `type="button"`, `aria-controls`, `aria-expanded`, and an explicit label.
- Current-page navigation state is exposed with `aria-current`.
- Contact inputs retain explicit labels and native required/email semantics.
- Decorative images use empty alternatives or hidden containers; meaningful team and property images retain descriptive alternatives.
- Semantic heading levels were corrected without visual changes.
- Small editorial and legal text now meets WCAG AA contrast in the tested mobile viewport, and the Instagram link's accessible name includes its visible handle.

Final local Lighthouse mobile lab result for the homepage:

| Category / metric | Result |
|---|---:|
| SEO | 100 |
| Accessibility | 100 |
| Best Practices | 100 |
| Performance | 61 |
| First Contentful Paint | 5.4 s |
| Largest Contentful Paint | 12.7 s |
| Cumulative Layout Shift | 0 |
| Total Blocking Time | 0 ms |

This was measured through a local Python HTTP server, which does not reproduce GitHub Pages compression or production caching. The late LCP is also influenced by the approved preloader and an autoplay carousel producing later paint candidates. Treat these values as a reproducible local lab baseline, not field Core Web Vitals.

Remaining performance considerations:

- Google Fonts are still third-party render dependencies. Self-hosting would require font-file licensing and approval.
- The CSS files are large and contain historical rules. A safe unused-CSS reduction requires a separate visual regression project.
- The homepage preloader delays perceived access to the hero. It was preserved because it is part of the approved experience.
- The homepage carousel can produce a late LCP candidate in unattended lab tests. Changing its start behaviour should be reviewed as a visual/interaction decision, not made silently as an SEO edit.
- Field Core Web Vitals require real-user data after deployment; lab results do not guarantee field performance.

## Before-and-After Validation

| Check | Before | After |
|---|---:|---:|
| Canonical public pages | 0 of 6 | 6 of 6 |
| Unique titles | Present but not systematically mapped | 6 of 6 unique and intent-specific |
| Unique meta descriptions | Present but one contained conflicting data | 6 of 6 unique and verified |
| One H1 per canonical page | 6 of 6 | 6 of 6 |
| Source-level primary navigation | 0 of 6 | 6 of 6 |
| JSON-LD graphs | 0 | 6 valid graphs |
| Images with explicit width and height | 1 preloader image plus injected logo | All HTML images |
| XML sitemap | Missing | 6 canonical URLs |
| Robots file | Missing | Generated for current origin; host-root limitation documented |
| Branded 404 | Missing | Added with `noindex,follow` |
| Placeholder internal links | 6 | 0 |
| Automated site validator | Missing | Added and passing |
| Existing visible copy | Approved baseline | Exact match on all six existing pages |

Validation command:

```bash
node scripts/validate-site.mjs
```

The validator checks titles, descriptions, canonicals, H1s, main landmarks, source navigation, robots metadata, social metadata, JSON-LD syntax, image paths/alternatives/dimensions, internal links, fragment targets, sitemap parity, robots sitemap reference, and 404 indexing rules.

## Remaining Limitations

- The final production domain is not confirmed. Current absolute metadata targets the verified GitHub Pages preview and must be migrated before a custom-domain launch.
- The repository cannot place an authoritative robots file at `https://brintonbuilds.github.io/robots.txt`; that requires control of the host-root site or a custom domain.
- GitHub Pages does not provide application-level redirects in this static repository. Domain migration and legacy URL redirects require DNS/hosting configuration.
- The footer shows "Privacy Policy," but no policy content or destination exists. It is rendered as text instead of a dead link.
- Search Console, Bing Webmaster Tools, analytics, Business Profile, and external directory data were not accessed or changed.
- Structured-data validation here confirms JSON and entity consistency. Final production URLs should also be checked with Google's Rich Results Test and Schema.org Validator after deployment.
- No ranking, citation, lead, rich-result, or answer-engine inclusion outcome can be guaranteed.

## Missing Verified Business Information

Andrew or Geoff should confirm:

- Final production domain and preferred hostname.
- Exact legal/team business name, if different from the visible brand.
- Exact brokerage relationship language for the team and each person.
- Geoff's and Katrinna's current professional titles, licences, designations, and approved biographies.
- Whether the brokerage office address is also the public team contact address.
- Official Google Business Profile URL and verified NAP record.
- Any additional official social profiles.
- Public business hours, only if the team wants them published.
- Privacy policy text, privacy contact, form-data handling, and approved policy URL.
- Source attribution, methodology ownership, and update cadence for Local Insight statistics and the Market Balance Index.
- Analytics and consent requirements.

## Recommended Future Geographic Pages

### Burlington

- Recommended URL: `/communities/burlington/`
- Unique intent: evergreen Burlington real estate guidance and local trust validation.
- Purpose: help buyers and sellers understand how Burlington decisions change by street, housing type, and daily-life fit.
- Questions to answer: Which local factors most affect value and fit? How do established streets, condo/townhome pockets, and family areas differ? What should buyers inspect beyond the listing? What should sellers understand before positioning a home?
- Required local knowledge: Geoff's actual neighbourhood distinctions, recurring property factors, street-level examples, and decision patterns.
- Suggested internal links: Buyers, Sellers, Listings, Burlington tab in Local Insight, Contact. Link into it from the homepage map and Burlington mentions in the representation archive.
- Appropriate schema: `WebPage` about a `City`; optional `Article` only with verified author and dates. Do not create a separate Burlington `LocalBusiness` entity without a verified location.
- Cannibalization risk: medium with Local Insight. Keep this page evergreen; keep Local Insight current and date-specific.
- Information required from Geoff: neighbourhood boundaries he uses, specific street-level distinctions, common buyer mistakes, seller positioning factors, and examples he is comfortable publishing.

### Hamilton

- Recommended URL: `/communities/hamilton/`
- Unique intent: evergreen Hamilton real estate guidance across distinct local submarkets.
- Purpose: explain why broad Hamilton averages are insufficient for property decisions.
- Questions to answer: How do mountain, central, east-end, and other verified areas differ? Which property and street factors require extra context? How should buyers and sellers interpret neighbourhood-level variation?
- Required local knowledge: Geoff's actual service pockets, housing-stock differences, street-level risks, value signals, and decision examples.
- Suggested internal links: Buyers, Sellers, Listings, Hamilton tab in Local Insight, Contact. Link into it from the homepage map and Hamilton representation section.
- Appropriate schema: `WebPage` about a `City`; optional `Article` with verified authorship and dates.
- Cannibalization risk: medium with Hamilton Local Insight. Evergreen orientation belongs here; monthly conditions stay in Local Insight.
- Information required from Geoff: approved submarket framing, area boundaries, local trade-offs, property-condition patterns, and publishable examples.

### Waterdown

- Recommended URL: `/communities/waterdown/`
- Unique intent: Waterdown-specific local guidance, not a Hamilton keyword variation.
- Purpose: explain the village-connected and growth-area context that makes Waterdown a distinct decision set.
- Questions to answer: How do established village areas and newer development differ? What local housing and street factors matter? How should buyers weigh daily-life fit and commuting? What should sellers know about positioning for local demand?
- Required local knowledge: Geoff's verified distinctions between pockets, housing eras and types, buyer expectations, and property-specific considerations.
- Suggested internal links: Buyers, Sellers, Listings, Waterdown tab in Local Insight, Contact, and a contextual relationship to Hamilton without duplicating Hamilton copy.
- Appropriate schema: `WebPage` about a `Place`; do not classify Waterdown as a separate city in schema.
- Cannibalization risk: high if written as a Hamilton variant. The page must be distinctly Waterdown and use original local evidence.
- Information required from Geoff: local pocket definitions, growth-versus-village distinctions, common buyer questions, seller positioning issues, and publishable examples.

## Recommended Future Local-Insight Content

These are useful only when Geoff can supply original observations:

- "How two nearby streets can produce different real estate decisions" — a cornerstone explanation of the team's local-context philosophy.
- Burlington: an evidence-based comparison of established-street, condo/townhome, and family-pocket decision factors.
- Hamilton: a guide to interpreting submarket variation without relying on one citywide average.
- Waterdown: an original comparison of village-connected areas and newer growth areas.
- A recurring market update with visible source attribution, period covered, methodology, and a clear distinction between observed data and Geoff's interpretation.
- A buyer-focused local guide answering what Geoff checks before recommending a street.
- A seller-focused local guide answering which street and property details affect positioning.

Avoid generic market predictions, copied neighbourhood summaries, thin city pages, and high-volume keyword publishing.

## External Post-Launch Actions

1. Confirm the final domain and run the base-URL migration and validation scripts.
2. Ensure an authoritative root `robots.txt` is available on the final host.
3. Add and verify the final domain in Google Search Console and Bing Webmaster Tools.
4. Submit `sitemap.xml` and inspect all six canonical URLs.
5. Validate deployed JSON-LD with Google's Rich Results Test and Schema.org Validator.
6. Confirm the Google Business Profile, NAP consistency, brokerage relationship, and official social profiles.
7. Publish and link a legally reviewed privacy policy before treating the footer label as an interactive link.
8. Establish privacy-aware analytics and conversion measurement.
9. Monitor indexation, selected canonicals, crawl errors, branded queries, regional nonbrand queries, and Core Web Vitals after launch.
10. Review Local Insight dates and data-source disclosures on a defined editorial schedule.

## Official References

- [Google: canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google: build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google: title links](https://developers.google.com/search/docs/appearance/title-link)
- [Google: snippets and meta descriptions](https://developers.google.com/search/docs/appearance/snippet)
- [Google: organization structured data](https://developers.google.com/search/docs/appearance/structured-data/organization)
- [Google: general structured-data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- [Google: image SEO](https://developers.google.com/search/docs/appearance/google-images)
- [Google: robots file location](https://developers.google.com/crawling/docs/robots-txt/create-robots-txt)
- [Schema.org: RealEstateAgent](https://schema.org/RealEstateAgent)
- [web.dev: optimize Largest Contentful Paint](https://web.dev/articles/optimize-lcp)
- [web.dev: choose image compression](https://web.dev/articles/compress-images)
