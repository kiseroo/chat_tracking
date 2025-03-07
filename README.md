# ChatTracker - Real-time Chat Application

A real-time chat application built with HTML, CSS, JavaScript, and WebSockets. This application allows users to chat in different rooms in real-time.

## Features

- Real-time messaging using WebSockets
- Multiple chat rooms
- Create custom chat rooms
- User presence indicators
- Responsive design for mobile and desktop
- Username persistence using localStorage

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- WebSockets

## Project Structure

```
/
├── index.html      # Main HTML file
├── styles.css      # CSS styles
├── app.js          # Frontend JavaScript
├── netlify.toml    # Netlify configuration
└── README.md       # Documentation
```

## Deployment Instructions

### Frontend Deployment (Netlify)

1. Create a Netlify account at [netlify.com](https://www.netlify.com/) if you don't have one
2. Deploy using one of these methods:

   **Option 1: Netlify UI**
   - Go to [app.netlify.com](https://app.netlify.com/)
   - Drag and drop the project folder to the Netlify UI
   - Wait for deployment to complete

   **Option 2: Netlify CLI**
   - Install Netlify CLI: `npm install -g netlify-cli`
   - Navigate to the project directory
   - Run `netlify deploy` and follow the prompts
   - For production deployment, use `netlify deploy --prod`

### Backend Deployment

Since Netlify doesn't support WebSocket servers, you'll need to deploy the backend separately on a platform that supports WebSockets:

1. **Render**: [render.com](https://render.com/)
2. **Heroku**: [heroku.com](https://www.heroku.com/)
3. **Railway**: [railway.app](https://railway.app/)

The current WebSocket server URL in the code is set to `wss://chat-tracker-backend.onrender.com`. You'll need to update this URL in `app.js` to match your actual backend deployment.

## Local Development

1. Clone the repository
2. Open the project folder
3. Serve the files using a local server:
   - Using Python: `python -m http.server`
   - Using Node.js: `npx serve`
4. Open your browser and navigate to `http://localhost:8000` or the URL provided by your server

## Notes

- The WebSocket server implementation is not included in this repository
- You'll need to implement a WebSocket server that handles the message protocol defined in `app.js`
- The WebSocket server should handle user connections, room management, and message broadcasting

## License

MIT