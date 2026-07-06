# Halftone-Duotone Shader Algorithm

A halftone-duotone shader reduces an image to a grid of dots in two tones, mimicking print halftoning. Dots vary in size based on image luminance: darker regions produce larger dots (more foreground coverage), lighter regions produce smaller dots (more background showing through).

## 1. Coordinate System & Grid

Center the image UVs around the origin, then divide by a cell size derived from your desired dot count and the image aspect ratio. This transforms pixel coordinates into **grid-space coordinates** where each integer unit is one cell.

### Grid types

- **Square**: cells are arranged in a regular column/row grid. Each cell center sits at `floor(coord) + 0.5`.
- **Hexagonal**: every other row of cells is offset horizontally by half a cell width. This staggering creates the characteristic hex packing.

## 2. Luminance Sampling

At each cell center, sample the source image texture. From the sampled color:

1. Apply a **sigmoid contrast curve** to each RGB channel independently — this pushes values toward 0 or 1, increasing the separation between lights and darks.
2. Compute **luminance** from the contrast-adjusted RGB using the BT.709 weighted sum (green-dominant).
3. Multiply luminance by the sampled alpha. This makes transparent image regions appear as "light" (small dots).
4. Optionally **invert** the luminance so darks become lights and vice versa.

## 3. Dot Shape

The luminance value at a cell drives the size of a shape drawn at that cell. The shape fills the cell's local coordinate space (0 to 1). Several dot styles are possible:

- **Classic (hard circle)**: Draw a filled circle at the cell center. Its radius is interpolated between a maximum and zero based on luminance. Use anti-aliased `smoothstep` with `fwidth` for clean edges.
- **Gooey (metaball-like)**: Use a power falloff from the cell center. Higher exponents make the blob more defined; lower exponents let adjacent cells' blobs merge smoothly. This requires sub-cell sampling (see below).
- **Holes**: Draw a circle, but invert the logic — when the effective radius exceeds half the cell, the shape flips to a donut (the cell is filled except for a hole). This creates an inverse-halftone look.
- **Soft (gradient ball)**: A smooth radial gradient that fades to zero at the edges rather than cutting off sharply. Gives a watercolor-like quality.

## 4. Sub-Cell Sampling

For styles that need smooth blending between adjacent cells (gooey, soft), subdivide each cell into a finer grid and accumulate shape contributions from all nearby sub-cell positions. This means for each fragment, you evaluate not just the one cell it falls inside, but also neighboring offsets — summing up their weighted shape contributions. This accumulation is what lets dots "merge" into each other organically.

For the classic and hole styles, a single sample per cell suffices — the hard edges don't benefit from sub-sampling.

## 5. Color Compositing

### Duotone mode (two fixed colors)

Blend between a **foreground** color and a **background** color based on the shape coverage value:

- The foreground color is multiplied by the shape value (dot coverage).
- The background color fills the remaining area (1 minus coverage).
- Both colors carry their own alpha, which factors into the final opacity.

### Original-colors mode

Instead of replacing the dot colors with a fixed palette, tint each dot with the **actual sampled image color** at that cell's position. This preserves the image's hues while still giving the halftone dot structure. The background color is still applied in uncovered areas.

## 6. Grain Effects

Two independent grain layers add print-like texture:

- **Grain mixer**: A procedural value noise sampled at the fragment position (scaled by a grain size parameter). The noise is thresholded and used to reduce the shape value locally, making dot edges irregular and organic — as if printed on rough paper.
- **Grain overlay**: A separate noise pattern applied as a post-process. The noise is centered around zero so it splits into positive and negative halves. Positive values produce white specks, negative values produce black specks. The strength is controlled independently, allowing fine-grained speckle on top of the halftone.

Both grain layers use the same value noise function: hash four corners of a grid cell, interpolate bilinearly with a smoothstep curve for continuity.

## 7. Image Boundary

Cells whose centers fall outside the image bounds should be masked out. Compute whether a cell center's corresponding image UV falls inside the 0-to-1 range using smoothstep ramps at each edge. Multiply the dot shape by this mask so dots fade cleanly at image borders.

## Summary of the Pipeline

1. Transform UVs to grid space
2. Determine which cell(s) the fragment belongs to (with sub-cell offsets for smooth styles)
3. For each relevant cell: sample the image at the cell center, compute luminance with contrast
4. Draw a shape (circle, blob, hole, or gradient) sized by that luminance
5. Accumulate shape values across all sampled cells
6. Blend foreground and background colors by the final shape coverage
7. Apply grain mixer to distort dot edges
8. Apply grain overlay for print texture
9. Output final color and opacity
