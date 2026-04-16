@AGENTS.md

## Deployment

Do not push to GitHub or deploy to Vercel unless explicitly asked. Always test locally first.

## Supervised Workflow

You are working under the supervision of Cowork (a separate Claude session). Follow this protocol on every task:

**Planning phase**
- Before writing any code, output a numbered plan with discrete steps.
- Each step must include: what you will do, which files you will touch, and how to verify it worked.
- End the plan with exactly: `PLAN READY — awaiting approval`
- Do not proceed until you receive approval or modification instructions.

**Execution phase**
- Execute one step at a time.
- After completing each step, output a brief summary: what you did, what changed, any surprises.
- End each step summary with exactly: `STEP N COMPLETE — awaiting review`
- Do not proceed to the next step until you receive approval or modification instructions.

**Completion**
- When all steps are done, output a final summary of all changes made.
- End with exactly: `TASK COMPLETE`

**If you hit a blocker**
- Stop immediately and describe the problem clearly.
- End with: `BLOCKED — awaiting guidance`

## Cowork Bridge

Cowork communicates with you via a signal file. At the start of each turn, a
`UserPromptSubmit` hook checks `~/rosssite/cowork-bridge/signal.json` for new
instructions. If the mtime has changed since the last check, the signal is
injected into your context between `=== COWORK SIGNAL ===` markers.

**Signal format:**
```json
{ "action": "approve" }
{ "action": "modify", "instructions": "..." }
{ "action": "task", "message": "..." }
{ "action": "abort", "reason": "..." }
```

When you see a `task` signal, treat it as your next instruction.
When you see `approve`, proceed to the next step.
When you see `modify`, adjust according to the instructions before continuing.
When you see `abort`, stop immediately and summarise what was completed.

## How Cowork Supervises

Cowork (a separate Claude session in the desktop app) can:
- Write signals to `~/rosssite/cowork-bridge/signal.json` — you pick these up via the UserPromptSubmit hook
- Read your responses from `~/rosssite/cowork-bridge/response.md`
- The Stop hook automatically signals Cowork when you finish

**Your responsibility:** After every plan, step summary, or blocker message,
write your full response text to `cowork-bridge/response.md` in the repo root.
The Stop hook will then fire and notify Cowork that the response is ready.
Do this with a simple file write — one tool call at the end of each response.

## Project Context

This is a Next.js site for Ross Belot (writer, poet, environmental journalist).
Public sections include essays, book reviews, news, events, **video** (native MP4
from hosted URLs, often **Cloudflare R2**, with **collections**), **multimedia**
landing, **photography** sets, **gallery** (mosaic from `gallery_photos`), op-eds
(with publication collections), press, and about.

Stack: Next.js 16 App Router, React 19, Drizzle ORM, Neon Postgres
(`@neondatabase/serverless` HTTP driver — no `db.transaction()` in app code),
NextAuth v5 (Google), Vercel Blob for typical uploads, TipTap in admin, Tailwind v4.
**Access control:** `proxy.ts` for `/admin/*` (not a `middleware.ts` file). **Video
URLs** live in `videos.r2_url`; admin accepts a **paste public HTTPS MP4 URL**
(presigned browser upload to R2 is not implemented yet — see
`docs/handover-video-r2-pipeline.md`).

Key conventions:
- DB-backed content uses Drizzle; server actions are re-exported from `lib/actions.ts`
- Thumbnails and many images use Vercel Blob URLs; large gallery stills / video files
  may use R2 public URLs stored in the schema
- Admin at `/admin/*` (Dashboard, Content, Photography, Gallery, Videos, Collections, etc.)
- Never push to GitHub or deploy to Vercel unless explicitly asked
