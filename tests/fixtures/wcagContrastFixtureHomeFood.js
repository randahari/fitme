// TASK-008 WP11/WP12 — Contrast fixture (TASK_008_SPEC_v1.0.md §20.1/§20.2, OD-11a/OD-11b).
// A maintained fixture of the actual foreground/background color-token pairings rendered on
// the Home, Food, Workout, Profile, and Settings screens, extracted directly from
// css/app.css's selector rules (not the :root/body.dark palette in isolation) — per OD-11b's
// resolved enforcement mechanism. Extended by WP12 per §20.1's "ongoing Engineering
// responsibility" to maintain this fixture as new components/selectors are migrated.
//
// Each entry lists: the selector(s) the pairing comes from, the screen(s) it renders on, the
// foreground/background CSS expressions exactly as they appear in css/app.css, which WCAG
// 2.1 AA sub-criterion applies (1.4.3 text vs 1.4.11 non-text/icon, per OD-11a), and the
// required ratio (4.5:1 normal text / 3:1 large text or non-text-UI).
//
// Large-text classification (OD-11a: "≥18pt regular / ≥14pt bold"): this codebase's type
// scale is in px, and no canonical document defines a px-equivalent for "pt" here. To avoid
// Engineering silently choosing an interpretation, this fixture applies the single reading
// that is unambiguous under the standard 96dpi pt->px conversion regardless of weight
// (18pt = 24px) as its large-text cutoff, and holds everything below 24px to the 4.5:1
// normal-text bar even where bold. No entry in this fixture is currently near that boundary
// either way, so this choice does not change any entry's pass/fail result today.
//
// Decorative dividers (0.5px card/container borders using --color-border/--color-border-strong)
// and purely decorative/animated elements (the loading .spinner, emoji glyphs used as icons)
// are NOT included here — whether WCAG 1.4.11 reaches non-interactive-state decorative
// borders, as opposed to the interactive icon controls OD-11a names explicitly
// (`.icon-btn`, `.nav-btn svg`), is an open interpretive question this fixture does not
// resolve; only the one interactive icon-color case already found (`.send-btn`) is included.
//
// Every entry marked passing: true was independently verified passing at the time this
// fixture was built. Entries prefixed "DEFERRED-" are genuine, currently-measured WCAG AA
// failures that Product/Architecture have explicitly reviewed and deferred — per the
// Semantic Token Usage Contract decision (Option E) and the accompanying Deferment decision
// (both Product/Architecture approved): a finding not resolvable under Option E because it
// would require a Primitive Token value change, a new color, a visual-identity change, or a
// new Product/Visual Language judgment does not block TASK-008; it is recorded here as a
// documented deferred Product item for the future Brand/Visual Identity phase, at which point
// the Primitive Token palette may be revised and full WCAG verification repeated. Deferred
// status is NOT compliance — the measured ratio is unchanged and still below the required bar.

