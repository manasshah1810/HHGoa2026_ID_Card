export function renderErrorPage(error?: unknown): string {
  const detail = error instanceof Error ? error.message : (typeof error === "string" ? error : "");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #071c12; color: #f7f3e7; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 32rem; width: 100%; text-align: center; padding: 2rem; background: #0b2a1b; border: 1px solid #1a4a30; border-radius: 0.75rem; }
      h1 { font-size: 1.5rem; color: #fee101; margin: 0 0 0.5rem; font-family: serif; }
      p { color: #a0b0a5; margin: 0 0 1.5rem; }
      .err-detail { text-align: left; background: #04140c; border: 1px solid #ff2e88; color: #ff2e88; padding: 0.75rem 1rem; border-radius: 0.375rem; font-family: monospace; font-size: 0.85rem; margin-bottom: 1.5rem; word-break: break-word; white-space: pre-wrap; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.6rem 1.2rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; font-weight: 600; }
      .primary { background: #fee101; color: #071c12; border: none; }
      .secondary { background: transparent; color: #f7f3e7; border: 1px solid #1a4a30; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Hacker House Goa 2026</h1>
      <p>Something went wrong loading this page.</p>
      ${detail ? `<div class="err-detail">${escapeHtml(detail)}</div>` : ""}
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
