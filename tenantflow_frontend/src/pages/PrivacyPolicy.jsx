import { Link } from 'react-router-dom';

const sections = [
  {
    title: 'Information we collect',
    body:
      'Tenant Flow collects account details, contact information, maintenance requests, payment records, and system usage data needed to operate the platform.'
  },
  {
    title: 'How we use information',
    body:
      'We use this information to process requests, coordinate maintenance work, manage payments, and provide support to tenants, staff, and administrators.'
  },
  {
    title: 'Data sharing',
    body:
      'We share information only with authorized property personnel, service providers, and payment processors when required to deliver the service or comply with law.'
  },
  {
    title: 'Your choices',
    body:
      'You may request access, correction, or deletion of your information by contacting support. Some records may be retained for legal or operational reasons.'
  }
];

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-6">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-700">Legal</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Privacy Policy</h1>
            <p className="mt-2 text-sm text-slate-600">How Tenant Flow handles account and property data.</p>
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