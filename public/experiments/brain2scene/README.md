# Brain2Scene Lab Demo

This directory is the complete runtime payload for the Brain2Scene experiment in the lab app.
The live page must work from these static files only; it must not import or read from the source
research repository at runtime.

## Files

- `brain2scene-demo.json` - manifest consumed by `/experiments/brain2scene`.
- `summary.json` - export metrics used to validate manifest metadata.
- `thumbnails/` - held-out shortclips thumbnail frames referenced by the manifest.

## Source And Refresh

The source export is produced by `/Users/montekkundan/Developer/neuro/brain2scene`.
Refresh from that repo only when intentionally updating the demo data:

```sh
cp /Users/montekkundan/Developer/neuro/brain2scene/exports/lab-demo/brain2scene-demo.json public/experiments/brain2scene/brain2scene-demo.json
cp /Users/montekkundan/Developer/neuro/brain2scene/exports/lab-demo/summary.json public/experiments/brain2scene/summary.json
rsync -a --delete /Users/montekkundan/Developer/neuro/brain2scene/exports/lab-demo/thumbnails/ public/experiments/brain2scene/thumbnails/
bun run validate:brain2scene
```

Keep this folder self-contained after refresh. Do not point the lab app at local absolute paths,
Python artifacts, or the source repo's `exports/` directory.
