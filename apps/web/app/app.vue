<template>
  <div class="app">
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>

<style>
:root {
  --text: #1c1c1c;
  --muted: #6b6b6b;
  --line: #e2e2e2;
  --surface: #ffffff;
  --background: #f6f6f4;
  --accent: #1f5f8b;
  --declared-bg: #eef1f4;
  --declared-text: #445566;
  --corrected-bg: #fff1d6;
  --corrected-text: #8a5300;
  --unknown: #b3261e;
  --unknown-bg: #fde4e1;
  --ok-bg: #e5f4ea;
  --ok-text: #1e6b3a;
  --error-bg: #fdeceb;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    sans-serif;
  font-size: 15px;
  line-height: 1.45;
  color: var(--text);
  background: var(--background);
}

main {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 16px 64px;
}

h1 {
  margin: 0 0 4px;
  font-size: 24px;
}

h2 {
  font-size: 16px;
  margin: 0 0 4px;
}

h3 {
  margin: 0;
  font-size: 16px;
}

a {
  color: var(--accent);
}

.muted {
  color: var(--muted);
  margin: 0;
}

button {
  font: inherit;
  padding: 4px 12px;
  border: 1px solid var(--accent);
  border-radius: 6px;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
}

button:disabled {
  opacity: 0.5;
  cursor: default;
}

button.link {
  border: none;
  background: none;
  color: var(--accent);
  padding: 0 4px;
  text-decoration: underline;
}

input,
select {
  font: inherit;
  padding: 3px 6px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--surface);
}

.back {
  display: inline-block;
  margin-bottom: 16px;
}

.banner {
  padding: 8px 12px;
  border-radius: 6px;
  margin: 12px 0;
}

.banner-error {
  background: var(--error-bg);
  color: var(--unknown);
}

.banner-ok {
  background: var(--ok-bg);
  color: var(--ok-text);
}

.products {
  width: 100%;
  margin-top: 16px;
  border-collapse: collapse;
  background: var(--surface);
}

.products th,
.products td {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.summary {
  margin: 16px 0;
  padding: 8px 12px;
  border-left: 4px solid var(--unknown);
  background: var(--surface);
}

.summary-done {
  border-left-color: var(--ok-text);
}

.dormant {
  margin: 16px 0;
  padding: 12px;
  border: 1px dashed var(--corrected-text);
  border-radius: 6px;
  background: var(--surface);
}

.dormant ul {
  margin: 8px 0 0;
  padding-left: 20px;
}

.item {
  margin-top: 12px;
  padding: 12px 16px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 8px;
}

.children {
  margin-left: 12px;
  padding-left: 12px;
  border-left: 2px solid var(--line);
}

.item-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.kind {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--muted);
}

.steps {
  display: grid;
  gap: 6px;
}

.step {
  padding: 6px 8px;
  border-radius: 6px;
  background: var(--background);
}

.step-added {
  background: var(--corrected-bg);
}

.step-head {
  display: flex;
  gap: 8px;
  align-items: center;
}

.process {
  font-weight: 600;
}

.field,
.composition {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
}

.composition {
  margin-bottom: 8px;
}

.field-unknown {
  margin: 0 -8px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--unknown-bg);
}

.item-summary {
  flex-basis: 100%;
  margin-left: 28px;
}

.toggle {
  border: none;
  background: none;
  color: var(--muted);
  padding: 0 2px;
  width: 20px;
}

.field-label {
  min-width: 90px;
  color: var(--muted);
}

.unknown {
  color: var(--unknown);
  font-weight: 600;
}

.declared {
  color: var(--muted);
  font-size: 13px;
  font-style: italic;
}

.badge {
  font-size: 12px;
  padding: 1px 8px;
  border-radius: 999px;
  white-space: nowrap;
}

.badge-declared {
  background: var(--declared-bg);
  color: var(--declared-text);
}

.badge-corrected {
  background: var(--corrected-bg);
  color: var(--corrected-text);
  font-weight: 600;
}

.inline-form,
.composition-line,
.composition-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.composition-form {
  display: grid;
  gap: 6px;
}

.composition-line input[type='number'] {
  width: 80px;
}

.total-ok {
  color: var(--ok-text);
}

.total-off {
  color: var(--unknown);
  font-weight: 600;
}
</style>
