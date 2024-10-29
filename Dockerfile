FROM node:20-alpine as build

# Set the working directory in the container
WORKDIR /app

# update packages
RUN apk update

# # create root application folder
# WORKDIR /variamos

# copy configs to /variamos folder
COPY package*.json ./
COPY tsconfig.json ./

# copy source code to /variamos/src folder
COPY ./ . 
COPY .env ./ 
# compile
RUN npm run build


# Use a lightweight Nginx image as a base image for the production environment
FROM nginx:alpine

COPY ./etc/nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React application from the builder stage
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80 to the outside world
EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]