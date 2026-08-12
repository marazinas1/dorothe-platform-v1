# Seed datasets

Two kinds of files live here, and they must never be mixed:

1. **Client seeds** (`de-<name>.sql`) — the real configuration for one client:
   site name, legal name, country, locales, design tokens, contact details,
   credentials, homepage composition. They update the single `site_settings`
   row in place and create **no listings**. A real client enters their own
   properties through the admin panel.
2. **Demo listings** (`demo-listings.sql`) — invented properties used only to
   show a fresh clone to a prospect. Fictional content: never run this against
   a real client's database. Running it wipes `listings`, `listing_images`,
   `listing_documents`, `listing_tours` and `inquiries` first.

Feature flags, profiles, roles and permissions are never touched by any seed.

## Available files

- `de-waltner.sql` — client config: Immobilienberatung Dorothe Waltner, solo
  broker in Püttlingen (Saarland), English default with German second.
- `de-rheinberger.sql` — demo prospect dataset (agency, includes listings).
- `demo-listings.sql` — optional fictional listings for the Saarland area.

## Setting up a real client

1. Copy the closest client seed and rename it (`de-<name>.sql`).
2. Fill the `UPDATE public.site_settings` block: identity, locales, design
   tokens (colours, font registry keys, radius/button style), contact, address,
   geo, homepage sections, credibility stats, qualifications, legal texts.
3. Run it against the client's own database. Do **not** run
   `demo-listings.sql`.
4. Upload brand assets to the `site-assets` bucket and point the URLs at them.
5. Toggle `feature_flags` for the modules sold, create the owner user.

## Showing a populated demo

Run a client seed for the look, then `demo-listings.sql` on top. Remove the
demo listings again before the site goes live for that client.

Never edit application code to customise a single client. If a client needs a
change a seed cannot express, the schema is missing a column — extend
`site_settings` or the relevant table with a migration first, then use the new
field from the seed.
