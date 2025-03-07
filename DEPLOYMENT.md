# ChatTracker Deployment Guide

## Overview

This guide will help you deploy the ChatTracker application. The application consists of two parts:
1. Frontend (HTML, CSS, JavaScript) - deployed on Netlify
2. Backend (WebSocket server) - deployed on Render

## Backend Deployment on Render

Since you've already created an account on Render, follow these steps to deploy the WebSocket server:

1. **Login to your Render account** at [render.com](https://render.com)

2. **Create a new Web Service**:
   - Click on the "New +" button
   - Select "Web Service"

3. **Connect your repository**:
   - Connect to your GitHub/GitLab account, or
   - Use the "Public Git repository" option with your repository URL
   - If you don't have a repository, you can manually deploy by uploading the files

4. **Configure the Web Service**:
   - Name: `chat-tracker-backend` (or any name you prefer)
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: Select the free tier ("Free")

5. **Set Environment Variables** (if needed):
   - No specific environment variables are required for this basic setup

6. **Deploy**:
   - Click "Create Web Service"
   - Wait for the deployment to complete (this may take a few minutes)

7. **Verify the deployment**:
   - Once deployed, Render will provide you with a URL (e.g., `https://chat-tracker-backend.onrender.com`)
   - Your WebSocket URL will be `wss://chat-tracker-backend.onrender.com`
   - This should match the `WS_SERVER_URL` in your `app.js` file

## Frontend Deployment on Netlify

1. **Create a Netlify account** (if you don't have one already) at [netlify.com](https://www.netlify.com/)

2. **Deploy the frontend**:

   **Option 1: Using the Netlify UI**
   - Go to [app.netlify.com](https://app.netlify.com/)
   - Drag and drop your project folder (containing index.html, styles.css, app.js, etc.) to the Netlify UI
   - Wait for the deployment to complete

   **Option 2: Using Netlify CLI**
   - Install Netlify CLI: `npm install -g netlify-cli`
   - Navigate to your project directory
   - Run `netlify deploy` and follow the prompts
   - For production deployment, use `netlify deploy --prod`

3. **Configure your site** (optional):
   - You can set a custom domain in the Netlify settings
   - Configure additional settings as needed

## Verifying the Deployment

1. Visit your Netlify URL (e.g., `https://your-site-name.netlify.app`)
2. Enter a username (3 or more characters)
3. You should see a "Connected to chat server" message if the WebSocket connection is successful
4. Try sending messages and creating rooms to verify everything works correctly

## Troubleshooting

- **WebSocket Connection Issues**:
  - Check that the `WS_SERVER_URL` in `app.js` matches your Render WebSocket URL
  - Ensure your Render service is running
  - Check the browser console for any connection errors

- **Deployment Failures**:
  - Check the deployment logs in Render/Netlify for specific errors
  - Ensure all required files are included in your deployment

## Files Required for Deployment

### Frontend (Netlify)
- `index.html`
- `styles.css`
- `app.js`
- `netlify.toml`

### Backend (Render)
- `server.js`
- `package.json`

## Notes

- The free tier on Render may have some limitations and the service might spin down after periods of inactivity
- The first connection after inactivity might take a few seconds to establish
- For production use, consider upgrading to a paid plan for better performance and reliability