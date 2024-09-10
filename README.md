# Node.js Application with Tracing
This Node.js application demonstrates how to set up default HTTP and HTTPS OpenTelemetry tracing.

## Prerequisites
Before you begin, make sure you have the following installed on your system:

- **Node.js**: Ensure you have Node.js installed (v16 or higher).
- npm (Node Package Manager)

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

### API Endpoints:

1. **GET /users**: Retrieves a list of users.
2. **POST /users**: Adds a new user. Requires a JSON body with a name field.

### Test the Endpoints
You can test these endpoints using a tool like Postman.

Example POST /users Request:

```bash
Request Method - POST
Request URL - "http://localhost:3000/users"
Request Body - {"name": "John"}
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
    The default concurrency limit is 30. You can adjust this value according to your use case.

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
    The default max export batch size is 512. You can adjust this value according to your use case.

3. **Scheduled Delay Millis:**
    The default scheduled delay in millisecond is 5000. You can adjust this value according to your use case.

4. **Export Timeout Millis:**
    The default export timeout in millisecond is 30000. You can adjust this value according to your use case.

5. **Max Queue Size:**
    The default max queue size is 2048. You can adjust this value according to your use case.

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



## Contributing
Feel free to submit issues or pull requests to improve the application.
