---
name: "Selective Site Blocker"
tagline: "A Chrome extension that blocks a site but lets the useful pages through, like keeping Instagram messages while losing the feed."
image: "/specific_site_blocker_cropped.png"
repo: "https://github.com/Chanelmuir/Selective-Site-Blocker"
tags: ["Chrome extension", "JavaScript", "HTML", "CSS"]
order: 2
---

Most site blockers are all or nothing. I wanted to cut out social media feeds without losing the messaging that I actually use them for, and nothing I found could do that.

## What it does

- Add a site to block, then list the paths on it that are still allowed
- Leave the list empty to block the whole site
- Land on a blocked page and you're sent to the first allowed page, with a small notice explaining why, or to a block screen if the whole site is off-limits

For example, blocking all of Facebook, and all of Instagram except the explore and messaging pages.

## How it works

It's a Manifest V3 extension with no build step: a popup to manage the block list, saved in `chrome.storage`, and a content script that runs at `document_start` on every page. The content script matches the hostname (including subdomains and `www.`) against the list and checks the current path against the allowed routes before the page has a chance to load.

The tricky part was single-page apps. Instagram changes pages without a full reload, so a content script that only runs on page load would miss most navigation. The extension wraps `history.pushState` and `replaceState`, listens for back and forward, and keeps a light polling fallback, so it re-checks the path whenever it changes.

I also got it running on my phone by sideloading the packed `.crx` into Edge Canary with developer mode on, which was a fun puzzle in itself.
