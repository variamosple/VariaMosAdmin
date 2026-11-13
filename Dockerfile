FROM node:24-alpine AS build

# Set the working directory in the container
WORKDIR /app

# Dependencies first: a change of the source code reuses this layer (T-30)
COPY package.json package-lock.json ./
# No lifecycle script of the dependencies runs during the build
RUN npm ci --ignore-scripts

# Source code, with the .env file written by the deployment workflow; the
# security headers list the API addresses of that same file (EV-75 lot 3)
COPY ./ .
RUN npm run build && node scripts/security-headers.mjs security-headers.conf


# The official nginx image without root (SonarCloud S6471): it runs as the
# nginx user (101), with its pid and temporary files under /tmp. Port 3000
# is above 1024, so this user can listen on it.
FROM nginxinc/nginx-unprivileged:alpine

COPY ./etc/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/security-headers.conf /etc/nginx/security-headers.conf

# Copy the built React application from the builder stage
COPY --from=build /app/dist /usr/share/nginx/html

# Create a symlink to support the homepage 'variamos_admin/' prefix path.
# The image folders belong to root: this step only runs as root
USER root
RUN ln -s /usr/share/nginx/html /usr/share/nginx/html/variamos_admin
USER nginx

# Expose port 3000 to the outside world
EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]