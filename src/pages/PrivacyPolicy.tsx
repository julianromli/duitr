import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Eye, Lock, Database, Globe, Smartphone } from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen w-full relative text-white">
      {/* Emerald Void */}
      <div 
        className="absolute inset-0 z-0" 
        style={{ 
          background: "radial-gradient(125% 125% at 50% 90%, #000000 40%, #072607 100%)", 
        }} 
      />
      {/* Header */}
      <motion.header 
        className="py-6 px-6 md:px-10 lg:px-20 border-b border-white/10 relative z-10"
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
        className="py-12 px-6 md:px-10 lg:px-20 relative z-10"
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
                <Shield className="h-12 w-12 text-lime-400" />
              </div>
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-xl text-gray-300">How we protect and handle your financial data</p>
            <p className="text-sm text-gray-400 mt-4">Last updated: December 2023</p>
          </div>

          {/* Content Sections */}
          <div className="space-y-12">
            {/* Introduction */}
            <motion.section 
              className="bg-white/5 border border-white/10 rounded-lg p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <Eye className="h-6 w-6 text-lime-400 mr-3" />
                Introduction
              </h2>
              <p className="text-gray-300 leading-relaxed">
                At Duitr, we are committed to protecting your privacy and ensuring the security of your personal and financial information. This Privacy Policy explains how we collect, use, store, and protect your data when you use our personal finance management application.
              </p>
            </motion.section>

            {/* Information We Collect */}
            <motion.section 
              className="bg-white/5 border border-white/10 rounded-lg p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <Database className="h-6 w-6 text-lime-400 mr-3" />
                Information We Collect
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-3 text-lime-400">Personal Information</h3>
                  <ul className="text-gray-300 space-y-2 ml-4">
                    <li>• Email address and account credentials</li>
                    <li>• Profile information (name, preferences)</li>
                    <li>• Language and theme preferences</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-3 text-lime-400">Financial Data</h3>
                  <ul className="text-gray-300 space-y-2 ml-4">
                    <li>• Transaction records (expenses, income, transfers)</li>
                    <li>• Wallet and account information</li>
                    <li>• Budget categories and spending limits</li>
                    <li>• Financial goals and wishlist items</li>
                    <li>• Loan and debt information</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-3 text-lime-400">Usage Information</h3>
                  <ul className="text-gray-300 space-y-2 ml-4">
                    <li>• App usage patterns and feature interactions</li>
                    <li>• Device information and operating system</li>
                    <li>• IP address and general location data</li>
                  </ul>
                </div>
              </div>
            </motion.section>

            {/* How We Use Your Information */}
            <motion.section 
              className="bg-white/5 border border-white/10 rounded-lg p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <h2 className="text-2xl font-semibold mb-6">How We Use Your Information</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-lime-400">Core Services</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• Process and categorize transactions</li>
                    <li>• Generate financial insights and analytics</li>
                    <li>• Manage budgets and spending alerts</li>
                    <li>• Synchronize data across devices</li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-lime-400">Improvements</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• Enhance app performance and features</li>
                    <li>• Provide customer support</li>
                    <li>• Ensure security and prevent fraud</li>
                    <li>• Comply with legal requirements</li>
                  </ul>
                </div>
              </div>
            </motion.section>

            {/* Data Security */}
            <motion.section 
              className="bg-white/5 border border-white/10 rounded-lg p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <Lock className="h-6 w-6 text-lime-400 mr-3" />
                Data Security & Storage
              </h2>
              <div className="space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  We use industry-standard security measures to protect your data:
                </p>
                <ul className="text-gray-300 space-y-2 ml-4">
                  <li>• <strong>Encryption:</strong> All data is encrypted in transit and at rest</li>
                  <li>• <strong>Supabase Security:</strong> We use Supabase's enterprise-grade infrastructure</li>
                  <li>• <strong>Row Level Security:</strong> Your data is isolated and accessible only to you</li>
                  <li>• <strong>JWT Authentication:</strong> Secure token-based authentication</li>
                  <li>• <strong>Regular Backups:</strong> Automated data backups for disaster recovery</li>
                </ul>
                <div className="bg-lime-400/10 border border-lime-400/20 rounded-lg p-4 mt-6">
                  <p className="text-lime-400 font-medium">🔒 Your financial data is stored securely in PostgreSQL databases with enterprise-grade security.</p>
                </div>
              </div>
            </motion.section>

            {/* PWA and Offline Data */}
            <motion.section 
              className="bg-white/5 border border-white/10 rounded-lg p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <Smartphone className="h-6 w-6 text-lime-400 mr-3" />
                PWA & Offline Functionality
              </h2>
              <div className="space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  Duitr functions as a Progressive Web App (PWA) with offline capabilities:
                </p>
                <ul className="text-gray-300 space-y-2 ml-4">
                  <li>• Data is cached locally for offline access</li>
                  <li>• Offline transactions are synchronized when connection is restored</li>
                  <li>• Service workers handle background data synchronization</li>
                  <li>• Local storage is encrypted and secure</li>
                </ul>
              </div>
            </motion.section>

            {/* Data Sharing */}
            <motion.section 
              className="bg-white/5 border border-white/10 rounded-lg p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              <h2 className="text-2xl font-semibold mb-6 flex items-center">
                <Globe className="h-6 w-6 text-lime-400 mr-3" />
                Data Sharing & Third Parties
              </h2>
              <div className="space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  We do not sell, trade, or rent your personal information to third parties. We may share data only in these limited circumstances:
                </p>
                <ul className="text-gray-300 space-y-2 ml-4">
                  <li>• <strong>Service Providers:</strong> Supabase for database and authentication services</li>
                  <li>• <strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                  <li>• <strong>Business Transfers:</strong> In case of merger or acquisition (with user notification)</li>
                </ul>
              </div>
            </motion.section>

            {/* Your Rights */}
            <motion.section 
              className="bg-white/5 border border-white/10 rounded-lg p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.0 }}
            >
              <h2 className="text-2xl font-semibold mb-6">Your Rights & Controls</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-lime-400">Data Access</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• View all your stored data</li>
                    <li>• Export data to Excel/CSV</li>
                    <li>• Request data corrections</li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-lime-400">Data Control</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• Delete your account and data</li>
                    <li>• Opt-out of data processing</li>
                    <li>• Control data sharing preferences</li>
                  </ul>
                </div>
              </div>
            </motion.section>

            {/* International Users */}
            <motion.section 
              className="bg-white/5 border border-white/10 rounded-lg p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
            >
              <h2 className="text-2xl font-semibold mb-6">International Users</h2>
              <div className="space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  Duitr supports users globally with multi-language capabilities (English and Indonesian). We comply with applicable data protection laws including GDPR for European users and other regional privacy regulations.
                </p>
              </div>
            </motion.section>

            {/* Contact Information */}
            <motion.section 
              className="bg-lime-400/10 border border-lime-400/20 rounded-lg p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <h2 className="text-2xl font-semibold mb-6 text-lime-400">Contact Us</h2>
              <div className="space-y-4">
                <p className="text-gray-300 leading-relaxed">
                  If you have any questions about this Privacy Policy or how we handle your data, please contact us:
                </p>
                <div className="space-y-2 text-gray-300">
                  <p>• Email: faizintifada@gmail.com</p>
                  <p>• Support: Create an issue in our GitHub repository</p>
                  <p>• Response time: We aim to respond within 48 hours</p>
                </div>
              </div>
            </motion.section>
          </div>
        </div>
      </motion.main>

      {/* Footer */}
      <motion.footer 
        className="py-8 px-6 md:px-10 lg:px-20 border-t border-white/10 bg-black relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.3 }}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="flex flex-col md:flex-row justify-between items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.3 }}
          >
            <div className="mb-4 md:mb-0">
              <h1 className="text-xl font-bold text-lime-400">Duitr</h1>
              <p className="text-sm text-gray-300 mt-1">Smart Money, Smarter Future</p>
            </div>
            <div className="flex space-x-6">
              <a href="https://threads.com/faizintifada" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-lime-400 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.5 12.01c0-3.576.85-6.43 2.495-8.481C5.845 1.225 8.598.044 12.179.02h.014c3.581.024 6.334 1.205 8.184 3.509C21.65 5.58 22.5 8.434 22.5 12.01c0 3.576-.85 6.43-2.495 8.481C18.155 22.775 15.402 23.956 11.821 23.98h-.007zm.014-21.46h-.014c-2.769.02-4.943.725-6.458 2.095C4.239 6.34 3.5 8.537 3.5 12.01c0 3.473.739 5.67 2.228 7.375 1.515 1.37 3.689 2.075 6.458 2.095h.014c2.769-.02 4.943-.725 6.458-2.095C19.761 17.68 20.5 15.483 20.5 12.01c0-3.473-.739-5.67-2.228-7.375C16.757 3.265 14.583 2.56 11.814 2.54h-.014z" />
                  <path d="M12 16.5c-2.485 0-4.5-2.015-4.5-4.5s2.015-4.5 4.5-4.5 4.5 2.015 4.5 4.5-2.015 4.5-4.5 4.5zm0-7c-1.378 0-2.5 1.122-2.5 2.5s1.122 2.5 2.5 2.5 2.5-1.122 2.5-2.5-1.122-2.5-2.5-2.5z" />
                </svg>
              </a>
              <a href="https://x.com/faizintfd" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-lime-400 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="https://instagram.com/faizintifada" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-lime-400 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </motion.div>
          <motion.div 
            className="mt-8 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
          >
            <p className="text-sm text-gray-300">© {new Date().getFullYear()} Duitr. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link to="/privacy" className="text-sm text-gray-300 hover:text-lime-400 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="text-sm text-gray-300 hover:text-lime-400 transition-colors">Terms of Service</Link>
              <a href="mailto:faizintifada@gmail.com" className="text-sm text-gray-300 hover:text-lime-400 transition-colors">Contact Us</a>
            </div>
          </motion.div>
        </div>
      </motion.footer>
    </div>
  );
};

export default PrivacyPolicy;