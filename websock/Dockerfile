ARG PYTHON_DOCKER_REGISTRY
ARG PIP_CONF_PATH

# Use a local Node.js image
FROM ${PYTHON_DOCKER_REGISTRY}python:3.10.12-slim-bullseye AS builder

ARG PYTHON_DOCKER_REGISTRY
ARG PIP_CONF_PATH

# Set working directory
WORKDIR /app

COPY . .

RUN mkdir ~/.pip/
COPY ./${PIP_CONF_PATH} ~/.pip/pip.conf
COPY ./${PIP_CONF_PATH} /etc/pip.conf

RUN pip install --root-user-action=ignore --upgrade pip 
RUN pip install --root-user-action=ignore -r ./requirements.txt

# Final stage: production server
FROM ${PYTHON_DOCKER_REGISTRY}python:3.10.12-slim-bullseye

ARG PYTHON_DOCKER_REGISTRY
ARG PIP_CONF_PATH

WORKDIR /app

# Copy built files from builder stage
COPY --from=builder /app /app
COPY --from=builder /usr/local/lib/python3.10 /usr/local/lib/python3.10
COPY --from=builder /usr/local/ /usr/local/

# Expose Next.js port
EXPOSE 60800

# Run Next.js server
CMD ["python", "start_websockify.py"]
