# CORS Configuration for Render Deployment

Update your environment variables in the Render dashboard for your backend service:

1. Go to your Render dashboard
2. Select your backend service "confiorato-ai-backend"
3. Go to the "Environment" tab
4. Update the CORS_ORIGIN variable to include your Vercel domain:

```
CORS_ORIGIN=https://sayandipjana.vercel.app,https://confiorato-ai.vercel.app
```

This will allow your Vercel frontend to communicate with your Render backend.
