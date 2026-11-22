# Suno

Suno is a bilingual donation coordination demo for donors and hospital coordinators. It connects a public blood volunteer workflow with a separate organ and tissue information flow, family conversations, and a traceable coordinator workspace.

Suno does not decide medical eligibility, blood compatibility, clinical urgency, transplant allocation, doctor quality, legal consent, or official pledge status. A blood response is availability only. An appointment is a coordination record. A recorded organ donation wish and a family acknowledgement are not an official pledge or legal consent.

## Quick start

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The landing page has separate **Try donor portal** and **Try coordinator view** entries. All default records are clearly synthetic and live in the server process memory.

## Connected demo walkthrough

1. Open the coordinator view. Open **Blood requests**, select the seeded O+ request, and publish it if it is a draft.
2. Switch to the donor view. Open **Blood requests** and choose **I can volunteer**.
3. Switch back to the coordinator view. The request detail now shows the donor response. Select **Propose appointment**.
4. Return to the donor view, open **Appointments**, and confirm or decline the proposed time.
5. Open **Organ & tissue** and then **My wish**. Write a personal statement, try the optional gentle wording aid, review it, and save it.
6. Open **Family circle**. Use the seeded Mother and Brother invitations or create another private link. Invitation tokens are random and expire after 24 hours.
7. Open Mother’s invitation. Ask the Hindi question `क्या अंगदान के बाद शरीर का चेहरा बदल जाएगा?` to see a reviewed NOTTO excerpt. Ask Brother an unsupported hospital question to see the honest unanswered state.
8. Return to **Family circle** and open the editable conversation summary. The official NOTTO information and pledge links remain external routes.
9. Open **Enquiries** as the donor and request coordinator follow-up. Switch to the coordinator view to see the enquiry and add a donor-visible response.

## Architecture

- Next.js App Router, React, TypeScript, responsive CSS, Lucide icons, and Zod.
- `lib/store.ts` is the server-side demo domain. It stores the hospital, blood requests, volunteer responses, appointments, organ enquiries, activity history, and family circles in memory.
- `/api/bootstrap` creates a donor or coordinator demo session and sets HTTP-only role cookies.
- `/api/portal` enforces the active role on every read and write. Coordinator responses include internal notes; donor responses never do.
- `/api/circle` and `/api/invite/[token]` retain the private, expiring family invitation flow.
- `lib/sources.ts` contains the small reviewed NOTTO library. `lib/ai.ts` optionally lets Gemini classify a question, but the server only publishes a pre-approved answer when the returned source ID and exact excerpt match the reviewed library.
- `lib/translations.ts` is the shared English/Hindi copy system for the donor and essential coordinator flows.

## Status model

Blood requests use `draft → published → closed`.

Volunteer responses use `available → withdrawn` or `available → appointment proposed`.

Appointments use `proposed → confirmed → completed`, `proposed → declined`, and `proposed or confirmed → cancelled`. Completed means administrative attendance was recorded; it does not imply a clinically successful donation.

Enquiries use `open → in progress → resolved`.

## What is real and what is simulated

The UI, server-side role checks, cryptographically random invitation tokens, expiry checks, blood request transitions, duplicate-response prevention, appointment actions, donor/coordinator data separation, activity timeline, print styles, source validation, and deletion/withdrawal controls are implemented.

The default hospital, staff, donor, blood request, and enquiry records are synthetic. The demo store is ephemeral and resets when the Node process restarts or the deployment instance changes. No invitation message is sent. The demo writing aid keeps the original wish text and adds only a gentle frame; the donor reviews it before saving.

Without `GEMINI_API_KEY`, source question handling uses the predefined, reviewed examples and is labelled demo mode. Questions outside the reviewed examples remain unanswered. With `GEMINI_API_KEY`, Gemini may classify a question and select a reviewed excerpt; the server validates the category, source ID, and exact excerpt and still displays only the reviewed answer text.

## Official sources

The curated source library starts with the [NOTTO website](https://notto.mohfw.gov.in/), the [NOTTO organ and tissue pledge guidance](https://notto.mohfw.gov.in/WriteReadData/Portal/News/848_1_NOTTO_TRANSPLANT_MANUAL-final_version.pdf), and [NOTTO Myths vs Facts](https://notto.mohfw.gov.in/WriteReadData/Portal/News/941_1_Myths_Vs_Facts.pdf). Each supported family answer displays its title, exact supporting excerpt, page or section, and original URL.

## Checks

```bash
npm run typecheck
npm test
npm run build
```

The automated suite covers supported Hindi source selection, unsupported questions, citation scope, invitation expiry and isolation, family response deletion, blood request transitions, duplicate volunteer responses, appointment transitions, donor isolation, and hidden internal coordinator notes.

## Configuration and deployment

`.env.example` contains the optional `GEMINI_API_KEY` and `GEMINI_MODEL` values. Keep the key on the server and never prefix it with `NEXT_PUBLIC_`.

For a demo deployment, push this repository to GitHub and create a single-instance Node service on Render, Railway, or a similar host. Use build command `npm install && npm run build` and start command `npm run start`. The ephemeral store requires one running Node process for the connected donor/coordinator demo.

For persistent invitations and records, replace the in-memory store with a database, add durable server-side authentication and authorization, invitation delivery with consent, expiry cleanup, rate limits, audit logging that excludes private text, and a privacy review. Do not use the demo store as a real donor service.

## Remaining limitations

The source library is intentionally narrow and cannot answer clinical, religious, legal, eligibility, compatibility, or many hospital-process questions. English and Hindi UI copy is provided for the main donor journey; source excerpts remain in their original language for review. A production release still needs an accessibility audit with assistive technology, reviewed translations, end-to-end browser coverage, and domain review of all operational content.
