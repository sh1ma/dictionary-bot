FROM denoland/deno:1.38.0

WORKDIR /app

COPY . /app

CMD ["deno", "run", "-A", "main.ts"]