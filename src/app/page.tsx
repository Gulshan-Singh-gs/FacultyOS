import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--bg-base)] text-[var(--text-primary)]">
      {/* Ambient gradient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[32rem] h-[32rem] bg-[#6366F1]/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[28rem] h-[28rem] bg-[#22D3EE]/10 rounded-full blur-3xl" />
      </div>

      {/* Navigation Header */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6366F1] to-[#22D3EE] flex items-center justify-center text-white font-bold text-xl shadow-[0_4px_14px_rgba(99,102,241,0.35)]">
            F
          </div>
          <span className="font-bold text-lg tracking-tight">FacultyOS</span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="btn-ghost px-4 py-2 text-sm font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="btn-primary px-5 py-2 text-sm font-semibold"
          >
            Start Free
          </Link>
        </div>
      </header>

      {/* Hero Section (UI.md §Screen 1) */}
      <main className="relative z-10 max-w-5xl mx-auto w-full px-6 py-16 md:py-24 text-center space-y-8">
        <div className="inline-flex items-center gap-2 glass-badge px-4 py-1.5 text-xs font-semibold">
          <span>🛡️</span> Zero Medical Data Collection • Deterministic Policy Engine
        </div>

        <div className="space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.15]">
            The operating system for professors.
          </h1>
          <p className="text-base md:text-xl text-[var(--text-secondary)] leading-relaxed">
            Automate student requests, enforce syllabus policies, protect your time, and document your career.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto btn-primary px-8 py-3.5 text-base font-semibold"
          >
            Start Free (1 Course Free Forever)
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto btn-secondary px-8 py-3.5 text-base font-semibold"
          >
            Open Command Center
          </Link>
        </div>

        {/* Feature Cards Grid (NeuGlass) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left">
          <div className="card-neu p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 text-lg">
              ⚡
            </div>
            <h3 className="font-bold text-base text-[var(--text-primary)]">
              Deterministic Policy Engine
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Rules execute with 100% mathematical consistency. Requests meeting your syllabus rules are resolved instantly.
            </p>
          </div>

          <div className="card-neu p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 text-lg">
              🌙
            </div>
            <h3 className="font-bold text-base text-[var(--text-primary)]">
              Boundary & Weekend Shield
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Non-urgent requests submitted at 2 AM on a Saturday are queued until Monday morning. Reclaim your personal life.
            </p>
          </div>

          <div className="card-neu p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-lg">
              📊
            </div>
            <h3 className="font-bold text-base text-[var(--text-primary)]">
              Career & Service Ledger
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Track hidden service hours, committee contributions, and publications for one-click annual review reports.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[rgba(0,0,0,0.06)] dark:border-[rgba(255,255,255,0.06)] py-6 text-center text-xs text-[var(--text-secondary)]">
        FacultyOS • Built for professors, not administrators.
      </footer>
    </div>
  );
}
