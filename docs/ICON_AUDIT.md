# FacultyOS Icon Audit

**Icon Library:** `lucide-react`  
**Standard Stroke Width:** `1.75` (consistent across all components)  
**Sizing Standard:**
- Nav & Headers: `20px` (`w-5 h-5`)
- Actions & Form Buttons: `16px` (`w-4 h-4`)
- Micro-badges & Indicators: `14px` (`w-3.5 h-3.5`)

---

## 1. Icon Inventory Across Screens (UI.md Alignment)

| Screen (UI.md) | Component / Usage | Lucide Icon | Stroke Width | Size | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **All (AppShell)** | Sidebar: Dashboard | `LayoutDashboard` | `1.75` | 20px | Primary overview link |
| **All (AppShell)** | Sidebar: Courses | `BookOpen` | `1.75` | 20px | Course management link |
| **All (AppShell)** | Sidebar: Inbox | `Inbox` | `1.75` | 20px | Triage queue link |
| **All (AppShell)** | Sidebar: Boundaries | `Clock` | `1.75` | 20px | Work-life shield link |
| **All (AppShell)** | Sidebar: Career Ledger | `ScrollText` | `1.75` | 20px | Service/tenure record link |
| **All (AppShell)** | Sidebar: Sign Out | `LogOut` | `1.75` | 16px | Session termination |
| **All (AppShell)** | Topbar: Mobile menu toggle | `Menu` | `1.75` | 20px | Mobile navigation |
| **All (AppShell)** | Topbar: Close mobile drawer | `X` | `1.75` | 20px | Accessible close trigger |
| **All (AppShell)** | Topbar: New Course CTA | `Plus` | `2.0` | 14px | Micro-action affordance |
| **Screen 1 (Marketing / Landing)** | Sections S1–S14 | `Shield`, `Zap`, `Clock`, `BookOpen`, `FileCheck2`, `Sparkles`, `Sliders`, `ArrowRight`, `Check`, `X`, `ChevronDown`, `Layers`, `Scale`, `GraduationCap`, `Inbox`, `AlertCircle`, `ExternalLink` | `1.75` | 16–24px | Full Lucide coverage; zero emoji in rendered DOM |
| **Screen 6 (Policy Builder)** | When/Then Controls (Phase 2) | `Plus`, `Trash2`, `Sliders` | `1.75` | 16px | Rule condition builder |
| **Screen 4 (Inbox Detail)** | Queue & Triage (Phase 2) | `CheckCircle2`, `XCircle`, `AlertCircle` | `1.75` | 16px | Decision status affordances |

---

## 2. Consistency Guarantees
- Zero ad-hoc SVG icon styling.
- Zero raw Unicode emoji glyphs in the DOM across all marketing and application surfaces (Lucide React icons only).
- All icons rendered via tree-shakeable `lucide-react` imports with standard `strokeWidth={1.75}`.
- Contrast and aria-labels maintained on all icon-only buttons for WCAG AA compliance.
