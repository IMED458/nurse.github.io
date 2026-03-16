# Nurse Assessment Portal

Georgian-language nursing assessment web app with:

- Morse Fall Scale
- Braden Scale
- Nurse handover checklist

## Local development

```bash
npm install
npm run dev
```

Source files live in `app/`. The repository root is kept as the static GitHub Pages output so the site works even when Pages is configured to deploy directly from the main branch.

## Production build

```bash
npm run build
```

The repository includes a GitHub Actions workflow that deploys the `dist/` build to GitHub Pages after pushes to `main`.
