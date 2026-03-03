import { Link } from 'react-router-dom'

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Test Case Management',
    desc: 'Create, organize, and execute test cases with full traceability. Import via CSV and manage attachments.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Bug & Ticket Tracking',
    desc: 'Log, assign, and resolve bugs with priority levels, labels, and automated webhook notifications.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Analytics & Reports',
    desc: 'Real-time dashboards with pass/fail rates, team velocity, test coverage, and scheduled email reports.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Team Collaboration',
    desc: 'Role-based access for 5 user types. Invite teammates, manage permissions, and track activity.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Test Automation',
    desc: 'Connect your CI/CD pipeline, run automated test suites, and get instant results with detailed logs.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Integrations',
    desc: 'Connect with GitHub, Jira, Slack, Jenkins and more. Secure webhooks with HMAC-SHA256 signing.',
  },
]

const roles = [
  { name: 'Admin', bg: 'bg-rose-500', desc: 'Full system access, user management & configuration' },
  { name: 'Manager', bg: 'bg-violet-500', desc: 'Create projects, manage sprints & run reports' },
  { name: 'Member', bg: 'bg-emerald-500', desc: 'Create test cases, log bugs & collaborate' },
  { name: 'Developer', bg: 'bg-sky-500', desc: 'View results & update assigned tickets' },
  { name: 'Viewer', bg: 'bg-slate-500', desc: 'Read-only access to all project data' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white font-sans">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-black tracking-tight">
            Bug<span className="text-violet-400">Zera</span>
          </span>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-slate-400 hover:text-white transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link
              to="/login"
              className="text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white px-5 py-2 rounded-lg transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-32 px-6 overflow-hidden">
        {/* Glow blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-[300px] h-[300px] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            All-in-One QA & Test Management Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            Ship Quality
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-sky-400 bg-clip-text text-transparent">
              Software Faster
            </span>
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            BugZera brings test management, bug tracking, team collaboration, and analytics into one powerful platform — built for modern QA teams.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-bold px-8 py-3.5 rounded-xl text-base transition-all shadow-lg shadow-violet-600/25"
            >
              Start Free Today
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-all"
            >
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '10+', label: 'Core Modules' },
            { value: '5', label: 'User Roles' },
            { value: '100%', label: 'API Coverage' },
            { value: '6', label: 'Languages' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl font-black text-white mb-1">{s.value}</div>
              <div className="text-slate-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
              Everything Your Team Needs
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              From writing test cases to tracking production bugs — BugZera covers the entire quality lifecycle.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group p-6 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-violet-500/30 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center mb-4 group-hover:bg-violet-500/20 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-24 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
              Built for Every Role
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Fine-grained permissions ensure everyone sees exactly what they need.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((r) => (
              <div key={r.name} className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all">
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${r.bg} bg-opacity-20 mb-3`}>
                  <span className={`w-2 h-2 rounded-full ${r.bg}`} />
                  <span className="text-sm font-bold text-white">{r.name}</span>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
              A Complete QA Workflow
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { step: '01', title: 'Plan', desc: 'Create test plans and organize sprints', color: 'from-violet-500 to-violet-600' },
              { step: '02', title: 'Test', desc: 'Execute test cases and log results', color: 'from-sky-500 to-sky-600' },
              { step: '03', title: 'Track', desc: 'Report bugs and assign to developers', color: 'from-fuchsia-500 to-fuchsia-600' },
              { step: '04', title: 'Ship', desc: 'Analyze metrics and deploy with confidence', color: 'from-emerald-500 to-emerald-600' },
            ].map((item) => (
              <div key={item.step} className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} font-black text-lg flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  {item.step}
                </div>
                <h3 className="font-bold text-white text-lg mb-1">{item.title}</h3>
                <p className="text-slate-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-sky-600/20 pointer-events-none" />
        <div className="absolute inset-0 bg-[#0A0A0F]/60 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
            Ready to Level Up
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-sky-400 bg-clip-text text-transparent">
              Your QA Process?
            </span>
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
            Join teams using BugZera to ship better software with fewer bugs.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-bold px-10 py-4 rounded-xl text-base shadow-xl shadow-violet-600/25 transition-all"
          >
            Get Started Free
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-xl font-black">
            Bug<span className="text-violet-400">Zera</span>
          </span>
          <p className="text-sm text-slate-600">
            © {new Date().getFullYear()} BugZera. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <a href="mailto:support@bugzera.shop" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
