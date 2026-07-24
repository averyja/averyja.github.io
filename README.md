# The Avery Lab website

This is a static site built for the existing `averyja.github.io` GitHub Pages workflow. There is no build step: GitHub serves the files directly after they are pushed to the repository's `main` branch.

## The three files you will usually edit

- `content/site-content.js` — lab description, research areas, people, links, contact details, and featured-publication keys.
- `publications.bib` — the editable publication list.
- `content/publications-data.js` — the browser-safe copy used by the site, including local previews. Keep it synchronized with `publications.bib` when publications change.
- `assets/` — the stylesheet and site behavior. Existing logo and headshot files in your repository can remain in place.

The page structure lives in `index.html`, but routine content updates should not require editing it.

## Add a publication

Paste a normal BibTeX entry into both `publications.bib` and the BibTeX string in `content/publications-data.js`. The site reads the citation key, title, authors, year, journal, volume, issue, pages, DOI, and URL when available. If the entry includes a `doi` field, the paper link appears automatically.

```bibtex
@article{avery2026example,
  title   = {Example article title},
  author  = {Avery, Jason A and Collaborator, Casey},
  journal = {Example Journal},
  year    = {2026},
  volume  = {12},
  pages   = {100--112},
  doi     = {10.0000/example}
}
```

To feature a publication in the “Start here” row, add its citation key to `featuredPublicationKeys` in `content/site-content.js`.

## Add or update a lab member

Edit the `people` array in `content/site-content.js`. Each person can have a name, role, image URL, short bio, and any number of links. Copying an existing person block is the easiest template.

## Publish through GitHub Pages

Replace the corresponding files in the `averyja.github.io` repository, commit the changes, and push to `main` as usual. GitHub Pages will publish the update without an additional framework or deployment service.

## Included improvements

- Responsive layout from small phones through wide desktop screens.
- Sticky, section-aware navigation with an accessible mobile menu.
- Searchable publications with topic/year filters, sorting, featured papers, and DOI links.
- Separate content, styles, and behavior for easier maintenance.
- Reduced-motion support and keyboard-friendly controls.
