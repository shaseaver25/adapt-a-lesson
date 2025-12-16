import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Terms = () => {
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
          <h1 className="text-4xl font-bold text-[#2A1E17] mb-2">Terms of Service</h1>
          <p className="text-[#D97706] font-semibold text-lg mb-8">Effective Date: January 1, 2025</p>
          
          <p className="text-[#2A1E17] leading-relaxed">
            Welcome to REAL Authentic Learning Studio. These Terms of Service ("Terms") govern your access to and use of our AI-powered educational productivity platform, including our website, applications, and related services (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms.
          </p>
          
          <p className="text-[#2A1E17] leading-relaxed font-semibold">
            Please read these Terms carefully. If you do not agree to these Terms, you may not access or use the Service.
          </p>

          <section className="mt-10">
            <h2 className="text-2xl font-bold text-[#166534] mb-4">1. Definitions</h2>
            <ul className="list-none pl-0 space-y-3">
              <li><strong className="text-[#2A1E17]">"Account"</strong> means your registered account to access and use the Service.</li>
              <li><strong className="text-[#2A1E17]">"Content"</strong> means any text, data, information, images, or other materials uploaded, submitted, or generated through the Service.</li>
              <li><strong className="text-[#2A1E17]">"Educational Institution"</strong> means any school, school district, college, university, or other educational organization.</li>
              <li><strong className="text-[#2A1E17]">"Student Data"</strong> means any personally identifiable information or educational records related to students, including but not limited to information protected under FERPA, COPPA, and applicable state student privacy laws.</li>
              <li><strong className="text-[#2A1E17]">"User," "you," or "your"</strong> means any individual or entity accessing or using the Service, including teachers, administrators, and other educational professionals.</li>
              <li><strong className="text-[#2A1E17]">"We," "us," or "our"</strong> means REAL Authentic Learning Studio, LLC.</li>
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-bold text-[#166534] mb-4">2. Eligibility and Account Registration</h2>
            
            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">2.1 Eligibility</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              The Service is intended for use by educators and educational professionals who are at least 18 years of age. By using the Service, you represent and warrant that you meet this eligibility requirement and have the legal authority to enter into these Terms.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">2.2 Account Creation</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              To access certain features of the Service, you must create an Account. You agree to provide accurate, current, and complete information during registration and to keep your Account information updated. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your Account.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">2.3 Account Security</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              You must immediately notify us at <a href="mailto:support@realauthentic.io" className="text-[#166534] hover:underline">support@realauthentic.io</a> if you become aware of any unauthorized use of your Account or any other breach of security. We are not liable for any loss or damage arising from your failure to protect your Account credentials.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">2.4 Device Limitations</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              Your Account may be accessed on a maximum of three (3) devices simultaneously. Attempts to exceed this limit may result in denial of access or Account suspension.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-bold text-[#166534] mb-4">3. Use of the Service</h2>
            
            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">3.1 License Grant</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for your internal educational and professional purposes.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">3.2 Acceptable Use</h3>
            <p className="text-[#2A1E17] leading-relaxed mb-3">
              You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-[#2A1E17]">
              <li>Use the Service in any way that violates applicable federal, state, local, or international laws or regulations</li>
              <li>Upload, transmit, or distribute any content that is unlawful, harmful, threatening, abusive, harassing, defamatory, or otherwise objectionable</li>
              <li>Impersonate any person or entity or falsely state or misrepresent your affiliation with a person or entity</li>
              <li>Attempt to gain unauthorized access to the Service, other user accounts, or computer systems or networks connected to the Service</li>
              <li>Interfere with or disrupt the Service or servers or networks connected to the Service</li>
              <li>Use any automated means to access the Service, including bots, scrapers, or crawlers, without our express written permission</li>
              <li>Reverse engineer, decompile, disassemble, or otherwise attempt to discover the source code of the Service</li>
              <li>Use the Service to generate content that infringes on intellectual property rights of third parties</li>
            </ul>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">3.3 AI-Generated Content</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              The Service uses artificial intelligence to assist in creating educational materials. You acknowledge that AI-generated content may contain errors, inaccuracies, or biases. You are solely responsible for reviewing, verifying, and appropriately modifying any AI-generated content before use in educational settings. We do not guarantee the accuracy, completeness, or suitability of any AI-generated content.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-bold text-[#166534] mb-4">4. Student Data and Privacy</h2>
            
            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">4.1 FERPA Compliance</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              We understand the importance of protecting Student Data. When we receive Student Data from Educational Institutions, we act as a "school official" under the Family Educational Rights and Privacy Act (FERPA) and agree to comply with FERPA requirements. We will use Student Data only for the purposes for which it was disclosed to us and will not disclose Student Data to third parties except as permitted by FERPA or as directed by the Educational Institution.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">4.2 COPPA Compliance</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              The Service is not directed to children under 13 years of age. We do not knowingly collect personal information directly from children under 13. If you are an educator using the Service with students under 13, you represent and warrant that you have obtained all necessary consents from parents or guardians as required by the Children's Online Privacy Protection Act (COPPA) and that you are providing any Student Data to us on behalf of the Educational Institution.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">4.3 State Student Privacy Laws</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              We are committed to complying with applicable state student privacy laws, including but not limited to the California Student Online Personal Information Protection Act (SOPIPA), the New York Education Law 2-d, and similar state laws. We will enter into Student Data Privacy Agreements (SDPAs) with Educational Institutions upon request.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">4.4 Data Minimization</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              We collect and retain only the minimum amount of Student Data necessary to provide the Service. We do not use Student Data for targeted advertising or to create advertising profiles.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">4.5 Data Security</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              We implement reasonable administrative, technical, and physical safeguards designed to protect Student Data from unauthorized access, disclosure, alteration, or destruction. In the event of a data breach affecting Student Data, we will notify affected Educational Institutions in accordance with applicable law.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-bold text-[#166534] mb-4">5. Intellectual Property Rights</h2>
            
            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">5.1 Our Intellectual Property</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              The Service and its original content, features, and functionality are owned by REAL Authentic Learning Studio, LLC and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. Our trademarks and trade dress may not be used without our prior written consent.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">5.2 Your Content</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              You retain ownership of any Content you create or upload to the Service. By uploading Content, you grant us a limited, non-exclusive, royalty-free license to use, store, and process your Content solely to provide and improve the Service. This license terminates when you delete your Content or Account, except for Content that has been shared with others or incorporated into aggregated, anonymized data.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">5.3 AI-Generated Content Ownership</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              Content generated by the Service's AI features based on your inputs belongs to you, subject to any applicable third-party rights. You are responsible for ensuring your use of AI-generated content does not infringe on the rights of others.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">5.4 Feedback</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              If you provide us with feedback, suggestions, or ideas regarding the Service, you grant us a perpetual, irrevocable, worldwide, royalty-free license to use, modify, and incorporate such feedback without any obligation to you.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-bold text-[#166534] mb-4">6. Subscription and Payment</h2>
            
            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">6.1 Subscription Plans</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              Access to certain features of the Service may require a paid subscription. Subscription details, including pricing and features, are available on our website and may be updated from time to time.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">6.2 Payment Terms</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              By subscribing to a paid plan, you agree to pay all applicable fees. Fees are non-refundable except as expressly provided in these Terms or required by law. We may change our fees upon reasonable notice; continued use of the Service after a fee change constitutes acceptance of the new fees.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">6.3 Automatic Renewal</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              Subscriptions automatically renew at the end of each billing period unless you cancel before the renewal date. You may cancel your subscription at any time through your Account settings.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">6.4 Educational Institution Billing</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              If your subscription is paid for by an Educational Institution, the terms of your access may be governed by a separate agreement between us and that institution. Your access may be terminated if the institution discontinues its subscription.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-bold text-[#166534] mb-4">7. Third-Party Services and Integrations</h2>
            <p className="text-[#2A1E17] leading-relaxed">
              The Service may integrate with or contain links to third-party services, including but not limited to Google, Microsoft, and Canvas LMS. Your use of such third-party services is governed by their respective terms and privacy policies. We are not responsible for the content, privacy practices, or availability of third-party services.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-bold text-[#166534] mb-4">8. Disclaimers</h2>
            
            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">8.1 Service Provided "As Is"</h3>
            <p className="text-[#2A1E17] leading-relaxed uppercase text-sm font-medium bg-[#166534]/5 p-4 rounded-lg">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE, OR THAT DEFECTS WILL BE CORRECTED.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">8.2 Educational Content Disclaimer</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              The Service is a tool to assist educators. It is not a substitute for professional judgment, and we make no representations regarding the pedagogical effectiveness or appropriateness of any content generated through the Service. You are solely responsible for evaluating and adapting any materials for use with your students.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">8.3 AI Limitations</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              AI-generated content may contain factual errors, biases, or inappropriate material. We make no warranty that AI outputs will be accurate, complete, current, reliable, or suitable for any particular purpose. You must review all AI-generated content before use.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-bold text-[#166534] mb-4">9. Limitation of Liability</h2>
            <p className="text-[#2A1E17] leading-relaxed uppercase text-sm font-medium bg-[#166534]/5 p-4 rounded-lg mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL REAL AUTHENTIC LEARNING STUDIO, LLC, ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM (A) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE; (B) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICE; (C) ANY CONTENT OBTAINED FROM THE SERVICE; OR (D) UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), OR ANY OTHER LEGAL THEORY, WHETHER OR NOT WE HAVE BEEN INFORMED OF THE POSSIBILITY OF SUCH DAMAGE.
            </p>
            <p className="text-[#2A1E17] leading-relaxed uppercase text-sm font-medium bg-[#166534]/5 p-4 rounded-lg">
              OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU HAVE PAID TO US IN THE TWELVE (12) MONTHS PRIOR TO THE CLAIM OR (B) ONE HUNDRED DOLLARS ($100).
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-bold text-[#166534] mb-4">10. Indemnification</h2>
            <p className="text-[#2A1E17] leading-relaxed">
              You agree to indemnify, defend, and hold harmless REAL Authentic Learning Studio, LLC and its officers, directors, employees, agents, and licensors from and against any claims, liabilities, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or in any way connected with (a) your access to or use of the Service; (b) your violation of these Terms; (c) your violation of any third-party rights, including intellectual property rights or privacy rights; or (d) your Content.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-bold text-[#166534] mb-4">11. Term and Termination</h2>
            
            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">11.1 Term</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              These Terms remain in effect until terminated by either you or us.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">11.2 Termination by You</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              You may terminate your Account at any time by contacting us at <a href="mailto:support@realauthentic.io" className="text-[#166534] hover:underline">support@realauthentic.io</a> or through the Account settings in the Service.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">11.3 Termination by Us</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              We may suspend or terminate your access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms. Upon termination, your right to use the Service will immediately cease.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">11.4 Effect of Termination</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              Upon termination, we will delete your Account and associated data in accordance with our Privacy Policy, subject to any legal obligations to retain certain information. Sections of these Terms that by their nature should survive termination shall survive, including but not limited to intellectual property provisions, disclaimers, limitations of liability, and indemnification.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-bold text-[#166534] mb-4">12. Dispute Resolution</h2>
            
            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">12.1 Informal Resolution</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              Before filing any formal legal action, you agree to contact us at <a href="mailto:support@realauthentic.io" className="text-[#166534] hover:underline">support@realauthentic.io</a> and attempt to resolve the dispute informally for at least thirty (30) days.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">12.2 Arbitration</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              If we cannot resolve a dispute informally, any dispute arising out of or relating to these Terms or the Service shall be resolved by binding arbitration in accordance with the rules of the American Arbitration Association. The arbitration shall be conducted in Minnesota, unless otherwise agreed by the parties. The arbitrator's decision shall be final and binding.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">12.3 Class Action Waiver</h3>
            <p className="text-[#2A1E17] leading-relaxed uppercase text-sm font-medium bg-[#166534]/5 p-4 rounded-lg">
              YOU AND WE AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR OUR INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE ACTION.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">12.4 Exceptions</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              Notwithstanding the foregoing, either party may seek injunctive or other equitable relief in any court of competent jurisdiction to protect its intellectual property rights.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-bold text-[#166534] mb-4">13. General Provisions</h2>
            
            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">13.1 Governing Law</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the State of Minnesota, without regard to its conflict of law provisions.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">13.2 Entire Agreement</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              These Terms, together with our Privacy Policy and any other legal notices or agreements published by us on the Service, constitute the entire agreement between you and us regarding the Service.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">13.3 Severability</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              If any provision of these Terms is held to be invalid or unenforceable, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">13.4 Waiver</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              Our failure to enforce any right or provision of these Terms shall not be deemed a waiver of such right or provision.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">13.5 Assignment</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              You may not assign or transfer these Terms or your rights hereunder without our prior written consent. We may assign these Terms without restriction.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">13.6 Notices</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              We may provide notices to you via email, posting on the Service, or other reasonable means. You may provide notice to us at <a href="mailto:support@realauthentic.io" className="text-[#166534] hover:underline">support@realauthentic.io</a>.
            </p>

            <h3 className="text-xl font-semibold text-[#2A1E17] mt-6 mb-3">13.7 Modifications to Terms</h3>
            <p className="text-[#2A1E17] leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the updated Terms on the Service and updating the "Effective Date" above. Your continued use of the Service after such changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-bold text-[#166534] mb-4">14. Accessibility</h2>
            <p className="text-[#2A1E17] leading-relaxed">
              We are committed to making the Service accessible to all users, including those with disabilities. If you experience any accessibility issues, please contact us at <a href="mailto:support@realauthentic.io" className="text-[#166534] hover:underline">support@realauthentic.io</a> and we will work to address your concerns.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-bold text-[#166534] mb-4">15. Contact Information</h2>
            <p className="text-[#2A1E17] leading-relaxed mb-4">
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="bg-[#166534]/5 p-6 rounded-lg">
              <p className="font-bold text-[#2A1E17] text-lg mb-3">REAL Authentic Learning Studio, LLC</p>
              <p className="text-[#2A1E17]">
                <strong>Email:</strong> <a href="mailto:support@realauthentic.io" className="text-[#166534] hover:underline">support@realauthentic.io</a>
              </p>
              <p className="text-[#2A1E17]">
                <strong>Privacy Inquiries:</strong> <a href="mailto:privacy@realauthentic.io" className="text-[#166534] hover:underline">privacy@realauthentic.io</a>
              </p>
            </div>
          </section>

          <hr className="my-10 border-[#166534]/20" />

          <p className="text-[#2A1E17] leading-relaxed text-center font-medium">
            By using the REAL Authentic Learning Studio Service, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#166534]/10 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-6 text-center text-[#2A1E17]/60 text-sm">
          © {new Date().getFullYear()} REAL Authentic Learning Studio, LLC. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Terms;
