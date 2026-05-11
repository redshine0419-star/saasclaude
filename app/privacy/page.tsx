import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — MarketerOps.ai',
  description: 'Privacy Policy for MarketerOps.ai — how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-8">
          <Link href="/" className="text-sm text-indigo-600 hover:underline">← MarketerOps.ai로 돌아가기</Link>
        </div>

        <h1 className="text-3xl font-black text-slate-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-10">Last updated: May 11, 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-sm leading-relaxed text-slate-700">

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">1. Introduction</h2>
            <p>
              MarketerOps.ai (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates this website and the tools available at this domain.
              This Privacy Policy explains what information we collect, how we use it, and your rights regarding your data.
              By using our service, you agree to the practices described here.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">2. Information We Collect</h2>
            <h3 className="font-semibold text-slate-700 mb-2">2a. Information You Provide</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>URLs you submit for SEO/GEO analysis</li>
              <li>Keywords you enter for analysis</li>
              <li>Content you paste into the Content Orchestrator or Rewriter tools</li>
              <li>Company information entered in the llms.txt generator</li>
            </ul>
            <h3 className="font-semibold text-slate-700 mt-4 mb-2">2b. Automatically Collected Information</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Browser type and version</li>
              <li>Pages visited and time spent on each page</li>
              <li>Referring URL and exit pages</li>
              <li>Device type (desktop, mobile, tablet)</li>
              <li>IP address (anonymized where possible)</li>
            </ul>
            <h3 className="font-semibold text-slate-700 mt-4 mb-2">2c. Local Storage</h3>
            <p>
              We store your diagnosis history, content generation count, and dashboard statistics in your browser&apos;s
              <strong> localStorage</strong>. This data never leaves your device and is not transmitted to our servers.
              You can clear it at any time via your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide SEO, GEO, keyword, and content analysis results</li>
              <li>To generate AI-powered reports and recommendations via Google Gemini API</li>
              <li>To fetch publicly accessible data from URLs you submit (PageSpeed Insights, HTML content)</li>
              <li>To improve the accuracy and quality of our tools</li>
              <li>To display relevant advertising through Google AdSense</li>
              <li>To analyze aggregate usage patterns via Google Analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">4. Third-Party Services</h2>
            <p className="mb-3">We use the following third-party services that have their own privacy policies:</p>
            <div className="space-y-3">
              <div className="p-4 bg-white border border-slate-200 rounded-xl">
                <div className="font-semibold text-slate-800">Google AdSense</div>
                <p className="text-slate-600 mt-1">
                  We display advertisements served by Google AdSense. Google may use cookies and similar technologies
                  to show you personalized ads based on your browsing history.
                  You can opt out at <a href="https://www.google.com/settings/ads" className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">google.com/settings/ads</a>.
                </p>
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-xl">
                <div className="font-semibold text-slate-800">Google Analytics</div>
                <p className="text-slate-600 mt-1">
                  We use Google Analytics to understand how visitors use our service. Data is collected anonymously
                  and aggregated. See <a href="https://policies.google.com/privacy" className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">Google&apos;s Privacy Policy</a>.
                </p>
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-xl">
                <div className="font-semibold text-slate-800">Google Gemini API</div>
                <p className="text-slate-600 mt-1">
                  Content and URLs you submit are processed by Google&apos;s Gemini API to generate AI recommendations.
                  Please avoid submitting personally identifiable information. See
                  <a href="https://ai.google.dev/terms" className="text-indigo-600 hover:underline ml-1" target="_blank" rel="noopener noreferrer">Gemini API Terms</a>.
                </p>
              </div>
              <div className="p-4 bg-white border border-slate-200 rounded-xl">
                <div className="font-semibold text-slate-800">Google PageSpeed Insights API</div>
                <p className="text-slate-600 mt-1">
                  URLs you submit for diagnosis are sent to Google&apos;s PageSpeed Insights API for performance analysis.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">5. Cookies</h2>
            <p>
              We do not set first-party cookies ourselves. Third-party services (Google AdSense, Google Analytics)
              may set cookies in your browser for advertising and analytics purposes. You can control cookie settings
              in your browser preferences or use a browser extension to manage them.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">6. Data Retention</h2>
            <p>
              We do not store analysis results or submitted content on our servers beyond the time needed to
              generate a response (typically seconds). All persistent data (diagnosis history, statistics) is stored
              only in your browser&apos;s localStorage on your device.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">7. Children&apos;s Privacy</h2>
            <p>
              Our service is not directed to children under 13. We do not knowingly collect personal information
              from children. If you believe a child has provided us with personal information, please contact us
              and we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">8. Your Rights</h2>
            <p className="mb-2">Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Request correction or deletion of your data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Opt out of personalized advertising (via Google Ad Settings)</li>
            </ul>
            <p className="mt-3">
              Since we store no personal data on our servers (only anonymous analytics), most data-related requests
              can be fulfilled by clearing your browser&apos;s localStorage and cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an
              updated &quot;Last updated&quot; date. Continued use of the service after changes constitutes acceptance
              of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-slate-800 mb-3">10. Contact</h2>
            <p>
              If you have questions about this Privacy Policy or how we handle your data, please contact us at
              the email address listed on our main website.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 text-center">
          <Link href="/" className="text-sm text-indigo-600 hover:underline">← MarketerOps.ai로 돌아가기</Link>
        </div>
      </div>
    </div>
  );
}
