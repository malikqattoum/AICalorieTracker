
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Separator } from "@/components/ui/separator";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 md:p-10">
            <h1 className="text-3xl font-bold text-neutral-900 mb-6">Privacy Policy</h1>
            <p className="text-neutral-500 mb-8">Last updated: April, 2025</p>
            
            <div className="prose max-w-none text-neutral-700">
              <p>
                At NutriScan, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information.
              </p>
              
              <h2>1. Information We Collect</h2>
              <p>We collect the following types of information:</p>
              <ul>
                <li>Account information (email, name, password)</li>
                <li>Food images and nutritional data</li>
                <li>Usage data and analytics</li>
                <li>Device information</li>
              </ul>
              
              <h2>2. How We Use Your Information</h2>
              <p>We use your information to:</p>
              <ul>
                <li>Provide and improve our services</li>
                <li>Analyze food images and generate nutritional information</li>
                <li>Send important updates and notifications</li>
                <li>Personalize your experience</li>
              </ul>
              
              <h2>3. Data Storage and Security</h2>
              <p>
                We implement industry-standard security measures to protect your data. Your information is encrypted both in transit and at rest.
              </p>
              
              <h2>4. Data Sharing</h2>
              <p>
                We do not sell your personal information. We may share data with service providers who help us deliver our services, subject to strict confidentiality agreements.
              </p>
              
              <h2>5. Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Export your data</li>
              </ul>
              
              <h2>6. Cookies and Tracking</h2>
              <p>
                We use cookies and similar technologies to improve your experience and analyze usage patterns.
              </p>
              
              <h2>7. Changes to Privacy Policy</h2>
              <p>
                We may update this policy periodically. We will notify you of any significant changes.
              </p>
              
              <h2>8. Contact Us</h2>
              <p>
                If you have questions about our privacy practices, please contact us at privacy@nutriscan.app.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
