# Use a local Node.js image
FROM 8200artifactory.dother.mil/uni-registry/base-images/python:3.10.12-slim-bullseye AS builder

# Set working directory
WORKDIR /app

COPY . .

RUN mkdir ~/.pip/
COPY ./pip.conf ~/.pip/pip.conf
COPY ./pip.conf /etc/pip.conf

RUN pip install --root-user-action=ignore --upgrade pip 
RUN pip install --root-user-action=ignore -r ./requirements.txt

# Final stage: production server
FROM 8200artifactory.dother.mil/uni-registry/base-images/python:3.10.12-slim-bullseye

WORKDIR /app

# Copy built files from builder stage
COPY --from=builder /app /app
COPY --from=builder /usr/local/lib/python3.10 /usr/local/lib/python3.10
COPY --from=builder /usr/local/ /usr/local/

# Expose Next.js port
EXPOSE 60800

# Run Next.js server
CMD ["python", "start_websockify.py"]
