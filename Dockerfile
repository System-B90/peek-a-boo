ARG NODE_DOCKER_REGISTRY
ARG IS_IN_CNET
ARG LDAP_URL

# Use a local Node.js image
FROM ${NODE_DOCKER_REGISTRY}node:20-alpine AS builder
ARG NODE_DOCKER_REGISTRY
ARG IS_IN_CNET
ARG LDAP_URL

# Set working directory
WORKDIR /app

# Copy package.json and lock file
COPY package*.json ./
COPY package.json /app/package.json

# Copy .npmrc
COPY ./scripts/cnet/.npmrc-cnet ~/.npmrc-cnet
# Only use .npmrc-cnet if building within CNET
RUN if [ "$IS_IN_CNET" = "1" ]; then \
    echo "Copying .npmrc because IS_IN_CNET=1"; \
    cp ~/.npmrc-cnet ~/.npmrc; \
    else \
    echo "Skipping .npmrc because IS_IN_CNET=0"; \
    fi

# Install dependencies in offline mode (ensure lock file exists)
RUN export NODE_TLS_REJECT_UNAUTHORIZED=0
RUN npm config set strict-ssl false
RUN npm config fix

# Copy application code
# COPY ./ /app/
COPY ./src /app/src
COPY ./public /app/public
# COPY ./.env /app/.env
COPY ./tsconfig.json /app/tsconfig.json
COPY ./postcss.config.mjs /app/postcss.config.mjs
COPY ./next.config.ts /app/next.config.ts
# COPY ./.next /app/.next
# COPY ./node_modules /app/node_modules

RUN chmod -R +x ./.next/* || true
RUN chmod -R +x ./node_modules/.bin/* || true

RUN npm run build

# Final stage: production server
FROM ${NODE_DOCKER_REGISTRY}node:20-alpine
ARG NODE_DOCKER_REGISTRY
ARG LDAP_URL
ARG LDAP_DC
ENV LDAP_URL=$LDAP_URL LDAP_DC=$LDAP_DC

WORKDIR /app

# Copy built files from builder stage
COPY --from=builder /app /app

# Expose Next.js port
EXPOSE 3000

RUN npm config fix

# Run Next.js server
CMD ["npm", "start"]
