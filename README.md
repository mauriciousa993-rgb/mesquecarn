# Més que Carn

Monorepo:
- `frontend`: React + Vite + Tailwind (deploy en Vercel)
- `backend`: Node + Express (deploy en Render)

## Deploy rápido

### Vercel
- Importa el repo
- Root Directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`

### Render
- Crea servicio Web desde este repo
- Root Directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Configura `FRONTEND_URL` con el dominio de Vercel
