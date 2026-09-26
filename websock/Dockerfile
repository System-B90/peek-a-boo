# Use a local Node.js image
FROM python:3.10.12-slim-bullseye AS builder

# Set working directory
WORKDIR /app

COPY . .

RUN pip install --root-user-action=ignore --upgrade pip 
RUN pip install --root-user-action=ignore -r ./requirements.txt

# Final stage: production server
FROM python:3.10.12-slim-bullseye

WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/System-B90/peek-a-boo"
LABEL org.opencontainers.image.description="Peek-a-Boo websockify relay. See README: https://github.com/System-B90/peek-a-boo#readme"

# Copy built files from builder stage
COPY --from=builder /app /app
COPY --from=builder /usr/local/lib/python3.10 /usr/local/lib/python3.10
COPY --from=builder /usr/local/ /usr/local/

# Expose Next.js port
EXPOSE 60800

# Run as non-root. python:*-slim-bullseye has no built-in "node" user
# (that's a Node-image concept) so create an unprivileged user here.
RUN useradd --create-home --shell /usr/sbin/nologin appuser \
    && chown -R appuser:appuser /app
USER appuser

# Run Next.js server
CMD ["python", "start_websockify.py"]
