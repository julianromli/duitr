import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Remove the code that redirects to /app
    // Just set the animation timing
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white font-sans relative overflow-hidden">
      {/* Background gradient elements */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-purple-900/20 rounded-full filter blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-lime-500/20 rounded-full filter blur-3xl opacity-20 translate-x-1/2 translate-y-1/2"></div>
      
      {/* Mobile-optimized gradient background */}
      <div className="absolute bottom-0 left-0 right-0 h-[50%] bg-gradient-to-t from-green-900/20 to-transparent opacity-60 md:hidden"></div>
      
      {/* Header */}
      <header className={`p-5 max-w-7xl mx-auto transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0 transform -translate-y-4'}`}>
        {/* Top bar */}
        {/* <div className="flex justify-between items-center mb-6">
          <span className="text-[#D3D3D3] text-xs">Founded in Indonesia. We respect your finances.</span>
          <div className="flex items-center">
            <span className="text-lime-400 mr-1">★★★★★</span>
            <span className="text-[#D3D3D3] text-xs">Used by thousands of happy users</span>
          </div>
        </div> */}
        {/* Logo and menu */}
        <div className="flex justify-between items-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-lime-400 to-green-300 text-transparent bg-clip-text">Duitr</h1>
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#2D2D2D] text-white text-xl hover:bg-[#333333] transition-colors cursor-pointer">☰</div>
        </div>
      </header>

      {/* Hero section */}
      <main className="text-center px-5 max-w-7xl mx-auto relative z-10">
        {/* Trust indicator - made smaller to match reference */}
        <div className={`inline-block bg-gradient-to-r from-[#2D2D2D] to-[#333333] rounded-full py-2 px-4 mb-10 shadow-lg transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 transform-none' : 'opacity-0 transform -translate-y-8'}`}>
          <div className="flex items-center space-x-2">
            <div className="flex -space-x-2">
              {/* Avatar circles with images from Unsplash */}
              <div className="w-8 h-8 rounded-full border-2 border-[#2D2D2D] overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80&auto=format" 
                  alt="User avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-[#2D2D2D] overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80&auto=format" 
                  alt="User avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-[#2D2D2D] overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80&auto=format" 
                  alt="User avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <p className="text-sm font-medium ml-1">Trusted by thousands of people</p>
          </div>
        </div>

        {/* Headline - Mobile optimized version stacks text differently */}
        <div className={`mb-8 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 transform-none' : 'opacity-0 transform -translate-y-8'}`}>
          {/* Desktop version */}
          <h2 className="hidden md:block text-6xl font-bold leading-tight">
            <span className="block">Fastest way to manage</span>
            <span className="block bg-gradient-to-r from-lime-400 to-green-300 text-transparent bg-clip-text">your finances anytime</span>
          </h2>
          
          {/* Mobile version with stacked text */}
          <h2 className="md:hidden text-5xl font-bold leading-tight">
            <span className="block">Fastest way</span>
            <span className="block">to manage</span>
            <span className="block bg-gradient-to-r from-lime-400 to-green-300 text-transparent bg-clip-text mt-2">your finances anytime</span>
          </h2>
          
          {/* <p className="text-[#D3D3D3] mt-6 max-w-xl mx-auto text-sm md:text-base">
            Track expenses, manage budgets, and achieve your financial goals with our intuitive financial management app.
          </p> */}
        </div>

        {/* Login button - positioned with higher z-index to stay above mockup */}
        <div className="relative z-30">
          <button
            onClick={(e) => {
              e.preventDefault();
              navigate('/login');
            }}
            className={`bg-gradient-to-r from-lime-500 to-green-500 text-white text-lg font-bold py-3 px-8 md:py-4 md:px-10 rounded-full hover:from-lime-400 hover:to-green-400 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-lime-800/20 transform hover:-translate-y-1 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 transform-none' : 'opacity-0 transform -translate-y-8'}`}
          >
            <span className="text-black">Login</span> <span className="ml-1 text-black">→</span>
          </button>
        </div>

        {/* Mockup image with the hand holding a phone - positioned to overlap with content */}
        <div className={`relative mt-10 md:mt-0 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 transform-none' : 'opacity-0 transform translate-y-16'}`}>
          {/* Container with negative margin to push image into the button area - adjusted for mobile */}
          <div className="relative mx-auto max-w-5xl md:mt-[-80px]">
            {/* Enhanced glow effect behind phone */}
            <div className="absolute inset-0 bg-gradient-to-b from-lime-500/30 to-green-500/20 filter blur-3xl rounded-full transform scale-125 opacity-70 animate-pulse"></div>
            
            {/* Flare effects */}
            <div className="absolute -top-20 -left-10 w-40 h-40 bg-blue-500/10 rounded-full filter blur-3xl"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full filter blur-3xl"></div>
            
            {/* Phone image with animation - sized larger to match reference */}
            <img 
              src="/iphone-mockup.png" 
              alt="Duitr App Demo" 
              className="relative z-20 mx-auto w-[70%] md:w-[80%] max-w-[700px] transform hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = "/placeholder.svg";
                
                // Also add a container with the app mockup
                const parent = target.parentElement;
                if (parent) {
                  const mockup = document.createElement('div');
                  mockup.className = "w-[350px] h-[700px] mx-auto bg-[#111] rounded-[40px] p-5 border-4 border-[#333] overflow-hidden shadow-2xl";
                  mockup.innerHTML = `
                    <div class="rounded-xl overflow-hidden h-full bg-[#1A1A1A] flex flex-col">
                      <div class="bg-lime-400 text-black p-5 rounded-t-xl">
                        <p class="font-bold">Hello User!</p>
                        <p class="text-xs opacity-70">Welcome Back</p>
                        <p class="mt-2 text-sm">Your Balance</p>
                        <p class="text-2xl font-bold">Rp 24.366.227</p>
                      </div>
                      <div class="p-5 flex-1">
                        <div class="flex justify-between mb-5">
                          <div class="bg-[#333] rounded-full py-2 px-4 flex items-center text-sm">
                            <span class="mr-1">↑↓</span> Transfer
                          </div>
                          <div class="bg-lime-500 rounded-full py-2 px-4 flex items-center text-sm text-black">
                            <span class="mr-1">+</span> Add Money
                          </div>
                        </div>
                        <p class="text-left mb-2">Transactions</p>
                        <div class="space-y-3">
                          <div class="bg-[#222] p-3 rounded-lg flex justify-between">
                            <span>Food</span>
                            <span class="text-red-500">-Rp 50.000</span>
                          </div>
                          <div class="bg-[#222] p-3 rounded-lg flex justify-between">
                            <span>Groceries</span>
                            <span class="text-red-500">-Rp 200.000</span>
                          </div>
                          <div class="bg-[#222] p-3 rounded-lg flex justify-between">
                            <span>Transportation</span>
                            <span class="text-red-500">-Rp 85.000</span>
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
          
          {/* Screen reflection effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/5 rounded-full z-20 pointer-events-none"></div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`text-center text-[#D3D3D3] text-xs p-5 absolute bottom-0 w-full transition-all duration-700 delay-600 ${isVisible ? 'opacity-100' : 'opacity-0'} `}>
        <div className="flex justify-center items-center">
          <span>Made with</span>
          <span className="text-lime-400 mx-1">♥</span>
          <span>by Faiz Intifada</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 