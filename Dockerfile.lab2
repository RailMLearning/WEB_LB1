FROM python:3.14-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 DB_PATH=/data/db.json
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY server ./server
COPY static ./static
EXPOSE 8000
CMD ["uvicorn", "server.routers.serve:app", "--host", "0.0.0.0", "--port", "8000"]
