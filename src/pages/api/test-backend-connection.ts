import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Test endpoint to verify backend connectivity
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get the backend URL from environment variables
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'https://confiorato-ai.onrender.com';
    
    console.log(`Attempting to connect to backend at: ${backendUrl}`);
    
    // Try to fetch the health endpoint
    const response = await fetch(`${backendUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend returned error status: ${response.status}, ${errorText}`);
      return res.status(response.status).json({ 
        error: 'Backend connection failed', 
        status: response.status,
        statusText: response.statusText,
        backendUrl,
      });
    }
    
    const data = await response.json();
    
    return res.status(200).json({
      success: true,
      message: 'Successfully connected to backend',
      backendResponse: data,
      backendUrl,
    });
  } catch (error) {
    console.error('Error connecting to backend:', error);
    return res.status(500).json({ 
      error: 'Failed to connect to backend', 
      message: error instanceof Error ? error.message : String(error),
      backendUrl: process.env.NEXT_PUBLIC_BACKEND_API_URL || 'https://confiorato-ai.onrender.com',
    });
  }
}
