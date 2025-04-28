import { NextApiRequest, NextApiResponse } from 'next';

/**
 * Debug endpoint to test backend connectivity with detailed error reporting
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get the backend URL from environment variables or use the one from the request
    const backendUrl = req.query.url as string || process.env.NEXT_PUBLIC_BACKEND_API_URL || 'https://confiorato-ai.onrender.com';
    const endpoint = req.query.endpoint as string || '/api/health';
    
    console.log(`Debug: Testing connection to ${backendUrl}${endpoint}`);
    
    // Try to fetch from the backend with detailed error handling
    const response = await fetch(`${backendUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Get response details
    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { rawText: responseText };
    }
    
    return res.status(200).json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
      backendUrl,
      endpoint,
      env: {
        NEXT_PUBLIC_BACKEND_API_URL: process.env.NEXT_PUBLIC_BACKEND_API_URL || 'Not set'
      }
    });
  } catch (error) {
    console.error('Error debugging backend connection:', error);
    return res.status(500).json({ 
      error: 'Failed to connect to backend', 
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      env: {
        NEXT_PUBLIC_BACKEND_API_URL: process.env.NEXT_PUBLIC_BACKEND_API_URL || 'Not set'
      }
    });
  }
}
