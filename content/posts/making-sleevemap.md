---
title: "Making SleeveMap"
date: "2026-06-26"
summary: "Building a route-mapping tool for runners with Next.js, Supabase, and PostGIS."
tags: ["Projects", "Next.js", "Supabase", "PostgreSQL", "Mapbox"]
---

## Links
[SleeveMap](https://sleevemap.chanelmuir.com) \
[GitHub Repo](https://github.com/Chanelmuir/SleeveMap)

## The Why:
At the tail end of my secondary school days, I found myself exploring the maze of unofficial tracks winding through Bottle Lake Forest in Christchurch, New Zealand. There were official routes, well marked and documented by the city council, but I'd been running them since I was a kid. In my search for something new, I uncovered a secret network of community-created routes through the forest. Often marked by dots of spray paint on trees, they took you on the path less travelled, revealing parts of the forest I'd never seen before.

Whenever I discovered a new track, I'd add it to OpenStreetMap so others could find it too. Eventually OpenStreetMap wasn't enough. I wanted to be able to see all my runs on one map, so I could see where I've been and what blocks I still needed to explore. Built with nothing more than barebones HTML, CSS and JavaScript, I managed to make a very simple site that did exactly that. You would sign in with your Strava account, wait a good 30s for all your activities to be pulled, and then be brought to a map with all the activities overlaid. 

![Original Site](/og_site.png)
*My original site's homepage*


As I moved through university I moved cities multiple times, and my goal of finishing Bottle Lake expanded into completing entire cities. First I cam for the streets of Tulsa, OK, next Philadelphia and then Christchurch. I discovered CityStrides, a far better version of my site, which also tracks your progress for completing whole cities. My site fell into disrepair, superseded by other, more useful tools.

![Christchurch CityStrides](/chch_cs.png)
*My Christchurch Map on CityStrides (Bottle Lake Forest circled in red)*


![Tulsa CityStrides](/tulsa_cs.png)
*Tulsa on CityStrides*


![Philadelphia CityStrides](/philly_cs.png)
*North Philadelphia on CityStrides*


By this point I'd become completely addicted to street collecting (Got to make the endless miles interesting somehow.) I found myself wanting more out of the sites I'd found. Often I'd meet with others to run, only to discover they weren't interested in spending half the run chasing dead ends. Some of my friends even shared in my mission, yet would have different streets to collect. Sure, you can find sites that will display their activities and yours, but I needed more. Constantly switching between tabs quickly became frustrating. I wanted a way to plan a route on a map that features the activities of my friends and I. Then I would reach maximum route-planning efficiency. 

It also felt like a full-circle moment. I was revisiting a project I'd started before studying computer science, this time armed with everything I'd learned at university. An opportunity to show off my new skills. I was especially excited to replace my original "download everything every visit" approach with a proper database-backed application.

## The Stack
#### Next.js
I decided to use Next.js for the frontend, it being the framework I had the most experience in. I'd used it in two previous group projects and appreciated its simplicity and power.

#### Supabase
The most major architectural difference between SleeveMap and my original attempt at this project was the implementation of a database backend. I chose Supabase due to their generous free tier plan which provided me with a PostgreSQL database, authentication, and storage in one place. This, combined with a Strava API webhook meant users wait times were dramatically decreased.

#### Mapbox
For mapping and routing, I went with Mapbox. They provide numerous polished map styles, and their own routing API. Since route planning is one of SleeveMap's core features, having high-quality maps and reliable routing was a must. Mapbox made this requirement easy to meet, without sacrificing customisation.
