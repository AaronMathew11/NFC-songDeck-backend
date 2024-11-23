FROM node:22.7.0
ENV NODE_ENV=production
WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install 
COPY . .
EXPOSE 3000
<<<<<<< HEAD:DockerFile
CMD [ "node", "src/server.js" ]
=======
CMD [ "node", "src/server.js" ]
>>>>>>> 9cf519ba16eda34115d1acc1da51e76ba2c8e93c:Dockerfile
