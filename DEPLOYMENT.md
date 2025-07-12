# DigitalOcean App Platform Deployment Guide

This React application is configured to deploy on DigitalOcean App Platform using an Express.js server to serve static files.

## Setup Instructions

### 1. Push to Git Repository
Ensure your code is pushed to a Git repository (GitHub, GitLab, etc.) that DigitalOcean can access.

### 2. Create App on DigitalOcean
1. Go to DigitalOcean App Platform
2. Click "Create App"
3. Connect your Git repository
4. Select the branch (usually `main` or `master`)

### 3. Configuration Options

#### Option A: Use app.yaml (Recommended)
- The `app.yaml` file in the root directory contains the deployment configuration
- Update the GitHub repository information in `app.yaml`:
  ```yaml
  github:
    repo: your-username/your-repo-name
    branch: main
  ```

#### Option B: Manual Configuration
If not using app.yaml, configure these settings in the DigitalOcean dashboard:

- **Build Command**: `npm run build`
- **Run Command**: `npm start`
- **Environment**: Node.js
- **Node Version**: 18.x or higher
- **Port**: 3000 (or use environment variable PORT)

### 4. Environment Variables
Set the following environment variable in DigitalOcean:
- `NODE_ENV`: `production`

### 5. Build Process
The deployment process will:
1. Install dependencies with `npm ci`
2. Build the React app with `npm run build`
3. Start the Express server with `npm start`

## Project Structure

- `server.js` - Express server that serves the built React app
- `Dockerfile` - Container configuration (optional)
- `app.yaml` - DigitalOcean App Platform configuration
- `dist/` - Built React application (generated during build)

## Local Testing

To test the production setup locally:

```bash
# Install dependencies
npm install

# Build the app
npm run build

# Start the production server
npm start
```

The app will be available at `http://localhost:3000`

## Notes

- The Express server handles client-side routing by serving `index.html` for all routes
- Static assets are served from the `dist` directory
- The server uses the PORT environment variable provided by DigitalOcean
- HTTPS is automatically handled by DigitalOcean App Platform