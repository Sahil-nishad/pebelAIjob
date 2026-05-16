FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Skip Playwright in production free tier (LinkedIn scraping disabled)
# Uncomment below if you need scraping:
# RUN playwright install chromium
# RUN playwright install-deps chromium

# Copy application code
COPY . .

# Force cache bust on code changes
RUN echo "build-v2"

# Expose port
EXPOSE 8000

# Default port (Render injects $PORT)
ENV PORT=8000

# Run the application
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
