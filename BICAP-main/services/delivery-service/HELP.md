# Delivery Service

This service handles delivery driver operations for the BiCap system, including shipment management, QR code scanning, and reporting.

## Features
- View and manage shipments
- Update shipment processes
- Scan QR codes for product tracking
- Confirm product receipt and delivery
- Send reports to Shipping Manager

## Getting Started

### Prerequisites
- Java 21
- Maven 3.6+
- MySQL 8.0+
- RabbitMQ

### Running the Application
```bash
./mvnw spring-boot:run
```

### API Endpoints
- GET /api/delivery/shipments - Get driver's shipments
- GET /api/delivery/shipments/{id} - Get shipment detail
- PUT /api/delivery/shipments/{id}/status - Update shipment status
- POST /api/delivery/scan-qr - Scan QR code
- POST /api/delivery/confirm-receive - Confirm product receipt
- POST /api/delivery/confirm-deliver - Confirm product delivery
- POST /api/delivery/send-report - Send report

### Reference Documentation
For further reference, please consider the following sections:

* [Official Apache Maven documentation](https://maven.apache.org/guides/index.html)
* [Spring Boot Maven Plugin Reference Guide](https://docs.spring.io/spring-boot/4.0.0/maven-plugin)
* [Create an OCI image](https://docs.spring.io/spring-boot/4.0.0/maven-plugin/build-image.html)
* [Spring Web](https://docs.spring.io/spring-boot/4.0.0/reference/web/servlet.html)
* [Spring Data JPA](https://docs.spring.io/spring-boot/4.0.0/reference/data/sql.html#data.sql.jpa-and-spring-data)
* [Validation](https://docs.spring.io/spring-boot/4.0.0/reference/io/validation.html)
* [Spring Security](https://docs.spring.io/spring-boot/4.0.0/reference/web/spring-security.html)