# Lingora

A Duolingo-style language learning platform for:

- **Signed:** ASL, BSL, International Sign, NZSL  
- **Spoken:** Māori, Mandarin, Latin, Dutch, Spanish  

## Features

- 32 units per language (grammar → slang → media)
- Multiple exercise types: multiple choice, translate, match, fill-in, true/false
- XP, streaks, hearts, and unit stars (saved in `localStorage`)
- Sign-language aware prompts (gloss / concept descriptions)

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Sign videos

- **ASL** — [SignASL.org](https://www.signasl.org/) (`/sign/{word}`)
- **BSL** — [SignBSL.com](https://www.signbsl.com/) (`/sign/{word}`)
- **International Sign** — [sonastik.ead.ee](https://sonastik.ead.ee/embed/en/word-list)
- **NZSL** — [NZSL Online](https://www.nzsl.nz/) (`/signs/{id}`)

Dictionary links and attribution appear on every matching exercise.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4
