# Student Hub Frontend

Angular frontend for Student Hub.

## Local development

```bash
npm install
npm start
```

The app runs at `http://localhost:4200` and uses:
- API: `http://localhost:8080/api/students` (development config)

## Production API

Production builds use:
- `https://student-hub-lz3v.onrender.com/api/students`

This is configured in:
- `src/environments/environment.prod.ts`

## GitHub Pages build

```bash
npm run build:gh-pages
```

This command builds with:
- production configuration
- base href: `/student-hub/`

If your GitHub repository name is not `student-hub`, update the script in `package.json`:
- `build:gh-pages`

## Deployment workflow

GitHub Actions workflow:
- `.github/workflows/deploy-frontend-gh-pages.yml`

It deploys on:
- pushes to `main` that touch `frontend/**`
- manual trigger (`workflow_dispatch`)

## Notes

- Tab URL state uses hash routing (`#/generate`, `#/report`) so refresh works on static hosting like GitHub Pages.
