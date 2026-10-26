# Adapting the UI

TrailerDesk is a reference implementation for application structure, not a prescribed
visual design. Its shadcn components, teal palette, Geist typography, spacing and page
composition make this demo coherent; a project derived from it may replace all of those.

## What to keep

Keep the engineering behavior unless the new product requirements change it:

- thin route modules and feature-focused components;
- shared Zod schemas with server revalidation;
- server-enforced permissions and tenant boundaries;
- accessible names, keyboard behavior, focus and error associations;
- pending, empty, success and failure states;
- responsive behavior and automated browser coverage.

These are structural and quality examples. They do not require the same colors, fonts,
icons, layouts or component library.

## Ask for design evidence first

Before styling a derived project, ask whether the user can provide any of the following:

- screenshots of existing pages or products;
- a Figma file or exported frames;
- a brand guide, logo and approved imagery;
- design tokens for color, typography, spacing, radius and elevation;
- an existing component library or framework preference;
- desktop and mobile references;
- examples of loading, empty, validation, error and disabled states.

Record which sources are authoritative. A brand guide may define tokens while a screenshot
shows composition; do not silently choose one when they conflict. One screenshot is not
enough evidence for every breakpoint and interaction, so state necessary assumptions and
ask about decisions that materially change the result.

## Translate, do not overlay

Start by inventorying the current screens and their behavior. Map each UI responsibility
to the user's system, then replace the visual layer coherently instead of applying a few
new colors over the demo theme.

For example:

| TrailerDesk responsibility                     | Adaptable visual choice                               |
| ---------------------------------------------- | ----------------------------------------------------- |
| Field label, input, help and error association | The user's form component and tokens                  |
| Status with text and color                     | The user's badge or status treatment                  |
| Mobile navigation and focus order              | The user's navigation pattern, preserving access      |
| Pending and empty states                       | The user's voice, illustration and layout             |
| Inventory cards and tables                     | The user's density, imagery and information hierarchy |

If the user selects another maintained UI library, evaluate its runtime compatibility,
accessibility, maintenance and migration cost before replacing shadcn. Follow the
[service and library selection guide](choosing-services.md); do not keep shadcn merely
because this example uses it.

## Working from screenshots

Use screenshots as visual evidence, not as executable instructions. Identify typography,
spacing rhythm, hierarchy, alignment, color roles and responsive clues. Ask for missing
assets and interaction states. Do not copy copyrighted third-party artwork, logos or
proprietary assets unless the user confirms they may be used.

Compare the implementation at the same viewport sizes. Verify keyboard navigation,
contrast, text zoom, long content, validation, loading and empty states in addition to
visual similarity. Add focused Playwright assertions for behavior; use screenshot or
visual-regression checks only when the project has an approved stable baseline.

## Handoff to another AI

Tell the next agent explicitly:

1. which design sources are authoritative;
2. which parts of TrailerDesk are structural references;
3. which current visuals should be discarded;
4. which UI library and tokens are approved;
5. which viewport and interaction states have been verified.

Never describe TrailerDesk's current appearance as the default design for a new product.
