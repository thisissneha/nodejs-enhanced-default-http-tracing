// Import exporter package
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-http");

// Import trace provider packages
const { Resource } = require("@opentelemetry/resources");
const { ATTR_SERVICE_NAME } = require("@opentelemetry/semantic-conventions");
const { BatchSpanProcessor } = require("@opentelemetry/sdk-trace-base");
const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node");

// Import Console span exporter package
const { ConsoleSpanExporter } = require("@opentelemetry/sdk-trace-base");

// Import default instrumentations packages
const { registerInstrumentations } = require("@opentelemetry/instrumentation");
const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");

// OTel diagnostic logging package
const { diag, DiagConsoleLogger, DiagLogLevel } = require("@opentelemetry/api");

// Set up diagnostic logging to output to the console with DEBUG level
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

// Configure the OTLP exporter for sending traces to Observability platform (New Relic in our case)
const exporterConfig = {
  url: "https://otlp.nr-data.net:4318/v1/traces", // Exporter endpoint
  headers: {
    "api-key": "NEW_RELIC_KEY", // NR license key for authentication
  },
  concurrencyLimit: 10, // the number of trace batches that can be sent concurrently to the New Relic
};

// Initialize OTEL trace exporter
const exporter = new OTLPTraceExporter(exporterConfig);

// Create a NodeTracerProvider instance
const provider = new NodeTracerProvider({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: "OTel-NodeJs-Service", // Entity name
  }),
});

// Add span processors to the provider:
// BatchSpanProcessor with OTLP exporter (send to New Relic)
provider.addSpanProcessor(new BatchSpanProcessor(exporter));

// Add span processors to the provider:
// BatchSpanProcessor with Console Span Exporter (Log to terminal)
provider.addSpanProcessor(new BatchSpanProcessor(new ConsoleSpanExporter()));

// Register the provider with OpenTelemetry
provider.register();

// Register default HTTP instrumentations
registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation({
      ignoreIncomingRequestHook(request) {
        shouldIgnoreIncomingRequest(request);
      }, // to decide which requests to ignore for tracing

      requestHook(span, request) {
        updateHttpRequestAttributes(span, request);
      }, // to add/update custom attributes to spans for HTTP requests
    }),
  ],
});

// Function to determine if an incoming request should be ignored for tracing
function shouldIgnoreIncomingRequest(request) {
  // Get the request URL from the IncomingMessage object
  const requestPath = request.url?.split("?")[0] || "";

  // Check if the request should be ignored or not
  const shouldIgnore = shouldIgnoreRequest(requestPath);

  // ignore the incoming request if true
  return shouldIgnore;
}

// Function to determine if an request should be ignored for tracing
function shouldIgnoreRequest(incomingRequestPath) {
  // List of file extensions that should be ignored
  const ignoredExtensions = [".js", ".css", ".svg", ".js.map", ".webp"];

  // Convert the incoming request path to lowercase
  const requestPath = incomingRequestPath.toLowerCase();

  // Check if the request path ends with any of the ignored extensions
  // Return true if it matches one of them, indicating the request should be ignored
  return ignoredExtensions.some((extension) => requestPath.endsWith(extension));
}

// Function to add/update custom attributes to spans for HTTP requests
function updateHttpRequestAttributes(span, request) {
  // Get the request method (GET, POST) from the IncomingMessage object
  const requestMethod = request.method || "UNKNOWN-METHOD";
  let spanName, requestPath;

  // Update span details as per the request type-
  // CASE 1: If `request` is an `IncomingMessage` (an incoming HTTP request to our application):
  const incomingMessageRequestPath = request.url?.split("?")[0] || "";

  if (incomingMessageRequestPath) {
    // Update the variables as per the request type
    spanName = `${requestMethod} ${incomingMessageRequestPath}`;
    requestPath = incomingMessageRequestPath;
  }
  // CASE 2: If `request` is a `ClientRequest` (an outgoing HTTP request made by our application):
  else {
    const clientRequestHost = `${request.host}`;
    const clientRequestPath = request.path || "";

    // Update the variables as per the request type
    spanName = `${requestMethod} ${clientRequestHost}${clientRequestPath}`;
    requestPath = clientRequestPath;
  }

  // Update the span name and span attributes
  span.updateName(`${spanName}`);
  span.setAttribute("http.method", requestMethod);
  span.setAttribute("http.url", requestPath);
}