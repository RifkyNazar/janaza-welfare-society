# Homepage redesign handoff

Local frontend changes only. No schema, migration, environment, integration, or permission changes.

## Public content

- Operations: published records, latest 12, with photos restricted to approved task photos. Existing detail routes retained.
- Leadership: existing leadershipTeam order and photo mapping retained verbatim.
- Vehicles: active and public records only; public image helper retained. Cards link to anchors on the existing fleet page because there is no public vehicle detail route.
- Advertisements: existing active/scheduled query and stored-image existence checks unchanged. Images use contain to preserve advertisement text.
- Employee showcase: no employee query or employee-photo route is used. The default is an informational state.

## Future approved team gallery

CommunityShowcaseClient accepts publicTeam: PublicTeamPortrait[]. Each item has id, imageSrc and optional public-approved name and role. Supply an explicitly curated collection from the server component only after publication approval. Never derive this list from employeeProfile or reuse private upload routes. Keep approval records outside this presentation layer. Empty input remains the informational state.

The PortraitRail supports large collections, lazy Next images, native swipe, focusable links, and automatic scrolling. The full-gallery link currently points to the existing team page. When portraits are approved, integrate the same curated collection into that page for full details; the existing team page and its privacy rules were not changed by this redesign.

## Motion

- Category and advertisement interval: 1000ms; entry transitions: 280ms.
- Hero: stepped headline mask 950ms, image focus 1000ms, text 700ms, button transforms staggered by 100ms. Essential actions remain visible and usable throughout.
- Section headings: 700ms mask; paragraphs/cards: 700ms upward reveal; images: 700ms blur-to-focus. Intersection Observer triggers each once without hiding server-rendered content.
- Rails: 25px per second moving right to left; reset at the end, no clones. Native overflow scrolling and manual navigation retained. This is a restart loop rather than a seamless clone loop.
- Hover/focus suspend rotation; touch pauses until play; hidden documents suspend motion. Continuous rails also suspend outside the viewport. Reduced motion disables automatic rotation and transitions; manual navigation remains available.

## Verification

Run npx tsc --noEmit, npm run lint, npm run build and git diff --check. Connected browser inventory was empty and the in-app browser was unavailable. No desktop/mobile visual, touch, keyboard, or reduced-motion browser tests are claimed. The production build validates compilation, not live database content or end-to-end service workflows. Review at 320, 375, 390, 430px, tablet and desktop before release.
