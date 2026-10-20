import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-grpc";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-grpc";
import { processDetector, resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { GrpcInstrumentation } from "@opentelemetry/instrumentation-grpc";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { AlwaysOnSampler, BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { logs, SeverityNumber, type Logger } from "@opentelemetry/api-logs";

/**
 * OTLP toplayıcı adresi.
 *
 * Referansta `http://grafana-alloy:4317` koda gömülüydü — başka bir ortamda
 * çalıştırmak için kod değişikliği gerekiyordu. Artık env'den okunur.
 */
const OTLP_ENDPOINT =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? "http://grafana-alloy:4317";

const SERVICE_NAME = process.env.OTEL_SERVICE_NAME ?? "finegrouphub-panel";

const spanProcessor = new BatchSpanProcessor(
  new OTLPTraceExporter({ url: OTLP_ENDPOINT })
);

const logProcessor = new BatchLogRecordProcessor(
  new OTLPLogExporter({ url: OTLP_ENDPOINT })
);

const metricReader = new PeriodicExportingMetricReader({
  exporter: new OTLPMetricExporter({ url: OTLP_ENDPOINT }),
});

const sdk = new NodeSDK({
  autoDetectResources: true,
  resourceDetectors: [processDetector],
  resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: SERVICE_NAME }),
  spanProcessors: [spanProcessor],
  logRecordProcessors: [logProcessor],
  metricReader,
  contextManager: new AsyncLocalStorageContextManager(),
  sampler: new AlwaysOnSampler(),
  instrumentations: [new GrpcInstrumentation(), new HttpInstrumentation()],
});

// Yerelde toplayıcı yoksa (OTEL_SDK_DISABLED=true) SDK başlatılmaz; `logger`
// global provider kaydedilmediği için OpenTelemetry'nin no-op logger'ı olur.
const OTEL_DISABLED = process.env.OTEL_SDK_DISABLED === "true";

if (!OTEL_DISABLED) {
  const loggerProvider = new LoggerProvider();
  loggerProvider.addLogRecordProcessor(logProcessor);
  logs.setGlobalLoggerProvider(loggerProvider);
}

const logger: Logger = logs.getLogger("default");

if (!OTEL_DISABLED) {
  try {
    sdk.start();

    logger.emit({
      severityNumber: SeverityNumber.INFO,
      severityText: "INFO",
      body: "Application started",
      attributes: { "log.type": "LogRecord", service: SERVICE_NAME },
    });

    console.log(`OpenTelemetry initialized (${OTLP_ENDPOINT})`);
  } catch (error) {
    // Toplayıcı yoksa uygulama yine de ayağa kalkmalı — telemetri opsiyoneldir.
    console.warn("OpenTelemetry başlatılamadı, telemetri devre dışı:", error);
  }
} else {
  console.log("OpenTelemetry devre dışı (OTEL_SDK_DISABLED=true)");
}

export { logger };
