# Use an official Node.js runtime as a parent image
FROM node:18

# Set the working directory for the entire application
WORKDIR /app
# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install application dependencies
RUN rm -f package-lock.json
RUN npm install --include=dev

# Copy all application source code
COPY . .

# Expose the port the app runs on (as requested)
EXPOSE 3001

# Command to run the application, pointing to the correct entrypoint
CMD [ "npm", "start" ]
