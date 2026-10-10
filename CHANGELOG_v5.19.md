# FRAME ATLAS v5.19

## v5.18 package repair
- Restored the required `data/places.js` and companion data files from the verified v5.16 package. The v5.18 archive accidentally omitted the `data/` directory, which caused the startup error.
- Preserved v5.18 start-screen, archive ordering, and card text overlap edits in `index.html`.
- Preserved the v5.17 launch image, app icons, and manifest.
- Validated that required data files exist and the archive is readable.
