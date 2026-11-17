# clinmaker.com

The ClinMaker marketing site: static HTML, CSS and JavaScript, published by GitHub Pages from `main`.

## Branches

- **`main`** is the live site at clinmaker.com. Whatever is on `main` is published.
- **`site-v6`** holds the v7 redesign. It replaces the live site in one cutover once the design is final.

## Preview locally

From the repository root:

```sh
python3 -m http.server 8790
```

Then open http://localhost:8790/. Open http://localhost:8790/heroes.html to compare the home-page hero options:
E is the current `index.html`; F, B, D and A are `index-f.html`, `index-b.html`, `index-d.html` and `index-a.html`. `index-b2.html` is B with the amendment scroll story (`assets/story.css`, `assets/story.js`) after "What ClinMaker gives sponsors and CROs".

After changing `assets/v7.css` or `assets/v7.js`, bump the `?v=` tag on every page so browsers load the new file.

## Placeholder check

`.githooks/check-placeholders.sh` lists placeholder text still in the pages (`[to add …]`, `[to confirm …]`,
unfilled tokens such as `__FORMSPREE_ENDPOINT__`, including hidden `data-todo` blocks), and the draft hero pages.
It runs before every push to `main` and on pull requests into `main`. Turn the hook on once per clone:

```sh
git config core.hooksPath .githooks
```

## Before v7 goes live

1. Connect the request form to a form service delivering to contact@clinmaker.com, and send one test request.
2. Fill the Trust page facts (hosting, subprocessors, AI provider terms, encryption) and the counsel's wording for Privacy and Terms.
3. Move hero B (the team's pick, `index-b.html`, with the use cases straight after the hero) into `index.html`, and delete `heroes.html`, the `index-*.html` drafts and `assets/hero-*` except the B files it needs. If the team keeps the amendment story, start from `index-b2.html` instead and keep `assets/story.*`.
4. Get the placeholder check passing, add redirects from the old page addresses, and review on desktop and phone.

## Design decisions so far

- Light theme only. Inter for headings, Host Grotesk for body text, IBM Plex Mono for data.
- Real product screens from the demo study, with study identifiers kept out of frame. No stock imagery.
- Keep text light, especially on the home page. Every product claim is checked against the platform code.
- Status labels are "Ready to demo" and "In development". No "AI-powered", "validated" or speed claims.
- "Request a Protocol Teardown" is the main call to action, with the pilot second. The order everywhere is demo, Teardown, pilot.
- Card rails show three cards with the next one peeking in, a dark dot pill with play/pause, and auto-advance that pauses on hover, focus or off screen.
- One motion system: tokens in `:root` of `assets/v7.css`, scroll reveals in `assets/v7.js`, and nothing moves under reduced motion.
- Founders: Sunish Raj (Founder & CEO), Matthew Marshall (Co-Founder & COO), Kamal Chadha (Co-Founder & CTO).
- Contact address: contact@clinmaker.com.
- No pricing on the website. `pricing.html` only redirects old links to the request form with a quote selected.
