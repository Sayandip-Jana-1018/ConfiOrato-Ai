# ConfiOrato-Ai Docker Setup

This document provides instructions for running the ConfiOrato-Ai application using Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Getting Started

### Option 1: Using Docker Compose (Recommended)

1. Make sure your `.env` file is in the project root with the following variables:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   GEMINI_API_KEY=your_gemini_api_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. Build and start the application:
   ```bash
   docker-compose up -d
   ```

3. Access the application at http://localhost:3000

4. To stop the application:
   ```bash
   docker-compose down
   ```

### Option 2: Using Docker Directly

1. Build the Docker image:
   ```bash
   docker build -t confiorato-ai \
     --build-arg OPENAI_API_KEY=your_openai_api_key \
     --build-arg ANTHROPIC_API_KEY=your_anthropic_api_key \
     --build-arg GEMINI_API_KEY=your_gemini_api_key \
     --build-arg NEXT_PUBLIC_SUPABASE_URL=your_supabase_url \
     --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 confiorato-ai
   ```

3. Access the application at http://localhost:3000

## Deployment Notes

- The application is configured to run on port 3000 by default.
- The Docker setup uses the Next.js standalone output mode for optimal performance.
- Environment variables are passed from your host machine to the container.

## Troubleshooting

- If you encounter any issues with camera access, make sure your browser allows camera permissions when running the application.
- For TensorFlow.js or MediaPipe related issues, check browser console logs for specific errors.
- If you need to rebuild the Docker image after making changes, use `docker-compose build` before running `docker-compose up -d` again.
