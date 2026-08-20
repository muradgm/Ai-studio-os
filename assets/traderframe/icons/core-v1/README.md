# TraderFrame Core Icon Calibration — v1

Status: **REVIEW CANDIDATE — NOT FROZEN**

This folder contains the first six canonical SVG calibration icons for TraderFrame:

- `frame.svg`
- `trend.svg`
- `watchlist.svg`
- `signal.svg`
- `filter.svg`
- `risk.svg`

## Construction DNA

- 24×24 viewBox
- 1.5 unit primary stroke
- square caps
- miter joins
- dominant 0° / 45° / 90° geometry
- sharp / chamfer corner family
- `currentColor` monochrome master
- one optional `event` layer per icon
- Terminal Red `#E54832` is applied by the host UI to the event layer only

The event layer has semantic meaning. It represents focus, change, selection, boundary, or an active market event. It must not be used as decorative color.

## Refinement decisions

### Frame
Kept deliberately minimal. The top-right corner is the event/acquired corner and carries the family’s framing metaphor.

### Trend
Avoids a generic triangular arrowhead. The line resolves into a frame-corner terminal, tying direction back to the TraderFrame metaphor.

### Watchlist
Rejected bookmark/star imagery. A single left boundary frames three tracked rows; the active row is the event layer.

### Signal
Rejected the generic bullseye. Uses four alignment axes plus an inner diamond and event point, reading as an acquired/aligned market event.

### Filter
Narrowed the funnel mass and uses the event layer as the retained band rather than as decorative trim.

### Risk
Reduced shield mass and height. The central event line represents the risk boundary/limit.

## Freeze gate

Do not mark this family as production-frozen until:

1. the visual family is explicitly approved;
2. all six remain legible at 16, 20, 24, and 32px;
3. monochrome masters remain clear without accent color;
4. no icon exceeds one semantic event layer;
5. the family reads as one authored system rather than six unrelated stock icons.

After approval, update `icon-dna.json` status from `review-candidate` to `frozen-v1`, record the approval, and expand the production set from this grammar instead of improvising each new icon.