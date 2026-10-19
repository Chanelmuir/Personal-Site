---
name: "AI-Powered Takeoffs"
tagline: "A tool that measures site and landscape plans and turns them into a draft quote, for the same Concrete Brothers and Landscape Brothers team."
image: "/ai_powered_takeoffs.jpg"
tags: ["Python", "PyMuPDF", "PyTorch", "ONNX"]
wip: true
order: 3
---

After building their websites, I started on something for the other end of the business. Every job starts with a plan, and before anyone can quote it, someone has to measure it: how much driveway, how much lawn, how many metres of fence, how many plants. Done by hand, that takes a while for every enquiry. So I'm building a tool that does the measuring and drafts the quote.

## Reading the plan

You upload a plan PDF and it finds the areas, lengths and plant counts. Plans that come straight out of drafting software carry their own drawing inside the PDF, so the tool can read the exact shapes. It reads the legend, matches each colour or hatch to an area type, and works out the scale from the title block, double-checking it against the dimensions on the drawing in case the plan was printed at the wrong paper size.

Scans, photos and plans from other drafters don't have that, so I trained a small image model (a U-Net) on the team's past takeoffs. It looks at a picture of the plan and suggests where the lawn, garden, concrete and decking are. It's good on lawn and garden, still shaky on gravel, and gets better with every checked takeoff it learns from.

## A person still checks it

A plan often draws more than ends up in the job, so the tool never decides on its own. Anything it guessed at is outlined for checking, and there's a full set of editing tools on the plan: drag points, add curves, split an area in two, snap to the plan's lines, or draw in anything it missed. Once the measurements look right, they're priced at each business's rates into a draft quote.

## What's next

It's still a work in progress. Next up is saving takeoffs, so the confirmed ones can feed back into training the model, reading concrete plans where the quantities are only written as notes, and swapping the placeholder rates for the real ones.
