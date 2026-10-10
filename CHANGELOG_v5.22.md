# FRAME ATLAS v5.22

## Fix
- Separated the launch/splash artwork from the actual home screen. The launch image is now restricted to `#splash`; it is not used as the home hero or desktop navigation decoration.
- Removed the old desktop sidebar pseudo-element that painted a second copy of the launch artwork.
- Added a final CSS override after prior theme rules so earlier media-query styling cannot reapply the launch image to the home page.
- Updated service worker cache version to `frame-atlas-v5.22-20261010` to avoid serving the previous cached HTML/CSS.

## Validation
- Retained existing place data and assets from v5.21.
- Confirmed `data/places.js`, `index.html`, launch image and icon assets are present.
- ZIP integrity and JS syntax checks performed before release.