module.exports = [
  // ── Already remediated (WP11 WCAG Resolution Decision Package, Product/Architecture approved) ──
  { id: 'text-secondary-on-surface', selectors: ['.topbar-greeting', '.ring-pct-lbl', '.ring-kcal-of', '.ring-mac-lbl', '.stat-l', '.week-day', '.meal-time', '.section-header', '.quick-head', '.ai-loading', '.quick-learn-sub', '.adaptive-card-meta'], screens: ['Home', 'Food'], kind: 'text', fg: 'var(--color-text-secondary)', bg: 'var(--color-surface)', criterion: '1.4.3', threshold: 4.5, note: '.quick-learn-sub/.adaptive-card-meta resolved separately, under the Semantic Token Usage Contract (Option E) as a mechanical Engineering determination — same pairing/values as the rest of this entry, previously reached via var(--text-3) directly instead of the --color-text-tertiary alias' },
  { id: 'text-secondary-on-surface-subtle', selectors: ['.rm-label', '.food-tab', '.empty-state'], screens: ['Home', 'Food'], kind: 'text', fg: 'var(--color-text-secondary)', bg: 'var(--color-surface-subtle)', criterion: '1.4.3', threshold: 4.5 },
  { id: 'text-secondary-quick-chip-span', selectors: ['.quick-chip span'], screens: ['Food'], kind: 'text', fg: 'var(--color-text-secondary)', bg: 'var(--color-surface)', criterion: '1.4.3', threshold: 4.5 },
  { id: 'icon-surface-on-primary', selectors: ['.send-btn svg'], screens: ['Food'], kind: 'icon', fg: 'var(--color-surface)', bg: 'var(--color-primary)', criterion: '1.4.11', threshold: 3.0 },

  // ── Already-passing pairings verified during this fixture build (no change made) ──
  { id: 'text-on-surface', selectors: ['.ring-pct', '.ring-kcal', '.stat-v', '.rm-val', '.adaptive-card-text', '.meal-name', '.result-name', '.btn-google', '.ob-hero h1', '.goal-title'], screens: ['Home', 'Food', 'Login', 'Onboarding'], kind: 'text', fg: 'var(--color-text)', bg: 'var(--color-surface)', criterion: '1.4.3', threshold: 4.5 },
  { id: 'text-on-surface-subtle', selectors: ['.rm-val (in .result-macro)'], screens: ['Food'], kind: 'text', fg: 'var(--color-text)', bg: 'var(--color-surface-subtle)', criterion: '1.4.3', threshold: 4.5 },
  { id: 'primary-on-surface', selectors: ['.link-btn', '.ring-kcal-rem', '.ring-mac-val', '.meal-kcal', '.quick-learn-head', '.adaptive-card-head', '.food-tab.active', '.login-hero h1'], screens: ['Home', 'Food', 'Login'], kind: 'text', fg: 'var(--color-primary)', bg: 'var(--color-surface)', criterion: '1.4.3', threshold: 4.5 },
  { id: 'primary-on-primary-subtle', selectors: ['.result-note', '.streak-badge', '.coach-card-text', '.confidence-badge.mid'], screens: ['Home', 'Food'], kind: 'text', fg: 'var(--color-primary)', bg: 'var(--color-primary-subtle)', criterion: '1.4.3', threshold: 4.5 },
  { id: 'text-secondary-on-primary-subtle', selectors: ['.quick-chip:active span'], screens: ['Food'], kind: 'text', fg: 'var(--color-text-secondary)', bg: 'var(--color-primary-subtle)', criterion: '1.4.3', threshold: 4.5 },
  { id: 'white-on-primary-text-light-only', selectors: ['.btn-primary', '.btn-small'], screens: ['Food'], kind: 'text', fg: '#FFFFFF', bg: 'var(--color-primary)', criterion: '1.4.3', threshold: 4.5, note: 'passes light mode only — see failing entries below for the dark-mode result' },
  { id: 'success-on-success-subtle-light-only', selectors: ['.confidence-badge.high', '.quick-chip[disabled]'], screens: ['Food'], kind: 'text', fg: 'var(--color-success)', bg: 'var(--color-success-subtle)', criterion: '1.4.3', threshold: 4.5, note: 'passes light mode only' },
  { id: 'danger-on-danger-subtle-light-only', selectors: ['.confidence-badge.low'], screens: ['Food'], kind: 'text', fg: 'var(--color-danger)', bg: 'var(--color-danger-subtle)', criterion: '1.4.3', threshold: 4.5, note: 'passes light mode only' },

  // ── WP12: Workout/Profile/Settings — already-passing pairings ──
  { id: 'text-secondary-on-primary-subtle-achievement', selectors: ['.ach-title (in .achievement.earned)'], screens: ['Profile'], kind: 'text', fg: 'var(--color-text-secondary)', bg: 'var(--color-primary-subtle)', criterion: '1.4.3', threshold: 4.5 },

  // ── WP13: Onboarding/Login/Barcode overlay — already-passing pairings ──
  // The barcode overlay is deliberately theme-independent (always-black viewfinder chrome, per
  // SPEC §8.2 having no "theme-independent black/white" role category) — these pairings use
  // literal hex on both sides rather than resolvable tokens, and do not vary by mode.
  { id: 'white-on-black-barcode-header', selectors: ['.barcode-header'], screens: ['Barcode overlay'], kind: 'text', fg: '#FFFFFF', bg: '#000000', criterion: '1.4.3', threshold: 4.5, literal: true },
  { id: 'white-on-translucent-white-barcode-close', selectors: ['.barcode-close'], screens: ['Barcode overlay'], kind: 'icon', fg: '#FFFFFF', bg: '#262626', criterion: '1.4.11', threshold: 3.0, literal: true, note: 'background is rgba(255,255,255,0.15) composited over the overlay\'s solid #000 — #262626 is that composited result' },
  { id: 'translucent-white-on-black-barcode-status', selectors: ['.barcode-status'], screens: ['Barcode overlay'], kind: 'text', fg: '#B3B3B3', bg: '#000000', criterion: '1.4.3', threshold: 4.5, literal: true, note: 'text color is rgba(255,255,255,0.7) composited over the overlay\'s solid #000 — #B3B3B3 is that composited result' },

  // ── DEFERRED — Product/Architecture reviewed; each fails Option E's condition 5 (requires a
  // new Product/Visual Language judgment, and/or would touch the app's most prominent controls
  // or remove a semantic color signal with no same-tier existing-token alternative available).
  // Per the approved Deferment decision, these do not block TASK-008; they are recorded as
  // deferred Product items for the future Brand/Visual Identity phase. ──
  { id: 'DEFERRED-white-on-primary-dark', selectors: ['.btn-primary', '.btn-small', '.int-btn.active'], screens: ['Food', 'Workout'], kind: 'text', fg: '#FFFFFF', bg: 'var(--color-primary)', criterion: '1.4.3', threshold: 4.5, mode: 'dark', note: 'fails only in dark mode; light mode passes (see above). Deferred: Decision Package analysis found only existing-token substitutions that would change the primary CTA\'s dark-mode visual identity — a new Product/Visual Language judgment, outside Option E. .int-btn.active (WP12) is the identical pairing/values, confirmed by the same standing Deferment decision, not a fresh finding.' },
  { id: 'DEFERRED-success-on-success-subtle-dark', selectors: ['.confidence-badge.high', '.quick-chip[disabled]'], screens: ['Food'], kind: 'text', fg: 'var(--color-success)', bg: 'var(--color-success-subtle)', criterion: '1.4.3', threshold: 4.5, mode: 'dark', note: 'fails only in dark mode. Deferred: no --color-success-emphasis (middle) tier exists; every existing-token alternative either removes the success color signal or inverts the component\'s visual pattern — outside Option E.' },
  { id: 'DEFERRED-danger-on-danger-subtle-dark', selectors: ['.confidence-badge.low'], screens: ['Food'], kind: 'text', fg: 'var(--color-danger)', bg: 'var(--color-danger-subtle)', criterion: '1.4.3', threshold: 4.5, mode: 'dark', note: 'fails only in dark mode. Deferred: same reasoning as the success/success-subtle entry above — no --color-danger-emphasis tier exists.' },
];
