FROM python:3.12-slim
WORKDIR /app

# Install Common Dependencies
COPY common/requirements.txt requirements_common.txt
RUN pip install --no-cache-dir -r requirements_common.txt

# Install Service Dependencies
COPY microservices/teacher/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy Common Code
COPY common/ .

# Copy Service Code
COPY microservices/teacher/ .

# Create uploads directory
RUN mkdir -p uploads

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]