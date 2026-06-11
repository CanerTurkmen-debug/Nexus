# Sürümü 18'den 20'ye yükselttik (Sorunun çözümü burası)
FROM node:20-alpine

WORKDIR /app

# Paket listesini kopyala
COPY package*.json ./

# Kurulumu yap
RUN npm install

# Tüm kodları içeri al
COPY . .

# Portu aç
EXPOSE 3000

# Başlat
CMD ["npm", "run", "dev"]