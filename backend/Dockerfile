FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip

# MEVCUT PAKETLER (Bunlar zaten indi, buraya dokunma)
RUN pip install --default-timeout=1000 --no-cache-dir \
    fastapi \
    uvicorn \
    psycopg2-binary \
    python-docx \
    python-dotenv \
    passlib[bcrypt] \
    "bcrypt==4.0.1" \
    "python-jose[cryptography]" \
    requests \
    langchain \
    langchain-community \
    langchain-chroma \
    langchain-huggingface \
    tavily-python \
    pypdf \
    sentence-transformers \
    chromadb \
    email-validator

# EKSİK PARÇA (Bunu ayrı ekledik ki öncekileri tekrar indirmesin)
RUN pip install python-multipart

COPY . .

EXPOSE 8000

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]