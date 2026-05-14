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

# Install Playwright browsers (for scraping)
RUN playwright install chromium
RUN playwright install-deps chromium

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Default port (Railway overrides with $PORT)
ENV PORT=8000

# Run the application
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
