FROM node:21

RUN if ! command -v ffmpeg >/dev/null 2>&1; then \
  apt-get update && \
  apt-get install -y ffmpeg && \
  apt-get clean; \
fi

WORKDIR /app
COPY . .
RUN npm install
CMD ["npm", "start"]