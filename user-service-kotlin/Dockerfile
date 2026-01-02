FROM gradle:9.2.1-jdk17
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY build.gradle.kts settings.gradle.kts ./
COPY src ./src
COPY data ./data
EXPOSE 3002
CMD ["gradle", "bootRun", "--no-daemon"]
