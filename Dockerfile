# Use a local Node.js image
FROM 8200artifactory.dother.mil/docker-images/node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and lock file
COPY package*.json ./
COPY package.json /app/package.json
COPY ./.npmrc ~/.npmrc

# Install dependencies in offline mode (ensure lock file exists)
RUN export NODE_TLS_REJECT_UNAUTHORIZED=0
RUN npm config set strict-ssl false
RUN npm config fix

# Copy application code
COPY ./ /app/

RUN chmod -R +x ./.next/* || true
RUN chmod -R +x ./node_modules/.bin/* || true

RUN npm run build

# Final stage: production server
FROM 8200artifactory.dother.mil/docker-images/node:20-alpine

WORKDIR /app

# Copy built files from builder stage
COPY --from=builder /app /app

# Expose Next.js port
EXPOSE 3000

RUN npm config fix

# Run Next.js server
CMD ["npm", "start"]
