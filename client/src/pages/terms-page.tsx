import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Separator } from "@/components/ui/separator";

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 md:p-10">
            <h1 className="text-3xl font-bold text-neutral-900 mb-6">Terms of Service</h1>
            <p className="text-neutral-500 mb-8">Last updated: April, 2025</p>
            
            <div className="prose max-w-none text-neutral-700">
              <p>
                Welcome to NutriScan. Please read these Terms of Service ("Terms") carefully as they contain important information about your legal rights, remedies, and obligations. By accessing or using the NutriScan service, you agree to comply with and be bound by these Terms.
              </p>
              
              <h2>1. Acceptance of Terms</h2>
              <p>
                By creating an account, accessing, or using our Services, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not access or use our Services.
              </p>
              
              <h2>2. Description of Service</h2>
              <p>
                NutriScan is an AI-powered application that provides nutritional analysis of food through image recognition technology. Our services include but are not limited to:
              </p>
              <ul>
                <li>Food image analysis and nutritional information</li>
                <li>Personalized nutrition tracking and insights</li>
                <li>Meal history and progress tracking</li>
              </ul>
              
              <h2>3. User Accounts</h2>
              <p>
                To use certain features of our Services, you must create an account. You are responsible for maintaining the confidentiality of your account information, including your password, and for all activity that occurs under your account. You agree to notify us immediately of any unauthorized access to or use of your account.
              </p>
              
              <h2>4. Use of Service</h2>
              <p>
                You agree to use the Service only for purposes that are permitted by these Terms and in compliance with all applicable laws and regulations. You may not:
              </p>
              <ul>
                <li>Use the Service for any illegal purpose or to violate any laws</li>
                <li>Upload viruses or malicious code or content</li>
                <li>Attempt to access accounts, systems, or data not belonging to you</li>
                <li>Interfere with or disrupt the integrity or performance of the Service</li>
                <li>Reproduce, duplicate, copy, sell, trade, or resell any portion of the Service</li>
              </ul>
              
              <h2>5. User Content</h2>
              <p>
                Our Service allows you to upload, store, and share content, including food images and nutritional data ("User Content"). You retain all rights to your User Content, but you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, and display such User Content for the purpose of providing and improving our Services.
              </p>
              
              <h2>6. Data Privacy</h2>
              <p>
                We collect and process personal information as described in our Privacy Policy. By using our Service, you consent to such processing and you represent that all information you provide is accurate.
              </p>
              
              <h2>7. Intellectual Property</h2>
              <p>
                The Service and its original content, features, and functionality are owned by NutriScan and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
              </p>
              
              <h2>8. Subscription Plans and Payments</h2>
              <p>
                We offer both free and paid subscription plans. By selecting a paid plan, you agree to pay all fees applicable to the selected plan. We may change our fees at any time, but changes will not apply retroactively and will provide notice of changes.
              </p>
              
              <h2>9. Termination</h2>
              <p>
                We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms. Upon termination, your right to use the Service will cease immediately.
              </p>
              
              <h2>10. Disclaimer of Warranties</h2>
              <p>
                The Service is provided on an "as is" and "as available" basis. NutriScan makes no warranties, express or implied, regarding the accuracy of nutritional information provided through the Service. The information provided is for informational purposes only and should not be considered medical advice.
              </p>
              
              <h2>11. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, in no event shall NutriScan be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of or inability to use the Service.
              </p>
              
              <h2>12. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the United States and the State of California, without regard to its conflict of law provisions.
              </p>
              
              <h2>13. Changes to Terms</h2>
              <p>
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
              </p>
              
              <h2>14. Contact Us</h2>
              <p>
                If you have any questions about these Terms, please contact us at legal@nutriscan.app.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}