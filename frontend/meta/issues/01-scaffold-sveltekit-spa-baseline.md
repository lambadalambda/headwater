# 01 Scaffold SvelteKit SPA baseline

## Summary

Create the initial SvelteKit application scaffold for PleromaNet as a TypeScript SPA/static frontend without SSR.

## Requirements

- Use SvelteKit with Svelte 5 and TypeScript.
- Configure static/SPA output rather than SSR.
- Use `pnpm` and set `packageManager` in `package.json`.
- Add the initial lockfile.
- Add baseline mise tasks for repeated local workflows once commands exist.
- Keep generated starter content minimal so the design implementation starts from a clean baseline.

## Acceptance Criteria

- `pnpm install` works with the pinned mise toolchain.
- `pnpm check` or the scaffold equivalent passes.
- A minimal app route renders in browser tests.
- Default test commands do not require Docker or a live Pleroma instance.
- SSR is disabled or avoided for the built app.

## Notes

- Keep this commit separate from design implementation.
- The current design source is the Claude Design handoff at https://api.anthropic.com/v1/design/h/uWyaXcylEAtj0y9WapdTcg.
