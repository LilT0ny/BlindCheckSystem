FROM python:3.12-slim
WORKDIR /app

# Install Common Dependencies
COPY common/requirements.txt requirements_common.txt
RUN pip install --no-cache-dir -r requirements_common.txt

# Install Service Dependencies
COPY microservices/auth/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy Common Code (merging into /app to preserve imports)
COPY common/ .

# Copy Service Code
COPY microservices/auth/ .

# Create uploads directory
RUN mkdir -p uploads

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]