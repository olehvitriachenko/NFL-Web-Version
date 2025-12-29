/**
 * Utility function to get correct image path for both web and Electron
 * In Electron with file:// protocol, we need to handle ASAR packaging
 */
export const getImagePath = (imageName: string): string => {
  // Check if we're in Electron
  const isElectron = typeof window !== "undefined" && window.location.protocol === "file:";
  
  if (isElectron) {
    // In Electron, files are packaged in app.asar
    // Try different path formats to find what works
    const currentUrl = window.location.href;
    
    // Try to construct path relative to current location
    // If currentUrl is file:///C:/, we need to find the actual app.asar path
    try {
      // Get base URL and construct image path
      const baseUrl = document.baseURI || currentUrl;
      const imageUrl = new URL(imageName, baseUrl).href;
      
      // Debug logging
      console.log('Image path attempt:', {
        imageName,
        currentUrl,
        baseUrl,
        imageUrl,
        pathname: window.location.pathname
      });
      
      return imageUrl;
    } catch (error) {
      // Fallback: try simple relative path
      console.warn('Failed to construct URL, trying relative path:', error);
      return imageName; // Try without ./
    }
  }
  
  // In web, use absolute path from public folder
  return `/${imageName}`;
};

