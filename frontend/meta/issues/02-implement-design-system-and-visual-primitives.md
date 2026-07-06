# 02 Implement design system and visual primitives

## Summary

Translate the prototype's reduced vaporwave and macOS 9 inspired visual language into reusable Svelte/CSS primitives.

## Requirements

- Establish CSS custom properties for the core palette: warm cream background, off-white panels, deep navy ink, lavender accent, pink and teal supporting colors.
- Use the prototype font direction: Cormorant Garamond for wordmark and headings, Inter for body text, JetBrains Mono for labels and compact metadata.
- Create shared primitives for cards, tabs, buttons, form fields, pills, status rows, icon buttons, avatar placeholders, vaporwave/pixel banners, and post action controls.
- Implement Cream, Dusk, and Drive theme variables with persistence-ready structure.
- Preserve small caps labels, hairline borders, compact radii, serif display type, and soft retro image treatments.
- Do not use Tailwind for this design pass unless the project explicitly revisits that decision.

## Acceptance Criteria

- A design-system preview route or component story displays the core primitives.
- CSS uses semantic classes and custom properties rather than copied React prototype structure.
- Theme variables can switch the whole UI palette without rewriting component markup.
- Playwright coverage verifies key visual primitives render and remain usable at desktop and mobile widths.

## Notes

- Prototype colors include `#f5f1e8`, `#fbfaf3`, `#1f2347`, `#a48bd9`, `#e7a8c9`, and `#7dc4be`.
- Use the prototype as a visual reference, not as production code to copy directly.
