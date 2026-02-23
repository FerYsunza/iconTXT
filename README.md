# IconTXT

A frontend-only static iOS app icon generator built with vanilla HTML, CSS, and JavaScript.

It renders a **1024x1024** square icon using an HTML canvas and exports a PNG with a fully opaque background (no transparency).

## Features

- Live app icon preview on a 1024x1024 canvas
- Background color picker
- Text input (single-line)
- Font family selector (curated free-for-commercial-use fonts)
- Font color picker
- Bold and italic toggles
- Font size control with sensible clamping
- Text alignment control (left/center/right)
- X/Y position sliders for simple placement
- Light and dark UI themes
  - Respects system preference on first load
  - Manual theme toggle
- One-click PNG export (`app-icon-1024.png`)
- UX safeguards for empty and long text

## Project Structure

- `index.html`
- `styles/main.css`
- `js/app.js`
- `README.md`

## Assumptions

- MVP targets single-line text rendering.
- If text is empty, exporting is still allowed and produces a background-only icon.
- If text is too long for the selected size, the app auto-scales text down to fit width (within min/max bounds).
- The output is a square source icon. Platform-specific masking/corner rounding is handled by Apple tooling.

## How to Run Locally

No build step is required.

1. Open `index.html` directly in a modern browser.
2. Optional: use a small local server if preferred, for example:

```bash
cd iconTXT
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## How Export Works

- The app always renders onto a canvas that is exactly `1024x1024` pixels.
- Before drawing text, it fills the entire canvas with the selected background color.
- Export uses `canvas.toDataURL("image/png")` and downloads as `app-icon-1024.png`.
- Because the canvas is fully filled first and uses an opaque context path, the PNG contains no transparent pixels.

## Curated Font List and Licensing Note

Included font families are loaded from Google Fonts and chosen for free/commercial-friendly licensing (commonly SIL Open Font License and/or similarly permissive free licenses):

- Poppins
- Montserrat
- Nunito
- Roboto Slab
- Archivo Black
- Manrope (UI font)

Always verify current license terms for any font you add or replace before commercial distribution.

## Limitations / Next Steps

- Single-line text only (multiline could be added later).
- No advanced effects (stroke, shadow, gradients, textures) by design for MVP simplicity.
- No drag-to-position interaction yet (sliders are used for clarity and accessibility).
- No project save/load presets yet.
