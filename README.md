# Brad Partners — Landing Page

Single-page, high-conversion landing for **Book Strategy Call**. Minimal, executive design (acquisition.com style). All primary CTAs scroll to the Calendly embed.

## Run locally

```bash
cd landing-page
python3 -m http.server 8000
```

Open **http://localhost:8000**.

## Calendly

Replace the iframe `src` in `index.html` (search for `calendly.com/YOUR_USERNAME`) with your Calendly scheduling URL, e.g.:

`https://calendly.com/your-username/strategy-call?hide_gdpr_banner=1`

## Customize

- **Colors**: In `styles.css`, edit `:root` to match bradpartners.com (`--accent`, `--text`, `--bg`).
- **Copy**: All section content is in `index.html`; edit headlines, body text, and lists as needed.
- **Testimonials**: Replace the placeholder in the About section with real quotes.

No build step. Deploy to any static host (Netlify, Vercel, etc.).
