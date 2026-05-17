FROM node:18

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
# 'npm install' will use package-lock.json for a reproducible build
# and install devDependencies (like nodemon) by default.
RUN npm install

# Copy all files
COPY . .

# Expose port
EXPOSE 3002

# Start server
CMD ["npm", "start"]
