import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Proxy API to analyze a body language frame
 * This bypasses CORS issues by making the request from the server
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Only allow POST method
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get the backend URL from environment variables
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'https://confiorato-ai-backend.onrender.com';
    
    console.log(`Proxying analyze-frame request to backend`);
    
    // Forward the request to the backend
    const response = await fetch(`${backendUrl}/api/body-language/analyze-frame`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    // Get the response data
    const data = await response.json();
    
    // Return the response from the backend
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Error proxying analyze-frame to backend:', error);
    return res.status(500).json({ 
      error: 'Failed to connect to backend', 
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
