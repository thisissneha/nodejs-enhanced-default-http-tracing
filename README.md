# Node.js Application with Tracing
This Node.js application demonstrates how to set up default HTTP and HTTPS OpenTelemetry tracing.

## Prerequisites
Before you begin, make sure you have the following installed on your system:

- **Node.js**: Ensure you have Node.js installed (v16 or higher).
- npm (Node Package Manager)
- **AWS credentials** (Access Key ID, Secret Access Key, and region).
- **S3 bucket** to store user profile JSON files.
- **DynamoDB table** to store user data.

## Installation
1. Clone this repository to your local machine.
    ```bash
    git clone https://github.com/thisissneha/nodejs-enhanced-default-http-tracing.git

    cd nodejs-enhanced-default-http-tracing
    ```
2. Install the necessary dependencies by running:
    ```bash
    npm install
    ```
3. Create a .env file in the root directory to store your AWS credentials and other environment variables.  The contents of the .env file should look like this:

    ```bash
    AWS_ACCESS_KEY_ID=your-access-key-id
    AWS_SECRET_ACCESS_KEY=your-secret-access-key
    AWS_REGION=your-region
    ```
4. Set up AWS resources
    1. **S3 Bucket**: Create a bucket in S3 where user profiles will be stored.

    2. **DynamoDB Table**: Create a DynamoDB table to store user records.
        - **Table name**: Users
        - **Partition key**: userId (String)

## Project Structure
The project consists of two main files:

1. `tracing.js`: This file configures deafult OpenTelemetry tracing.
2. `index.js`: This file sets up an Express.js server and defines two API routes (GET /users and POST /users).

    ```
    node-tracing-app/
    │
    ├── tracing.js      # Default OpenTelemetry tracing setup
    ├── index.js        # Express server with two API routes
    └── package.json    # Project dependencies and scripts
    ```

## Usage
Run the application:

```bash
node index.js
```

### API Endpoints
1. `POST /user`
    - **Description**: This API stores user data by uploading a profile to S3 and storing additional data in DynamoDB.

    - **Request Body**:

      ```json
      {
          "userId": "123",
          "profile": {
              "name": "John Doe",
              "email": "john.doe@example.com",
              "preferences": {
                  "theme": "dark",
                  "notifications": true
              }
          },
          "data": {
              "age": 30,
              "loyaltyPoints": 150
          }
      }
      ```
    - **Sample Request**:

      ```bash
      curl -X POST http://localhost:3000/user \
      -H 'Content-Type: application/json' \
      -d '{
          "userId": "123",
          "profile": {
              "name": "John Doe",
              "email": "john.doe@example.com",
              "preferences": {
                  "theme": "dark",
                  "notifications": true
              }
          },
          "data": {
              "age": 30,
              "loyaltyPoints": 150
          }
      }'
      ```
    - **Response**:
      ```json
      {
          "message": "User data stored successfully"
      }
      ```

2. `GET /user/:userId`
    - **Description**: Fetches user profile from S3 and additional data from DynamoDB.

    - **URL Parameters**:
      - `userId`: The ID of the user whose data needs to be fetched.

    - **Sample Request**:

      ```bash
      curl -X GET http://localhost:3000/user/123
      ```

    - **Response**:
      ```json
      {
          "message": "User data retrieved successfully",
          "profile": {
              "name": "John Doe",
              "email": "john.doe@example.com",
              "preferences": {
                  "theme": "dark",
                  "notifications": true
              }
          },
          "record": {
              "age": 30,
              "loyaltyPoints": 150
          }
      }
      ```

## Tracing Configuartions
### Trace Exporter Configurations
1. **Trace Exporter URL:**
    If you have set up your New Relic (NR) account in the US region, the trace endpoint will be:
    `https://otlp.nr-data.net:4318/v1/traces`.

    For more information, refer to the New Relic OTLP Endpoints documentation.

2. **New Relic Keys:**
    Use the New Relic API keys.

3. **Concurrency Limit:**
    It is the number of trace batches that can be sent concurrently to the New Relic. The default concurrency limit is 30. You can adjust this value according to your use case.

#### Usage
```JavaScript
// Initialize OTEL trace exporter
const exporter = new OTLPTraceExporter({
  url: <TRACE_EXPORTER_ENDPOINT>, // Exporter endpoint
  headers: {
    "api-key": <NEW_RELIC_KEY>, // NR license key for authentication
  },
  concurrencyLimit: <CONCURRENCY_LIMIT>, // the number of trace batches that can be sent concurrently to the New Relic
});
```

___________________________________________________________

### Trace Provider Configurations
1. **Entity Name:**
    Entity Name is the service name of the application.

2. **Max Export Batch Size:**
    It is the maximum batch size of every export. It must be smaller or equal to max queue size. The default max export batch size is 512. You can adjust this value according to your use case.

3. **Scheduled Delay Millis:**
    It is the delay interval in milliseconds between two consecutive exports. The default scheduled delay in millisecond is 5000. You can adjust this value according to your use case.

4. **Export Timeout Millis:**
    It indicates how long the export can run before it is canceled. The default export timeout in millisecond is 30000. You can adjust this value according to your use case.

5. **Max Queue Size:**
    It is the maximum queue size. After the size is reached spans are dropped. The default max queue size is 2048. You can adjust this value according to your use case.

#### Usage
```JavaScript
// BatchSpanProcessor with OTLP exporter (send to New Relic)
provider.addSpanProcessor(
  new BatchSpanProcessor(otlpExporter, {
    maxExportBatchSize: <MAX_EXPORT_BATCH_SIZE>, // The maximum batch size of every export. It must be smaller or equal to maxQueueSize.
    scheduledDelayMillis: <SCHEDULED_DELAY_MILLIS>, // The delay interval in milliseconds between two consecutive exports.
    exportTimeoutMillis: <EXPORT_TIMEOUT_MILLIS>, // How long the export can run before it is cancelled.
    maxQueueSize: <MAX_QUEUE_SIZE>, // The maximum queue size. After the size is reached spans are dropped.
  })
);
```

**Note:** We are using the default configuration values for demonstration purposes.

___________________________________________________________

### Http instrumentation Options
- **ignoreIncomingRequestHook:**
    Http instrumentation will not trace all incoming requests that matched with custom function

- **ignoreOutgoingRequestHook:**
    Http instrumentation will not trace all outgoing requests that matched with custom function

- **applyCustomAttributesOnSpan:**
    Function for adding custom attributes

- **requestHook:**
    Function for adding custom attributes before request is handled

- **responseHook:**
    Function for adding custom attributes before response is handled

#### Usage
```JavaScript
// Register default HTTP instrumentations
registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation({
      ignoreIncomingRequestHook(request) {
        // logic implementation
      },
      requestHook(span, request) {
        // logic implementation
      },
    }),
  ],
});
```

For more information, refer to the [OTel http/https instrumentation document](https://www.npmjs.com/package/@opentelemetry/instrumentation-http).

## OpenTelemetry Trace Visualization
![Console trace spans](https://github.com/user-attachments/assets/ec9bb460-cd88-4a1b-b61b-ae279ad5ebcc)

![Trace request visualization](https://github.com/user-attachments/assets/a9ca0580-660e-49f5-a9b1-73c8f4d68f2e)


## Article Link
[Medium article](https://medium.com/@sneha_99/opentelemetry-unlocking-powerful-performance-insights-with-default-http-instrumentation-4fd14d5f3e46)


## Contributing
Feel free to submit issues or pull requests to improve the application.
