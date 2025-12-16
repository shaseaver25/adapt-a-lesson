import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#FAF7F2]/95 backdrop-blur-sm border-b border-[#166534]/10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link 
            to="/login" 
            className="flex items-center gap-2 text-[#166534] hover:text-[#14532d] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back to Login</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <article className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-[#2A1E17] mb-2">Privacy Policy</h1>
          <p className="text-[#D97706] font-semibold text-lg mb-8">Effective Date: January 1, 2025</p>
          
          <p className="text-[#2A1E17] leading-relaxed">
            REAL Authentic Learning Studio, LLC ("REAL Authentic Learning Studio," "we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered educational productivity platform, including our website, applications, and related services (collectively, the "Service").
          </p>
          
          <p className="text-[#2A1E17] leading-relaxed font-semibold">
            Please read this Privacy Policy carefully. By accessing or using the Service, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. If you do not agree, please do not access or use the Service.
          </p>

          {/* Section 1 */}
          <section className="mt-10">
            <h2 className="text-2xl font-bold text-[#166534] mb-4">1. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">1.1 Information You Provide to Us</h3>
            <p className="text-[#2A1E17] leading-relaxed mb-3">
              <strong>Account Registration Information:</strong> When you create an account, we collect your preferred name, email address, password (stored in encrypted/hashed form), school name, school city, school state, and phone number.
            </p>
            <p className="text-[#2A1E17] leading-relaxed mb-3">
              <strong>OAuth Authentication Data:</strong> If you choose to register or log in using Google, Microsoft, or Canvas LMS, we receive your name and email address from these providers. We do not request access to your documents, calendars, or other data from these services.
            </p>
            <p className="text-[#2A1E17] leading-relaxed">
              <strong>Content You Create:</strong> We collect lesson plans, student groupings by level, subject areas, and other educational content you create or upload to the Service. We do not request, require, or endorse the inclusion of individual student names or other student personally identifiable information in this content.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">1.2 Information Collected Automatically</h3>
            <p className="text-[#2A1E17] leading-relaxed mb-3">
              When you access the Service, we automatically collect certain technical information, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#2A1E17]">
              <li>Device information (device type, operating system, browser type and version)</li>
              <li>IP address and approximate geographic location</li>
              <li>Pages visited and features used within the Service</li>
              <li>Session duration and frequency of use</li>
              <li>Referring URL (how you arrived at our Service)</li>
              <li>Cookies and similar tracking technologies for session management and authentication</li>
            </ul>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">1.3 Information We Do Not Collect</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              <strong>Student Personally Identifiable Information:</strong> Our Service is designed for educators to create lesson plans and educational materials. We do not request, require, or collect student names, student email addresses, grades, assessment scores, IEP/504 information, or other student personally identifiable information. If a teacher inadvertently includes student information in uploaded content, we do not use this information for any purpose other than providing the Service to that teacher, and we encourage teachers to avoid including such information.
            </p>
          </section>

          {/* Section 2 */}
          <section className="mt-10">
            <h2 className="text-2xl font-bold text-[#166534] mb-4">2. How We Use Your Information</h2>
            <p className="text-[#2A1E17] leading-relaxed mb-3">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#2A1E17]">
              <li><strong>Provide and Maintain the Service:</strong> To operate the Service, process your requests, and deliver the features you use</li>
              <li><strong>Authenticate Users:</strong> To verify your identity and manage your account access</li>
              <li><strong>Personalize Your Experience:</strong> To customize the Service based on your preferences and usage patterns</li>
              <li><strong>Improve and Develop the Service:</strong> To analyze usage patterns, troubleshoot issues, and develop new features</li>
              <li><strong>Communicate with You:</strong> To send service-related notices, respond to support requests, and provide updates about the Service</li>
              <li><strong>Ensure Security and Prevent Fraud:</strong> To protect the Service and our users from unauthorized access, security threats, and fraudulent activity</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="mt-10">
            <h2 className="text-2xl font-bold text-[#166534] mb-4">3. Artificial Intelligence and Data Processing</h2>
            <p className="text-[#2A1E17] leading-relaxed mb-4">
              Our Service uses artificial intelligence to help educators create and enhance lesson plans. This section explains how your content is processed by AI systems.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">3.1 AI Service Providers</h3>
            <p className="text-[#2A1E17] leading-relaxed mb-3">
              We use the following third-party AI services to provide features of the Service:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#2A1E17]">
              <li><strong>OpenAI:</strong> For text generation and lesson plan content enhancement</li>
              <li><strong>Anthropic:</strong> For AI-powered content processing</li>
              <li><strong>Nano Banana:</strong> For AI-generated educational images</li>
              <li><strong>ElevenLabs:</strong> For audio file generation</li>
            </ul>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">3.2 How Your Content Is Processed</h3>
            <p className="text-[#2A1E17] leading-relaxed mb-3">
              Your content is processed solely to provide the Service to you. When you submit lesson plan content or objectives, this information is sent to our AI service providers to generate the requested output (enhanced text, images, or audio) for your use. The content you submit is:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#2A1E17]">
              <li>Used only to generate output for your specific request</li>
              <li>Not used to train or improve our proprietary AI models</li>
              <li>Not used by our AI service providers to train their models (we maintain business/API-tier agreements that prohibit this)</li>
            </ul>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">3.3 AI Transparency Commitment</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              We are committed to transparency about our AI practices. We do not sell your content. We do not use your educational materials to build AI products that benefit others. Your lesson plans remain yours.
            </p>
          </section>

          {/* Section 4 */}
          <section className="mt-10">
            <h2 className="text-2xl font-bold text-[#166534] mb-4">4. How We Share Your Information</h2>
            <p className="text-[#2A1E17] leading-relaxed font-semibold mb-4">
              We do not sell your personal information. We share your information only in the following circumstances:
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">4.1 Service Providers</h3>
            <p className="text-[#2A1E17] leading-relaxed mb-4">
              We share information with third-party service providers who perform services on our behalf:
            </p>
            
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-[#166534]/20 rounded-lg overflow-hidden">
                <thead className="bg-[#166534]/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-[#166534] font-semibold border-b border-[#166534]/20">Provider</th>
                    <th className="px-4 py-3 text-left text-[#166534] font-semibold border-b border-[#166534]/20">Purpose</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  <tr className="border-b border-[#166534]/10">
                    <td className="px-4 py-3 text-[#2A1E17]">Supabase</td>
                    <td className="px-4 py-3 text-[#2A1E17]">Authentication and database hosting</td>
                  </tr>
                  <tr className="border-b border-[#166534]/10">
                    <td className="px-4 py-3 text-[#2A1E17]">Lovable</td>
                    <td className="px-4 py-3 text-[#2A1E17]">Application hosting and infrastructure</td>
                  </tr>
                  <tr className="border-b border-[#166534]/10">
                    <td className="px-4 py-3 text-[#2A1E17]">OpenAI</td>
                    <td className="px-4 py-3 text-[#2A1E17]">AI-powered text generation and enhancement</td>
                  </tr>
                  <tr className="border-b border-[#166534]/10">
                    <td className="px-4 py-3 text-[#2A1E17]">Anthropic</td>
                    <td className="px-4 py-3 text-[#2A1E17]">AI-powered content processing</td>
                  </tr>
                  <tr className="border-b border-[#166534]/10">
                    <td className="px-4 py-3 text-[#2A1E17]">Nano Banana</td>
                    <td className="px-4 py-3 text-[#2A1E17]">AI-generated educational images</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-[#2A1E17]">ElevenLabs</td>
                    <td className="px-4 py-3 text-[#2A1E17]">Audio file generation</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[#2A1E17] leading-relaxed">
              These service providers are contractually obligated to use your information only as necessary to provide their services to us and to maintain appropriate security measures.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">4.2 Legal Requirements</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              We may disclose your information if required to do so by law or in response to valid legal process, such as a subpoena, court order, or government request. We will attempt to notify you of such requests unless prohibited by law.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">4.3 Business Transfers</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any such change and any choices you may have regarding your information.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">4.4 With Your Consent</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              We may share your information with third parties when you give us explicit consent to do so.
            </p>
          </section>

          {/* Section 5 */}
          <section className="mt-10">
            <h2 className="text-2xl font-bold text-[#166534] mb-4">5. Data Retention</h2>
            <p className="text-[#2A1E17] leading-relaxed mb-3">
              We retain your personal information for as long as your account is active or as needed to provide you with the Service. Specifically:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#2A1E17]">
              <li><strong>Active Accounts:</strong> We retain your account information and content for as long as your account remains active.</li>
              <li><strong>Account Deletion:</strong> When you delete your account, we retain your data for 30 days to allow for account recovery if requested. After 30 days, your personal information is permanently deleted from our active systems.</li>
              <li><strong>Legal Obligations:</strong> We may retain certain information for longer periods as required by law or to resolve disputes.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="mt-10">
            <h2 className="text-2xl font-bold text-[#166534] mb-4">6. Data Security</h2>
            <p className="text-[#2A1E17] leading-relaxed mb-3">
              We implement appropriate technical and organizational measures to protect your personal information, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#2A1E17]">
              <li><strong>Encryption in Transit:</strong> All data transmitted between your device and our servers is encrypted using HTTPS/TLS</li>
              <li><strong>Encryption at Rest:</strong> Data stored on our servers is encrypted</li>
              <li><strong>Access Controls:</strong> Role-based access controls limit who can access your data</li>
              <li><strong>Regular Security Audits:</strong> We conduct regular reviews of our security practices</li>
              <li><strong>Employee Training:</strong> Our team receives training on data protection and security best practices</li>
              <li><strong>Incident Response Plan:</strong> We maintain procedures for responding to potential data breaches</li>
            </ul>
            <p className="text-[#2A1E17] leading-relaxed mt-4">
              While we strive to protect your personal information, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          {/* Section 7 */}
          <section className="mt-10">
            <h2 className="text-2xl font-bold text-[#166534] mb-4">7. Your Rights and Choices</h2>
            <p className="text-[#2A1E17] leading-relaxed mb-4">
              Depending on your location, you may have certain rights regarding your personal information. We provide the following rights to all users:
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">7.1 Access Your Data</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              You have the right to request a copy of the personal information we hold about you.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">7.2 Correct Your Data</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              You can update your account information at any time through your account settings. You may also request that we correct any inaccurate information.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">7.3 Delete Your Data</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              You may delete your account at any time. Upon deletion, your data will be retained for 30 days and then permanently deleted, unless we are required to retain it for legal purposes.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">7.4 Export Your Data</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              You have the right to request a copy of your data in a portable, machine-readable format.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">7.5 Opt Out of Marketing Communications</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              You may opt out of receiving non-essential communications from us by following the unsubscribe instructions in any email or by contacting us directly. Note that you cannot opt out of service-related communications (such as password resets or security notices).
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">7.6 Opt Out of Analytics</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              You may request to opt out of non-essential analytics and tracking by contacting us at <a href="mailto:dataofficer@realauthentic.io" className="text-[#166534] hover:underline">dataofficer@realauthentic.io</a>.
            </p>

            <p className="text-[#2A1E17] leading-relaxed mt-4">
              To exercise any of these rights, please contact us at <a href="mailto:dataofficer@realauthentic.io" className="text-[#166534] hover:underline">dataofficer@realauthentic.io</a>. We will respond to your request within 30 days (or sooner if required by applicable law).
            </p>
          </section>

          {/* Section 8 */}
          <section className="mt-10">
            <h2 className="text-2xl font-bold text-[#166534] mb-4">8. United States State Privacy Rights</h2>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">8.1 California Residents (CCPA/CPRA)</h3>
            <p className="text-[#2A1E17] leading-relaxed mb-3">
              If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA):
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#2A1E17]">
              <li><strong>Right to Know:</strong> You have the right to know what personal information we collect, use, and disclose.</li>
              <li><strong>Right to Delete:</strong> You have the right to request deletion of your personal information.</li>
              <li><strong>Right to Correct:</strong> You have the right to correct inaccurate personal information.</li>
              <li><strong>Right to Opt Out of Sale/Sharing:</strong> We do not sell or share your personal information for cross-context behavioral advertising.</li>
              <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your privacy rights.</li>
            </ul>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">8.2 Other US States</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              Residents of Colorado, Connecticut, Virginia, Utah, and other states with comprehensive privacy laws may have similar rights. We honor these rights for all US residents as described in Section 7.
            </p>
          </section>

          {/* Section 9 */}
          <section className="mt-10">
            <h2 className="text-2xl font-bold text-[#166534] mb-4">9. International Users and GDPR</h2>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">9.1 International Data Transfers</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              Our Service is operated in the United States. If you are located outside the United States, please be aware that your information will be transferred to, stored, and processed in the United States. By using the Service, you consent to this transfer.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">9.2 European Economic Area, United Kingdom, and Switzerland</h3>
            <p className="text-[#2A1E17] leading-relaxed mb-3">
              If you are located in the European Economic Area (EEA), United Kingdom (UK), or Switzerland, you have additional rights under the General Data Protection Regulation (GDPR) and similar laws:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#2A1E17]">
              <li><strong>Legal Basis for Processing:</strong> We process your personal data based on: (a) your consent; (b) the necessity to perform a contract with you; (c) our legitimate interests in operating and improving the Service; or (d) compliance with legal obligations.</li>
              <li><strong>Right to Access:</strong> You have the right to access your personal data.</li>
              <li><strong>Right to Rectification:</strong> You have the right to correct inaccurate personal data.</li>
              <li><strong>Right to Erasure:</strong> You have the right to request deletion of your personal data.</li>
              <li><strong>Right to Restrict Processing:</strong> You have the right to restrict how we process your personal data in certain circumstances.</li>
              <li><strong>Right to Data Portability:</strong> You have the right to receive your personal data in a structured, machine-readable format.</li>
              <li><strong>Right to Object:</strong> You have the right to object to processing based on legitimate interests.</li>
              <li><strong>Right to Withdraw Consent:</strong> Where we rely on consent, you have the right to withdraw it at any time.</li>
              <li><strong>Right to Lodge a Complaint:</strong> You have the right to lodge a complaint with a supervisory authority in your jurisdiction.</li>
            </ul>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">9.3 Data Protection Officer</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              For privacy inquiries, including exercising your GDPR rights, please contact our privacy team: Jena at <a href="mailto:dataofficer@realauthentic.io" className="text-[#166534] hover:underline">dataofficer@realauthentic.io</a>.
            </p>
          </section>

          {/* Section 10 */}
          <section className="mt-10">
            <h2 className="text-2xl font-bold text-[#166534] mb-4">10. Children's Privacy</h2>
            <p className="text-[#2A1E17] leading-relaxed">
              Our Service is designed for use by educators and is not directed to children under 13 years of age (or 16 in the EEA). We do not knowingly collect personal information directly from children. Teachers may use our Service to create educational materials, but the Service itself is not intended for student use.
            </p>
            <p className="text-[#2A1E17] leading-relaxed mt-4">
              If you believe that a child has provided us with personal information, please contact us at <a href="mailto:dataofficer@realauthentic.io" className="text-[#166534] hover:underline">dataofficer@realauthentic.io</a>, and we will take steps to delete such information.
            </p>
          </section>

          {/* Section 11 */}
          <section className="mt-10">
            <h2 className="text-2xl font-bold text-[#166534] mb-4">11. Cookies and Tracking Technologies</h2>
            <p className="text-[#2A1E17] leading-relaxed mb-3">
              We use cookies and similar tracking technologies to operate and improve the Service. These include:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#2A1E17]">
              <li><strong>Essential Cookies:</strong> Required for the Service to function, including session management and authentication. These cannot be disabled.</li>
              <li><strong>Analytics Cookies:</strong> Help us understand how users interact with the Service. You may opt out of these by contacting us.</li>
            </ul>
            <p className="text-[#2A1E17] leading-relaxed mt-4">
              Most web browsers allow you to control cookies through their settings. However, disabling essential cookies may affect your ability to use the Service.
            </p>
          </section>

          {/* Section 12 */}
          <section className="mt-10">
            <h2 className="text-2xl font-bold text-[#166534] mb-4">12. Third-Party Links and Services</h2>
            <p className="text-[#2A1E17] leading-relaxed">
              The Service may contain links to third-party websites or integrate with third-party services (such as Google, Microsoft, or Canvas LMS for authentication). This Privacy Policy does not apply to those third-party services. We encourage you to review the privacy policies of any third-party services you access.
            </p>
          </section>

          {/* Section 13 */}
          <section className="mt-10">
            <h2 className="text-2xl font-bold text-[#166534] mb-4">13. Changes to This Privacy Policy</h2>
            <p className="text-[#2A1E17] leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices or applicable law. We will notify you of material changes by posting the updated policy on our website and updating the "Effective Date" above. For significant changes, we may also notify you by email. Your continued use of the Service after such changes constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          {/* Section 14 */}
          <section className="mt-10">
            <h2 className="text-2xl font-bold text-[#166534] mb-4">14. Contact Us</h2>
            <p className="text-[#2A1E17] leading-relaxed mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us:
            </p>
            <div className="bg-[#166534]/5 p-6 rounded-lg">
              <p className="text-[#2A1E17] font-semibold mb-2">REAL Authentic Learning Studio, LLC</p>
              <p className="text-[#2A1E17]">Attn: Jena, Data Protection Officer</p>
              <p className="text-[#2A1E17]">Email: <a href="mailto:dataofficer@realauthentic.io" className="text-[#166534] hover:underline">dataofficer@realauthentic.io</a></p>
              <p className="text-[#2A1E17]">Address: 123 Main Street, St. Paul MN 55113</p>
            </div>
            <p className="text-[#2A1E17] leading-relaxed mt-4">
              We will respond to your inquiry within 30 days.
            </p>
          </section>

          {/* Acknowledgment */}
          <section className="mt-12 pt-8 border-t border-[#166534]/20">
            <p className="text-[#2A1E17] leading-relaxed text-center font-semibold">
              By using the REAL Authentic Learning Studio Service, you acknowledge that you have read and understood this Privacy Policy.
            </p>
          </section>

        </article>
      </main>
    </div>
  );
};

export default Privacy;
