# Use Playwright's official image with browsers pre-installed
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
    COPY src/ ./src/
    COPY outlets.json ./

# Create logs directory
RUN mkdir -p logs

# Create chrome-profile directory (will be mounted as volume in production)
RUN mkdir -p chrome-profile

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start server
CMD ["node", "src/index.js"]