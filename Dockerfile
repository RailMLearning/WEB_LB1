FROM python:3.14-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 DB_PATH=/data/db.json HOST=0.0.0.0 PORT=8080 BACKEND_HOST=127.0.0.1 BACKEND_PORT=8000
RUN apt-get update \
	&& apt-get install -y --no-install-recommends nodejs npm \
	&& rm -rf /var/lib/apt/lists/*
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY package*.json server.cjs ./
RUN npm install --omit=dev
COPY server ./server
COPY static ./static
COPY templates ./templates
EXPOSE 8000 8080
CMD ["sh", "-c", "uvicorn server.routers.serve:app --host 0.0.0.0 --port 8000 & npm start"]
