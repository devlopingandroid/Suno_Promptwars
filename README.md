# Suno

Suno is a responsive, bilingual prototype for discussing a prospective deceased organ or tissue donor's wish with family. It supports questions and source-backed exploration. It does **not** create an official pledge or legal consent, determine medical suitability, or match organs.

## Quick start

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Click **Try the 90-second demo**. No account or API key is required.

## Judge demo

1. The seeded demo starts with a clearly synthetic donor wish and invitations for Mother and Brother. Open **My wish**, edit the statement, and save it.
2. In **Family circle**, open Mother's private view. Switch to Hindi and ask `क्या अंगदान के बाद शरीर का चेहरा बदल जाएगा?`.
3. Read the answer, exact NOTTO excerpt, page reference, and source link. Click **We discussed this**.
4. Open Brother's view. Ask `Will the hospital treat me differently?`. The question remains open because the curated library does not support an answer.
5. Return to the donor tab and open **Summary**. Refresh the page if the donor tab was left open while family tabs changed. Edit or print the summary and open the official NOTTO link.

**Start a family conversation** creates an empty demo circle. Invite links are copyable and work within the running server for 24 hours. Suno does not send messages.

## What is real and what is simulated

The interface, server-enforced donor cookie, random invite tokens, expiry, per-invite response isolation, source selection, deletion, bilingual flows, and print view work. Demo data and invitations live **only in server memory**. They disappear on server restart or deployment instance change. This is not a durable or production-ready invitation service. The demo writing aid preserves the original words inside an optional gentle opening and closing. The donor reviews and edits the suggestion before saving.

Without `GEMINI_API_KEY`, the concern engine uses predefined, reviewed examples and labels the site **Demo mode · synthetic data**. It supports the body/funeral and family-cost examples and a limited family-discussion example. Other questions return an honest unsupported result. It does not pretend that these answers are generated live.

With `GEMINI_API_KEY`, Gemini may classify a free-text concern and select an excerpt. The server validates the structured category, source ID, and exact excerpt and publishes only a reviewed answer tied to that excerpt. Failed or unsupported model output falls back to the demo resolver. The app still remains an ephemeral demo. This design avoids showing unreviewed factual model text.

## Architecture

- Next.js App Router, React, TypeScript, responsive CSS, Lucide icons.
- `/api/bootstrap`: starts a demo and sets a random HTTP-only, SameSite cookie.
- `/api/circle`: donor-only wish, invitations, summary data, and circle deletion.
- `/api/invite/[token]`: token-limited family view, response, discussion state, and own-response deletion.
- `lib/sources.ts`: the small, reviewed source library and safe demo resolver.
- `lib/ai.ts`: optional model routing with Zod validation and a strict excerpt match.
- `lib/store.ts`: ephemeral in-memory state. No sensitive wish or question is placed in the invitation URL.

The source library currently contains a brief body/funeral passage and a family-cost passage from NOTTO's [Myths vs Facts](https://notto.mohfw.gov.in/WriteReadData/Portal/News/941_1_Myths_Vs_Facts.pdf), plus a family-discussion passage from the [NOTTO transplant manual, Form 7 note](https://notto.mohfw.gov.in/WriteReadData/Portal/News/848_1_NOTTO_TRANSPLANT_MANUAL-final_version.pdf). Every supported answer shows its title, exact English excerpt, page reference, and original link. The official [NOTTO website](https://notto.mohfw.gov.in/) and [official pledge portal](https://notto.abdm.gov.in/) are external links; Suno does not reproduce their pledge process.

## Checks

```bash
npm run typecheck
npm test
npm run build
```

The tests cover Hindi source selection, unsupported concerns, token expiry, invitation states, per-invite view isolation, and deletion. Before any real use, add an end-to-end browser test suite, accessibility audit with assistive technology, reviewed translations, and a content review with NOTTO or qualified domain experts.

## Deployment

For a **demo deployment**, push the repository to GitHub and create a Node web service on Render, Railway, or a similar host that keeps one Node process running. Set the build command to `npm install && npm run build` and the start command to `npm run start`. Use one instance, expose port 3000 (or the host-provided `PORT`), and set no environment variables for the predefined demo. Keep the deployment labelled as a demo. The in-memory data resets whenever the process restarts. Serverless deployments such as Vercel may reset or split that state and are therefore suitable only for the landing page, not the full invitation demonstration.

For optional Gemini routing, set `GEMINI_API_KEY` in the host's server-side environment and optionally `GEMINI_MODEL` as shown in `.env.example`. Never expose the key with a `NEXT_PUBLIC_` prefix.

For real invitations and lasting records, replace `lib/store.ts` with a database, server-side access control, a consented invitation delivery flow, expiry cleanup, rate limits, and a privacy review. Do not deploy the ephemeral store as a real donor service.

## Limitations

The curated source set is intentionally narrow. It cannot answer clinical, religious, legal, eligibility, compatibility, or many hospital-process questions. A family member's acknowledgement is understanding only. The summary is editable and is a conversation record, not a legal document. English and Hindi main flows are implemented; the source excerpt remains in its original English for review.
