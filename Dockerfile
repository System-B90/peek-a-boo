ARG NODE_DOCKER_REGISTRY
ARG IS_IN_CNET

# Use a local Node.js image
FROM ${NODE_DOCKER_REGISTRY}node:20-alpine AS builder
ARG NODE_DOCKER_REGISTRY
ARG IS_IN_CNET

# Set working directory
WORKDIR /app

# GitHub Packages read token for @system-b90/* (npm resolves ${NPM_TOKEN} from env)
ARG NPM_TOKEN
ENV NPM_TOKEN=${NPM_TOKEN}

# Copy package.json and lock file
COPY package*.json .npmrc ./
COPY package.json /app/package.json

# GitHub Packages read token for @system-b90/* (npm resolves ${NPM_TOKEN} from env)
ARG NPM_TOKEN
ENV NPM_TOKEN=${NPM_TOKEN}
COPY .npmrc ./

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

RUN npm install

RUN chmod -R +x ./.next/* || true
RUN chmod -R +x ./node_modules/.bin/* || true

# Placeholders to satisfy buildHiveAuthOptions()'s eager env read during
# `next build`'s page-data collection — real values come from the runtime
# environment (docker-compose/.env), not baked into the image.
ARG NEXTAUTH_SECRET=ci_build_placeholder
ARG NEXT_PUBLIC_HIVE_URL=https://hive.invalid
ARG HIVE_CLIENT_ID=ci_build_placeholder
ARG HIVE_CLIENT_SECRET=ci_build_placeholder
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET} \
    NEXT_PUBLIC_HIVE_URL=${NEXT_PUBLIC_HIVE_URL} \
    HIVE_CLIENT_ID=${HIVE_CLIENT_ID} \
    HIVE_CLIENT_SECRET=${HIVE_CLIENT_SECRET}

RUN npm run build

# Final stage: production server
FROM ${NODE_DOCKER_REGISTRY}node:20-alpine
ARG NODE_DOCKER_REGISTRY

LABEL org.opencontainers.image.source="https://github.com/System-B90/peek-a-boo"
LABEL org.opencontainers.image.description="Peek-a-Boo Next.js app. See README: https://github.com/System-B90/peek-a-boo#readme"

WORKDIR /app

# Copy built files from builder stage.
#
# --chown here, not a later `RUN chown -R`: ownership is applied as the layer
# is written, in one pass. The recursive chown this replaces walked all of
# /app — node_modules included — and on the CI runners, where dockerd is
# itself running inside a container, every touched file forces an overlayfs
# copy-up. Measured on mks-srvu: 50+ minutes elapsed for 24 seconds of CPU,
# which ran the whole e2e job past its 90-minute budget without ever
# reaching a test.
COPY --from=builder --chown=node:node /app /app

# Expose Next.js port
EXPOSE 3000

RUN npm config fix

# Run as non-root (node:20-alpine ships a built-in `node` user). The COPY
# above owns everything *inside* /app; this chowns the directory itself, which
# COPY --chown does not. Non-recursive on purpose — one inode, not a walk of
# node_modules.
RUN chown node:node /app
USER node

# Run Next.js server
CMD ["npm", "start"]
