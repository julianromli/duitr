import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n' // Import i18n configuration

// Ensure DOM is fully loaded before mounting React
document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById("root");
  
  if (rootElement) {
    try {
      // Create and render the app with error handling
      const root = createRoot(rootElement);
      root.render(<App />);
      
      console.log('App successfully mounted');
    } catch (error) {
      console.error('Error rendering the app:', error);
      
      // Display error to user in case of a critical rendering failure
      rootElement.innerHTML = `
        <div style="padding: 20px; text-align: center; color: white;">
          <h2>Something went wrong</h2>
          <p>Please try refreshing the page</p>
        </div>
      `;
    }
  } else {
    console.error('Root element not found');
  }
});
