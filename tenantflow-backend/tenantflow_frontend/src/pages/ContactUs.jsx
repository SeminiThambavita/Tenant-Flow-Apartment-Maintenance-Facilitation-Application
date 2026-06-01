import { useState } from 'react';
import { Link } from 'react-router-dom';
import Dialog from '../components/Dialog';

const supportEmail = 'support@tenantflow.lk';

const contactReasons = [
  'Account help',
  'Payment issue',
  'Maintenance request',
  'Bug report',
  'Other'
];

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    reason: 'Account help',
    subject: '',
    message: ''
  });
  const [dialog, setDialog] = useState({ isOpen: false, title: '', message: '', type: 'success', buttons: [] });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const subject = formData.subject.trim() || `${formData.reason} - Tenant Flow support`;
    const bodyLines = [
      `Name: ${formData.name.trim()}`,
      `Email: ${formData.email.trim()}`,
      `Reason: ${formData.reason}`,
      '',
      formData.message.trim()
    ];

    const mailto = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;

    setDialog({
      isOpen: true,
      title: 'Message Ready',
      message: 'Your message is ready to send in your email app.',
      type: 'success'
    });

    window.location.href = mailto;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-6">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm lg:p-10">
        <div className="border-b border-slate-100 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-700">Support</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Contact Tenant Flow</h1>
          <p className="mt-2 text-sm text-slate-600">
            Send us a message and we’ll route it to the right support team.
          </p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Full name</span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Your name"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Email address</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="you@example.com"
                />
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Reason</span>
                <select
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {contactReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Subject</span>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Short summary of the issue"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Message</span>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Tell us what happened and how we can help."
              />
            </label>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Send message
            </button>
          </form>

          <aside className="space-y-4 rounded-2xl border border-slate-200 p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Support email</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{supportEmail}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Emergency line</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">0112-XXX-XXX</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Hours</p>
              <p className="mt-2 text-sm text-slate-600">Mon to Sun, 24/7</p>
            </div>

            <div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-900">
              For urgent maintenance issues, use the emergency line. For account, billing, or access help, use the form.
            </div>
          </aside>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4 border-t border-slate-100 pt-6 text-sm">
          <Link to="/privacy-policy" className="font-medium text-blue-700 hover:text-blue-800">
            Privacy Policy
          </Link>
          <Link to="/terms-of-service" className="font-medium text-blue-700 hover:text-blue-800">
            Terms of Service
          </Link>
        </div>
      </div>
      <Dialog
        isOpen={dialog.isOpen}
        title={dialog.title}
        message={dialog.message}
        type={dialog.type}
        onClose={() => setDialog({ ...dialog, isOpen: false })}
      />
    </div>
  );
}