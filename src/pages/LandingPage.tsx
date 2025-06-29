import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white text-black font-sans relative overflow-hidden">
      {/* Navigation */}
      <header className="py-4 px-6 md:px-10 lg:px-20 border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-green-600">Duitr</h1>
          </div>
          
          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-sm font-medium hover:text-green-600 transition-colors">Home</Link>
            <Link to="/features" className="text-sm font-medium hover:text-green-600 transition-colors">Features</Link>
            <Link to="/product" className="text-sm font-medium hover:text-green-600 transition-colors">Product</Link>
            <Link to="/resources" className="text-sm font-medium hover:text-green-600 transition-colors">Resources</Link>
            <Link to="/community" className="text-sm font-medium hover:text-green-600 transition-colors">Community</Link>
          </nav>
          
          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/login')} 
              className="hidden md:block text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Sign in
            </button>
            <button 
              onClick={() => navigate('/signup')} 
              className="text-sm font-medium px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              Sign up
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-6 md:px-10 lg:px-20">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className={`space-y-6 transition-all duration-700 ${isVisible ? 'opacity-100 transform-none' : 'opacity-0 transform -translate-y-8'}`}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Take Control of Your Money with AI
            </h1>
            <p className="text-lg text-gray-600 max-w-lg">
              Meet your smart finance assistant. Analyse spending, manage debts, and budget effortlessly – all in one app.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
              <button 
                onClick={() => navigate('/signup')} 
                className="px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors shadow-lg"
              >
                Get Started for Free
              </button>
              <button 
                onClick={() => navigate('/features')} 
                className="px-6 py-3 rounded-lg border border-gray-200 font-medium hover:bg-gray-50 transition-colors"
              >
                Explore Features
              </button>
            </div>
          </div>
          
          {/* Hero Image */}
          <div className={`relative transition-all duration-1000 ${isVisible ? 'opacity-100 transform-none' : 'opacity-0 transform translate-y-16'}`}>
            {/* Phone mockup */}
            <div className="relative mx-auto max-w-md">
              {/* Phone image */}
              <img 
                src="/images/iphone-mockup3.png" 
                alt="Duitr App Demo" 
                className="relative z-10 mx-auto w-full transform hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = "/placeholder.svg";
                  
                  // Also add a container with the app mockup
                  const parent = target.parentElement;
                  if (parent) {
                    const mockup = document.createElement('div');
                    mockup.className = "w-[300px] h-[600px] mx-auto bg-[#111] rounded-[40px] p-4 border-4 border-[#333] overflow-hidden shadow-2xl transform rotate-6 hover:rotate-0 transition-transform duration-500";
                    mockup.innerHTML = `
                      <div class="rounded-3xl overflow-hidden h-full bg-[#FACC15] flex flex-col">
                        <div class="bg-green-600 text-white p-5 rounded-t-xl">
                          <p class="font-bold">Hello Faiz Intifada!</p>
                          <p class="text-xs opacity-80">Welcome Back</p>
                          <p class="mt-2 text-sm">Your Balance</p>
                          <p class="text-2xl font-bold">Rp 1.559.149</p>
                        </div>
                        <div class="p-5 flex-1 bg-white">
                          <div class="flex justify-between mb-5">
                            <div class="bg-blue-600 rounded-full py-2 px-4 flex items-center text-sm text-white">
                              <span class="mr-1">↑↓</span> Transfer
                            </div>
                            <div class="bg-green-600 rounded-full py-2 px-4 flex items-center text-sm text-white">
                              <span class="mr-1">+</span> Add Money
                            </div>
                          </div>
                          <p class="text-left mb-2 font-medium text-gray-800">Transactions</p>
                          <div class="space-y-3">
                            <div class="bg-gray-100 p-3 rounded-lg flex justify-between">
                              <span>Subscription</span>
                              <span class="text-red-500">-Rp 338.726</span>
                            </div>
                            <div class="bg-gray-100 p-3 rounded-lg flex justify-between">
                              <span>Food</span>
                              <span class="text-red-500">-Rp 289.000</span>
                            </div>
                            <div class="bg-gray-100 p-3 rounded-lg flex justify-between">
                              <span>Food</span>
                              <span class="text-red-500">-Rp 11.500</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    `;
                    parent.appendChild(mockup);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50 px-6 md:px-10 lg:px-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Core Features</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Spending Analysis</h3>
              <p className="text-gray-600">See where your money goes and how to optimise it automatically.</p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Debt Tracker</h3>
              <p className="text-gray-600">Never lose track of who owes what. Manage debts and paybacks with clarity.</p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Intelligent Budgeting</h3>
              <p className="text-gray-600">Set budgets that actually work for you with AI recommendations.</p>
            </div>
            
            {/* Feature 4 */}
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Comprehensive Finance Hub</h3>
              <p className="text-gray-600">From daily expenses to long-term goals, manage it all in one place.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 md:px-10 lg:px-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to take control of your finances?</h2>
          <p className="text-lg text-gray-600 mb-8">Join thousands of users who have transformed their financial lives with Duitr.</p>
          <button 
            onClick={() => navigate('/signup')} 
            className="px-8 py-4 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors shadow-lg mx-auto"
          >
            Get Started for Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 md:px-10 lg:px-20 border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h1 className="text-xl font-bold text-green-600">Duitr</h1>
              <p className="text-sm text-gray-500 mt-1">Your AI-powered financial assistant</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-500 hover:text-green-600 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-500 hover:text-green-600 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-500 hover:text-green-600 transition-colors">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">© 2023 Duitr. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-sm text-gray-500 hover:text-green-600 transition-colors">Privacy Policy</a>
              <a href="#" className="text-sm text-gray-500 hover:text-green-600 transition-colors">Terms of Service</a>
              <a href="#" className="text-sm text-gray-500 hover:text-green-600 transition-colors">Contact Us</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;