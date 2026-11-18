FROM node:26-alpine AS build

# Set the working directory in the container
WORKDIR /app

# Dependencies first: a change of the source code reuses this layer (T-30)
COPY package.json package-lock.json ./
# No lifecycle script of the dependencies runs during the build
RUN npm ci --ignore-scripts

# Source code, with the .env file written by the deployment workflow. Its
# values become the defaults of the configuration completed at container
# start (SPC-2026-11-18-001, lot A1): build.env and the template of the
# security headers (EV-75 lot 3)
COPY ./ .
RUN npm run build && node scripts/runtime-config.mjs runtime-config


# The official nginx image without root (SonarCloud S6471): it runs as the
# nginx user (101), with its pid and temporary files under /tmp. Port 3000
# is above 1024, so this user can listen on it.
FROM nginxinc/nginx-unprivileged:alpine

COPY ./etc/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/runtime-config /etc/nginx/variamos

# Copy the built React application from the builder stage
COPY --from=build /app/dist /usr/share/nginx/html

# At each start, the nginx image runs the scripts of /docker-entrypoint.d:
# this one writes config.js and the security headers from the VITE_*
# variables of the container, or the values of the build
COPY --chmod=755 ./etc/runtime-config.sh /docker-entrypoint.d/40-variamos-runtime-config.sh

# Create a symlink to support the homepage 'variamos_admin/' prefix path.
# The image folders belong to root: this step only runs as root. The two
# files written at start-up belong to the nginx user, and only them
USER root
RUN ln -s /usr/share/nginx/html /usr/share/nginx/html/variamos_admin \
 && touch /etc/nginx/security-headers.conf \
 && chown nginx /usr/share/nginx/html/config.js /etc/nginx/security-headers.conf
USER nginx

# Expose port 3000 to the outside world
EXPOSE 3000

# Health of the container, seen by Docker and by "docker compose up --wait"
# (SPC-2026-11-18-001, lot A2)
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
  CMD ["wget", "-q", "-O", "/dev/null", "http://127.0.0.1:3000/variamos_admin/"]

CMD ["nginx", "-g", "daemon off;"]