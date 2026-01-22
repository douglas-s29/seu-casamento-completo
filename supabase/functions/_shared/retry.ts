/**
 * Retry Logic with Exponential Backoff
 * For handling API requests with automatic retries
 */

export const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  retries: number = 3
): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      
      // Return immediately if successful or client error (4xx)
      if (response.ok || response.status < 500) {
        return response;
      }
      
      // Only retry on server errors (5xx)
      if (i === retries - 1) {
        return response;
      }
    } catch (error) {
      if (i === retries - 1) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error("Max retries reached");
};
