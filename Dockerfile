FROM node:24-alpine AS build

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

# install dependencies
RUN npm install
# compile
RUN npm run build


# Use a lightweight Nginx image as a base image for the production environment
FROM nginx:alpine

COPY ./etc/nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built React application from the builder stage
COPY --from=build /app/dist /usr/share/nginx/html

# Create a symlink to support the homepage 'variamos_admin/' prefix path
RUN ln -s /usr/share/nginx/html /usr/share/nginx/html/variamos_admin

# Expose port 3000 to the outside world
EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]