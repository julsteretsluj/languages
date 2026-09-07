# Lingora

A Duolingo-style language learning platform for:

- **Signed:** ASL, BSL, International Sign, NZSL  
- **Spoken:** Māori, Mandarin, Latin, Dutch, Spanish  

## Features

- 32 units per language, each climbing **A1 → C2**
- Multiple exercise types: multiple choice, translate, match, fill-in, true/false
- XP, streaks, hearts, and unit stars
- **Accounts via Supabase** — sign in to sync progress across devices (guest progress stays local until you log in)
- Sign-language aware prompts (gloss / concept descriptions)

## Run

```bash
npm install
cp .env.example .env.local   # fill with your Supabase URL + anon key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase

Project: `dmmnmovfjxqwoevqeygl` (linked via CLI).

```bash
supabase login
supabase link --project-ref dmmnmovfjxqwoevqeygl
supabase db push
```

Required env:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

In the Supabase dashboard → Authentication → URL configuration, allow:

- `http://localhost:3000/**`
- `https://languages4jules.vercel.app/**`

## Sign videos

- **ASL** — [SignASL.org](https://www.signasl.org/) (`/sign/{word}`)
- **BSL** — [SignBSL.com](https://www.signbsl.com/) (`/sign/{word}`)
- **International Sign** — [sonastik.ead.ee](https://sonastik.ead.ee/embed/en/word-list)
- **NZSL** — [NZSL Online](https://www.nzsl.nz/) (`/signs/{id}`)

Dictionary links and attribution appear on every matching exercise.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Supabase Auth + Postgres
