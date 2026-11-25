# src/theme – design tokens

Single place where the look of Academix is defined (issue #100, Epic #97). Every token is **exactly** a
value the app already used on 2026-11-25. Moving code onto tokens changes nothing visually. The future
design is applied by changing the values here.

| File | Content |
|---|---|
| `tokens.ts` | `semantic` (by role: `appBg`, `surface`, `navAccent`…), `palette` (raw colors used 10+ times), `radius`, `shadow`, `fontFamily`, helpers `cssVar()` / `toCssVarName()` |
| `variables.css` | The same tokens as CSS custom properties `--ax-*` on `:root`, imported once in `src/index.tsx` |
| `antdTheme.ts` | Theme of the global antd `ConfigProvider` in `src/App.tsx` |
| `taskColors.ts` | `gradientColors`, the task/axis color gradients (keys are stored in the database: never rename or remove one) |
| `check-tokens.js` | Checks that `variables.css` matches `tokens.ts`: `node src/theme/check-tokens.js` (from `academix-frontend/`) |

## Using tokens

**CSS modules / CSS files** (preferred):
```css
.card {
  background: var(--ax-surface);
  border-radius: var(--ax-radius-20);
  box-shadow: var(--ax-shadow-card);
  color: var(--ax-grey333);
}
```

**Inline styles**:
```tsx
import { cssVar } from "../../theme/tokens";
<div style={{ background: cssVar("appBg"), borderColor: cssVar("antGray5") }} />
```
Use `cssVar()` rather than the raw value from `palette`. A CSS variable follows a future theme change at
runtime; a copied string does not.

**antd components**: don't add a local `ConfigProvider` for colors the global theme already gives. When a
component really needs its own theme, read the values from `tokens.ts`:
```tsx
import { palette } from "../../theme/tokens";
<ConfigProvider theme={{ components: { Menu: { colorPrimary: palette.antBlue } } }}>
```

## Naming
- **CSS variable name** = `--ax-` + the key in kebab case: `appBg` → `--ax-app-bg`, `antGray5` → `--ax-ant-gray5`,
  `greyAaa` → `--ax-grey-aaa`, `slate500` → `--ax-slate500`. Radii and shadows are `--ax-radius-<key>` and
  `--ax-shadow-<key>`.
- **Semantic first.** Use a semantic token when the role matches (`appBg` for a page background). Otherwise use
  the palette color with the exact same value.

## Rules (from Epic #97)
- **Exact values only.** Never replace a color with a token that is only *close* to it. A value with no exact
  token stays as is, marked `// TODO(tokens)` (or `/* TODO(tokens) */` in CSS).
- **Adding or changing a token** belongs to the issue that owns `src/theme/` (#100, or later the issue that applies
  the new design). Change `tokens.ts` and `variables.css` together, then run `node src/theme/check-tokens.js`.
