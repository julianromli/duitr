import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Scale, Users, CreditCard, Shield, AlertTriangle } from 'lucide-react';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <motion.header 
        className="py-6 px-6 md:px-10 lg:px-20 border-b border-white/10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link 
            to="/landing" 
            className="flex items-center space-x-2 text-gray-300 hover:text-lime-400 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-2xl font-bold text-lime-400">Duitr</h1>
        </div>
      </motion.header>

      {/* Main Content */}
      <motion.main 
        className="py-12 px-6 md:px-10 lg:px-20"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Title Section */}
          <div className="text-center mb-12">
            <motion.div 
              className="flex justify-center mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="p-4 bg-lime-400/10 rounded-full">
                <FileText className="h-12 w-12 text-lime-400" />
              </div>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-xl text-gray-300">Legal terms and conditions for using Duitr</p>
            <p className="text-sm text-gray-400 mt-4">Last updated: December 2023</p>
          </div>

          {/* Content Sections */}
          <div className="space-y-12">
            {/* Acceptance of Terms */}
            <motion.section 
              className="bg-white/5 border border-white/10 rounded-lg p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <Scale className="h-6 w-6 text-lime-400 mr-3" />
                Acceptance of Terms
              </h2>
              <p className="text-gray-300 leading-relaxed">
                By accessing and using Duitr ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </motion.section>

            {/* Service Description */}
            <motion.section 
              className="bg-white/5 border border-white/10 rounded-lg p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-semibold mb-6">Service Description</h2>
              <div className="space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  Duitr is a personal finance management application that provides:
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium text-lime-400">Core Features</h3>
                    <ul className="text-gray-300 space-y-2">
                      <li>• Transaction tracking and categorization</li>
                      <li>• Multi-wallet management</li>
                      <li>• Budget creation and monitoring</li>
                      <li>• Financial analytics and insights</li>
                      <li>• Expense and income logging</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium text-lime-400">Additional Services</h3>
                    <ul className="text-gray-300 space-y-2">
                      <li>• PWA installation and offline access</li>
                      <li>• Data export capabilities</li>
                      <li>• Multi-language support</li>
                      <li>• Real-time synchronization</li>
                      <li>• Loan and debt management</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* User Accounts */}
            <motion.section 
              className="bg-white/5 border border-white/10 rounded-lg p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <Users className="h-6 w-6 text-lime-400 mr-3" />
                User Accounts & Responsibilities
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3 text-lime-400">Account Creation</h3>
                  <ul className="text-gray-300 space-y-2 ml-4">
                    <li>• You must provide accurate and complete information</li>
                    <li>• You are responsible for maintaining account security</li>
                    <li>• One account per person; sharing accounts is prohibited</li>
                    <li>• You must be at least 13 years old to use the service</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-3 text-lime-400">User Responsibilities</h3>
                  <ul className="text-gray-300 space-y-2 ml-4">
                    <li>• Maintain the confidentiality of your login credentials</li>
                    <li>• Notify us immediately of any unauthorized access</li>
                    <li>• Use the service only for lawful purposes</li>
                    <li>• Ensure accuracy of financial data you input</li>
                  </ul>
                </div>
              </div>
            </motion.section>

            {/* Financial Data */}
            <motion.section 
              className="bg-white/5 border border-white/10 rounded-lg p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <CreditCard className="h-6 w-6 text-lime-400 mr-3" />
                Financial Data & Accuracy
              </h2>
              <div className="space-y-4">
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="text-yellow-500 font-medium mb-2">Important Disclaimer</p>
                      <p className="text-gray-300 text-sm">
                        Duitr is a personal finance tracking tool. We do not provide financial advice, investment recommendations, or banking services.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-lime-400">Data Accuracy</h3>
                  <ul className="text-gray-300 space-y-2 ml-4">
                    <li>• You are responsible for the accuracy of all financial data entered</li>
                    <li>• We do not verify or validate your financial information</li>
                    <li>• Analytics and insights are based on data you provide</li>
                    <li>• We are not liable for decisions made based on app data</li>
                  </ul>
                </div>
              </div>
            </motion.section>

            {/* Service Availability */}
            <motion.section 
              className="bg-white/5 border border-white/10 rounded-lg p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-semibold mb-6">Service Availability & Modifications</h2>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium text-lime-400">Availability</h3>
                    <ul className="text-gray-300 space-y-2">
                      <li>• Service provided "as is" and "as available"</li>
                      <li>• We strive for 99.9% uptime but cannot guarantee it</li>
                      <li>• Maintenance windows may cause temporary unavailability</li>
                      <li>• Offline functionality available through PWA</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium text-lime-400">Modifications</h3>
                    <ul className="text-gray-300 space-y-2">
                      <li>• We may modify features with reasonable notice</li>
                      <li>• Critical security updates may be applied immediately</li>
                      <li>• New features may be added without notice</li>
                      <li>• Terms may be updated with 30 days notice</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Data Ownership */}
            <motion.section 
              className="bg-white/5 border border-white/10 rounded-lg p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <Shield className="h-6 w-6 text-lime-400 mr-3" />
                Data Ownership & Export
              </h2>
              <div className="space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  Your financial data belongs to you. We provide tools to ensure you maintain control:
                </p>
                <ul className="text-gray-300 space-y-2 ml-4">
                  <li>• <strong>Data Ownership:</strong> You retain full ownership of your financial data</li>
                  <li>• <strong>Export Rights:</strong> Export your data to Excel/CSV at any time</li>
                  <li>• <strong>Data Portability:</strong> Take your data with you if you leave the service</li>
                  <li>• <strong>Deletion Rights:</strong> Request complete data deletion upon account closure</li>
                </ul>
              </div>
            </motion.section>

            {/* Prohibited Uses */}
            <motion.section 
              className="bg-white/5 border border-white/10 rounded-lg p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-semibold mb-6">Prohibited Uses</h2>
              <div className="space-y-4">
                <p className="text-gray-300 leading-relaxed">You may not use Duitr for:</p>
                <div className="grid md:grid-cols-2 gap-6">
                  <ul className="text-gray-300 space-y-2">
                    <li>• Illegal activities or money laundering</li>
                    <li>• Violating any applicable laws or regulations</li>
                    <li>• Attempting to hack or compromise the service</li>
                    <li>• Sharing accounts or selling access</li>
                  </ul>
                  <ul className="text-gray-300 space-y-2">
                    <li>• Reverse engineering the application</li>
                    <li>• Automated data scraping or mining</li>
                    <li>• Uploading malicious content or code</li>
                    <li>• Impersonating other users or entities</li>
                  </ul>
                </div>
              </div>
            </motion.section>

            {/* Intellectual Property */}
            <motion.section 
              className="bg-white/5 border border-white/10 rounded-lg p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-semibold mb-6">Intellectual Property</h2>
              <div className="space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  The Duitr application, including its design, code, features, and branding, is protected by intellectual property laws:
                </p>
                <ul className="text-gray-300 space-y-2 ml-4">
                  <li>• All rights to the Duitr application and brand are reserved</li>
                  <li>• You may not copy, modify, or distribute our code or design</li>
                  <li>• The Duitr name and logo are our trademarks</li>
                  <li>• Open source components are governed by their respective licenses</li>
                </ul>
              </div>
            </motion.section>

            {/* Limitation of Liability */}
            <motion.section 
              className="bg-white/5 border border-white/10 rounded-lg p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-semibold mb-6">Limitation of Liability</h2>
              <div className="space-y-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-red-400 font-medium mb-2">Important Legal Notice</p>
                  <p className="text-gray-300 text-sm">
                    Duitr is provided "as is" without warranties. We are not liable for financial decisions made based on app data.
                  </p>
                </div>
                <ul className="text-gray-300 space-y-2 ml-4">
                  <li>• We do not guarantee the accuracy of calculations or analytics</li>
                  <li>• We are not responsible for financial losses or decisions</li>
                  <li>• Our liability is limited to the amount paid for the service</li>
                  <li>• We are not liable for data loss due to user error</li>
                </ul>
              </div>
            </motion.section>

            {/* Termination */}
            <motion.section 
              className="bg-white/5 border border-white/10 rounded-lg p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-semibold mb-6">Account Termination</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-lime-400">By You</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• Delete your account at any time</li>
                    <li>• Export your data before deletion</li>
                    <li>• Account deletion is permanent</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-lime-400">By Us</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• For violation of these terms</li>
                    <li>• For illegal or harmful activities</li>
                    <li>• With reasonable notice when possible</li>
                  </ul>
                </div>
              </div>
            </motion.section>

            {/* Governing Law */}
            <motion.section 
              className="bg-white/5 border border-white/10 rounded-lg p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-semibold mb-6">Governing Law & Disputes</h2>
              <div className="space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  These terms are governed by applicable laws in the jurisdiction where Duitr operates. Any disputes will be resolved through:
                </p>
                <ul className="text-gray-300 space-y-2 ml-4">
                  <li>• Good faith negotiation as the first step</li>
                  <li>• Mediation if negotiation fails</li>
                  <li>• Arbitration or court proceedings as a last resort</li>
                  <li>• Compliance with local consumer protection laws</li>
                </ul>
              </div>
            </motion.section>

            {/* Contact Information */}
            <motion.section 
              className="bg-lime-400/10 border border-lime-400/20 rounded-lg p-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-semibold mb-6 text-lime-400">Contact & Support</h2>
              <div className="space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  Questions about these terms or need support? We're here to help:
                </p>
                <div className="space-y-2 text-gray-300">
                  <p>• Email: faizintifada@gmail.com</p>
                  <p>• Support: Create an issue in our GitHub repository</p>
                  <p>• General inquiries: faizintifada@gmail.com</p>
                  <p>• Response time: We aim to respond within 48 hours</p>
                </div>
              </div>
            </motion.section>
          </div>
        </div>
      </motion.main>

      {/* Footer */}
      <motion.footer 
        className="py-8 px-6 md:px-10 lg:px-20 border-t border-white/10 bg-black"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-400 text-sm">
            © 2023 Duitr. All rights reserved. | 
            <Link to="/privacy" className="text-lime-400 hover:text-lime-300 ml-2">Privacy Policy</Link>
          </p>
        </div>
      </motion.footer>
    </div>
  );
};

export default TermsOfService;