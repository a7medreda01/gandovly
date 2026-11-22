# Stage 1: Build Angular application
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/TngProject/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
