/**
 * Auth-related logging utilities
 */

export const logAuthEvent = (eventName: string, data: any = {}, error: any = null) => {
  console.group(`🔐 Auth Event: ${eventName}`);
  
  if (Object.keys(data).length > 0) {
    console.log('Data:', data);
  }
  
  if (error) {
    console.error('Error:', error);
  }
  
  // Log URL parameters for debugging OAuth flows
  if (eventName.includes('callback') || eventName.includes('redirect')) {
    const url = window.location.href;
    const urlObj = new URL(url);
    
    console.log('Full URL:', url);
    console.log('Path:', urlObj.pathname);
    console.log('Search params:', Object.fromEntries(urlObj.searchParams.entries()));
    console.log('Hash:', urlObj.hash);
    
    if (urlObj.hash) {
      const hashParams = new URLSearchParams(urlObj.hash.substring(1));
      console.log('Hash params:', Object.fromEntries(hashParams.entries()));
    }
  }
  
  console.groupEnd();
};

export default logAuthEvent; 