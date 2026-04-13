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
