# Default style: warm, simple, hand-drawn, object-only

White background, readable on a phone. Hand-authored vector SVG: no raster, no tracing, no generated images.
Use this unless the user gives another direction.

## Palette (one accent)
| Name | Hex | Use |
|---|---|---|
| Ink | `#2A2420` | All outlines and text. |
| Paper | `#FFFFFF` | Background, always. |
| Cream | `#FBF4E6` | Walls, paper, light fills. |
| Sand | `#EED9B0` | Parcels, boxes. |
| Wood | `#C98F58` / `#9C6A3C` | Roofs, desks, counters. |
| Sage | `#93B98C` | Doors, "good / growth". |
| Sky | `#A8C8E0` | Glass, water, robot details. |
| Denim | `#5D7FA6` | Ordinary work items. |
| Brick | `#C8664B` / text `#A4432C` | Roofs, stamps. |
| Grey | `#D9D4CC` `#A9A39A` | Belts, guides, ghost outlines, ground line. |
| **Accent orange** | `#F07A1A` / light `#FFD9A8` | Only "the thing to watch": the hero object and one focal point per slide. Never big areas or body text. |

Sepia (`#F6EEDF`) behind historical scenes, with a sepia filter on the drawing. Swatches: `palette.svg`.

## Line and type
- Outline 6 px, inner detail 4 px, hairline 3 px on a 1920x1080 canvas. Slightly wobbly, no drop shadows.
- Handwriting font **Kalam** (SIL OFL, included in `runtime/vendor/`). Captions 60 px bold, nothing under 40 px on screen.
- Minimal text: one word per object, numbers only when the speaker says them.

## World rules
- **Object-only.** No people and no animals. People are told with objects: queues, piles, stamps, lit windows, empty chairs.
  The only figure is the small white robot (`robot/robot.svg`), the AI mascot. Never draw a real named person: use an object with the name.
- One **hero object** is the thread through the video (in episode 1: a sand parcel with an orange gear).
- Each slide has one focal point and one motion.

## Naming
Every object is one `<g id>`; ids are kebab-case `<thing>-<part>`. Moving parts carry `data-pivot="x y"` (needles and hands: `0 0` = hub).
