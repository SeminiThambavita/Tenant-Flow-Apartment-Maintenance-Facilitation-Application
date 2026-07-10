import { Link } from 'react-router-dom';

const sections = [
  {
    title: 'Platform use',
    body:
      'Tenant Flow is provided to help residents, property teams, and administrators manage maintenance, payments, and related communication.'
  },
  {
    title: 'Account responsibility',
    body:
      'You are responsible for the accuracy of the information you submit and for keeping your account credentials secure.'
  },
  {
    title: 'Acceptable use',
    body:
      'You may not misuse the platform, attempt unauthorized access, or interfere with service operations or other users.'
  },
  {
    title: 'Changes',
    body:
      'We may update these terms to reflect product or legal changes. Continued use of the platform means you accept the updated terms.'
  }
];

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-6">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-700">Legal</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Terms of Service</h1>
            <p className="mt-2 text-sm text-slate-600">The rules for using Tenant Flow.</p>
          </div>
          <Link to="/" className="text-sm font-medium text-blue-700 hover:text-blue-800">
            Back home
          </Link>
        </div>

        <div className="mt-8 space-y-6">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}