export async function register() {
  // Yerel geliştirmede OTLP toplayıcısı (grafana-alloy) yoktur; bağlantı denemeleri
  // boşuna kaynak harcar. OTEL_SDK_DISABLED=true ise telemetri hiç başlatılmaz.
  if (process.env.OTEL_SDK_DISABLED === "true") return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation.node");
  }
}
