import { Link } from 'react-router-dom'

const features = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Test Case Management',
    desc: 'Create, organize, and execute test cases with full traceability. Import via CSV, track history, and manage attachments.',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Bug & Ticket Tracking',
    desc: 'Log, assign, and resolve bugs with priority levels, labels, watchers, and automated webhook notifications.',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Analytics & Reports',
    desc: 'Real-time dashboards with pass/fail rates, team velocity, test coverage, and scheduled email reports.',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Team Collaboration',
    desc: 'Role-based access for Admin, Manager, Member, Developer, and Viewer. Invite teammates and manage permissions.',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Test Automation',
    desc: 'Connect your CI/CD pipeline, run automated test suites, and get instant results with detailed execution logs.',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: 'Integrations',
    desc: 'Connect with GitHub, Jira, Slack, Jenkins, and more. Webhooks with HMAC signing for secure event delivery.',
  },
]

const roles = [
  { name: 'Admin', color: 'bg-red-100 text-red-700 border-red-200', desc: 'Full access to all features, user management, and system configuration.' },
  { name: 'Manager', color: 'bg-blue-100 text-blue-700 border-blue-200', desc: 'Create projects, manage sprints, configure environments, and run reports.' },
  { name: 'Member', color: 'bg-green-100 text-green-700 border-green-200', desc: 'Create and execute test cases, log bugs, and collaborate on tickets.' },
  { name: 'Developer', color: 'bg-purple-100 text-purple-700 border-purple-200', desc: 'View test results, update assigned tickets, and track test runs.' },
  { name: 'Viewer', color: 'bg-gray-100 text-gray-600 border-gray-200', desc: 'Read-only access to all project data and reports.' },
]

const stats = [
  { value: '10+', label: 'Core Modules' },
  { value: '5', label: 'User Roles' },
  { value: '100%', label: 'API Coverage' },
  { value: '6', label: 'Languages' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-2xl font-extrabold bg-gradient-to-r from-indigo-700 to-cyan-500 bg-clip-text text-transparent tracking-tight">
            BugZera
          </span>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-600 hover:text-indigo-700 transition-colors px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg transition-colors shadow-sm"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-cyan-50 pt-20 pb-28 px-6">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-100/40 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <span className="inline-block mb-4 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold tracking-wide uppercase">
            All-in-One QA Platform
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-gray-900 mb-6">
            Ship Quality Software
            <span className="block bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
              Faster & Smarter
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            BugZera unifies test management, bug tracking, team collaboration, and analytics into one powerful platform — built for modern QA teams.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3.5 rounded-xl text-base shadow-lg hover:shadow-indigo-200 transition-all duration-200"
            >
              Start for Free
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-8 py-3.5 rounded-xl text-base border border-gray-200 shadow-sm transition-all duration-200"
            >
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-indigo-600 py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl font-extrabold text-white mb-1">{s.value}</div>
              <div className="text-indigo-200 text-sm font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              Everything Your QA Team Needs
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              From writing test cases to tracking production bugs — BugZera covers the entire quality lifecycle.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="group p-6 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition-all duration-200 bg-white"
              >
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              Built for Every Team Member
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Fine-grained role-based access ensures everyone sees exactly what they need — nothing more, nothing less.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((r) => (
              <div key={r.name} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold border mb-3 ${r.color}`}>
                  {r.name}
                </span>
                <p className="text-gray-600 text-sm leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              A Complete QA Workflow
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              From planning to production, BugZera fits naturally into how your team already works.
            </p>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute top-8 left-12 right-12 h-0.5 bg-indigo-100" />
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: '01', title: 'Plan', desc: 'Create test plans and organize sprints' },
                { step: '02', title: 'Test', desc: 'Execute test cases and log results' },
                { step: '03', title: 'Track', desc: 'Report bugs and assign to developers' },
                { step: '04', title: 'Ship', desc: 'Analyze metrics and deploy with confidence' },
              ].map((item) => (
                <div key={item.step} className="relative text-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-14 h-14 rounded-full bg-indigo-600 text-white font-extrabold text-lg flex items-center justify-center mx-auto mb-4 shadow-md">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{item.title}</h3>
                  <p className="text-gray-500 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-indigo-600 to-cyan-500">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Ready to Level Up Your QA Process?
          </h2>
          <p className="text-indigo-100 text-lg mb-10 max-w-xl mx-auto">
            Join teams using BugZera to ship better software with fewer bugs.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-indigo-700 font-bold px-10 py-4 rounded-xl text-base shadow-xl transition-all duration-200"
          >
            Get Started Free
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-2xl font-extrabold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            BugZera
          </span>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} BugZera. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <a href="mailto:support@bugzera.shop" className="hover:text-white transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
