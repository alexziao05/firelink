# FireLink

Wildfire preparedness via SMS plus an **anonymous, public** community dashboard — ZIP-level stats and broad needs only (no names, phone numbers, or street addresses).

## Dashboard

Demo route: **`/dashboard/91001`**

Run locally:

```bash
npm install
npm run dev
```

Then open [http://localhost:3000/dashboard/91001](http://localhost:3000/dashboard/91001).

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Mock data in [`src/lib/mockData.ts`](src/lib/mockData.ts); swap [`getCommunityData`](src/lib/data.ts) for `GET /api/community/:zip` when the backend is ready.

## Scripts

```bash
npm run dev    # development
npm run build  # production build
npm run start  # production server
npm run lint
```
