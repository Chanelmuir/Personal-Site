---
name: "Concrete & Landscape Brothers"
tagline: "Two new websites for a pair of brother companies in Christchurch, one for concreting and one for landscaping, from first design sketch to live launch."
image: "/concrete_landscape_brothers.jpg"
links:
  - label: "Concrete Brothers"
    href: "https://concretebrothers.co.nz"
  - label: "Landscape Brothers"
    href: "https://landscapebrothers.co.nz"
tags: ["Next.js", "TypeScript", "Tailwind", "Sanity", "Vercel"]
order: 2
---

Concrete Brothers and Landscape Brothers are brother companies in Christchurch, two sides of the same business with a shared showroom. Their old WordPress sites were looking a little outdated, so I designed and built new ones for both, then took them through to launch.

## Designing two sites as one family

I started by looking at how other Christchurch trades sites look and work, then shaped a design direction with the owners. The two sites share one design system, a dark, warm base with a bold display typeface, and each gets its own accent colour to match their existing branding: red for concrete, green for landscaping. They read as one family while each keeps its own identity.

From there I built out the home pages, service pages, a project gallery with case studies, the showroom page, Our Story and contact, gathering photos, project stories and FAQs from the owners along the way.

## The build

Both sites are Next.js, rendered on the server so they load fast and search engines see everything. The pieces are shared between them: hero sections, service sections, a finish comparator for choosing concrete finishes, the gallery and a consultation booking dialog. The owners can edit their own content in Sanity, and any change shows up on the live site moments after they publish.

## The invisible parts

The visible site turned out to be the easy part. Enquiries are the business, and I found that the old sites quietly sent every form through an agency's Zapier setup into spreadsheets and email alerts. I rebuilt the forms to feed that same setup so nothing changed for the team, with a direct email fallback in case it's ever unreachable. I also optimised both sites for search, including mapping every old URL to its new page with a permanent (301) redirect so rankings carried over, set up conversion tracking with their marketing agency, and spent a fair bit of time on speed and accessibility, especially on phones.

