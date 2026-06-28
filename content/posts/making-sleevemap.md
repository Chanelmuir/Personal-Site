---
title: "Making SleeveMap"
date: "2026-06-26"
summary: "Building a route-mapping tool for runners with Next.js, Supabase, and PostGIS."
tags: ["Projects", "Next.js", "Supabase", "PostgreSQL", "Mapbox"]
---

## Links
[SleeveMap](https://sleevemap.chanelmuir.com) \
[Github Repo](https://github.com/Chanelmuir/SleeveMap)

## The Why:
At the tail end of my High School days, I found myself exploring the many secret tracks through my local forest, Bottle Lake Forest in Christchurch, NZ. You see there were official routes well marked and documented by the city council, but I'd been running them since my youth. In my search for something new, I uncovered a secret network of community-created routes through the forest. Often marked by dots of spray paint on trees, they took you on the path less travelled, uncovering the mysteries of the forest.

As I encountered new tracks, I'd add them to OpenStreetMap, helping others to discover them, in the hope that more foot traffic would better establish them with the weakening spray paint. Eventually OpenStreetMap wasn't enough. I wanted to be able to see all my runs on one map, so I could see where I've been and what blocks I still needed to explore. Using pure HTML, CSS and JS, I managed to make a very simple site that did exactly that. You would sign in with your Strava account, wait a good 30s for all your activities to be pulled, and then be brought to a map with all the activities overlayed. 

![Original Site](/og_site.png)
*My original site's homepage*


As I went through college I moved cities multiple times, and my goals of finishing Bottle Lake grew into completing cities. Tulsa had a good run, as did Philadelphia and Christchurch. I discovered CityStrides, a far better version of my site, which also tracks your progress for completing whole cities. My site fell into disrepair, superceded by other more useful tools.

![Christchurch CityStrides](/chch_cs.png)
*My Christchurch Map on CityStrides (Bottle Lake Forest circled in red)*


![Tulsa CityStrides](/tulsa_cs.png)
*Tulsa on CityStrides*


![Philadelphia CityStrides](/philly_cs.png)
*North Philadelphia on CityStrides*


Having become a street collecting addict, (Got to make the endless miles interesting somehow) I found myself wanting more out of the sites I'd found. Often I'd meet with others to run, only for them to not want to run with me due to my habit of street collection (dead ends aren't for everyone.) Some of my friends even shared in my mission, yet would have different streets to collect. Sure, you can find sites that will display their activities and yours, but I needed more. Switching tabs all the time was too much, I wanted a way to plan a route on a map that features the activities of my friends and I. Then I would reach maximum route-planning efficiency. 

It also felt like a full circle moment. Taking a project I started before my formal education, and completely reworking it with my new knowledge. An opportunity to show off my new skills. Mostly I was looking forward to implementing a database, so you don't need to wait 30s every time you visit the site. 

## The Stack
I decided to use Next.js for the frontend, it being the framework I had the most experience in. I'd used it in two previous group projects and appreciated its simplicity.

For the backend I researched and came across Supabase as a PostgreSQL service that would give me a decent amount of server usage for free

## Technical Difficulties

## What's Next?
Need to use tailwind to implement mobile version, light mode