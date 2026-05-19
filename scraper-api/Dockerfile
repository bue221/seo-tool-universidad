FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod .
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /bin/server ./cmd/server

FROM mcr.microsoft.com/playwright:v1.47.0-jammy
WORKDIR /app
COPY --from=builder /bin/server /bin/server
EXPOSE 8080
CMD ["/bin/server"]
