# Use an official Node.js runtime as a parent image
FROM node:18

# Set the working directory for the entire application
WORKDIR /app
# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

RUN rm -f package-lock.json
# Install application dependencies
RUN npm install

# Copy all application source code
COPY . .

# Expose the port the app runs on (as requested)
EXPOSE 3003

# Command to run the application - chạy Express server trực tiếp với node
CMD [ "node", "front-end/template/authentication.js" ]
