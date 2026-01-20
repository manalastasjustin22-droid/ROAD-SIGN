# Gamitin ang slim version sa halip na alpine
FROM node:20-slim

# I-install ang mga kailangang system dependencies para sa 'canvas'
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Kopyahin ang package files
COPY package*.json ./

# I-install ang dependencies
RUN npm install --omit=dev

# Kopyahin ang lahat ng files
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]