import { useState, useRef, useEffect } from "react";
import { Zap, X, Copy } from "lucide-react";
import { useApp } from "../../context/AppContext";

export default function MeetingsModule() {
  const { meetingPrompt, webhooks, setWebhook } = useApp();

  const [transcript,    setTranscript]    = useState(null);
  const [fileName,      setFileName]      = useState(null);
  const [dragging,      setDragging]      = useState(false);
  const [error,         setError]         = useState(null);
  const [analyzing,     setAnalyzing]     = useState(false);
  const [analysis,      setAnalysis]      = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [webhookUrl,    setWebhookUrl]    = useState(import.meta.env.VITE_N8N_MEETINGS_WEBHOOK || "");
  const inputRef = useRef();

  useEffect(() => { if (webhooks.meetings) setWebhookUrl(webhooks.meetings); }, [webhooks.meetings]);

  // Whether to use N8N or call Claude directly
  const useN8N = webhookUrl.trim().length > 0;

  const readFile = (file) => {
    setError(null); setAnalysis(null);
    if (!file) return;
    if (!file.name.endsWith(".txt")) { setError("Solo se admiten archivos .txt por ahora."); return; }
    const reader = new FileReader();
    reader.onload  = (e) => { setTranscript(e.target.result); setFileName(file.name); };
    reader.onerror = () => setError("Error leyendo el archivo.");
    reader.readAsText(file, "UTF-8");
  };
  const onDrop = (e) => { e.preventDefault(); setDragging(false); readFile(e.dataTransfer.files[0]); };
  const clear  = () => { setTranscript(null); setFileName(null); setError(null); setAnalysis(null); setAnalysisError(null); };

  // ── Análisis via N8N ──────────────────────────────────────
  const analizarN8N = async () => {
    setAnalyzing(true); setAnalysisError(null); setAnalysis(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);
      const res = await fetch(webhookUrl.trim(), {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcripcion: transcript,
          nombre_archivo: fileName,
          system_prompt: meetingPrompt,
        }),
      });
      clearTimeout(timeout);
      if (!res.ok) { setAnalysisError(`Error HTTP ${res.status} desde N8N.`); return; }
      const data = await res.json();
      // Accept { analysis: "..." }, { resultado: "..." }, { output: "..." } or a plain string
      const text = typeof data === "string"
        ? data
        : data.analysis ?? data.resultado ?? data.output ?? data.text ?? JSON.stringify(data, null, 2);
      setAnalysis(text);
    } catch (e) {
      setAnalysisError(e.name === "AbortError" ? "Timeout: N8N tardó más de 2 minutos." : `Error de red: ${e.message}`);
    } finally { setAnalyzing(false); }
  };

  // ── Análisis via Claude API directo ───────────────────────
  const analizarClaude = async () => {
    setAnalyzing(true); setAnalysisError(null); setAnalysis(null);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY || "",
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2500,
          system: meetingPrompt,
          messages: [{ role: "user", content: `Aquí está la transcripción:\n\n${transcript}` }],
        }),
      });
      if (!res.ok) { setAnalysisError(`Error HTTP ${res.status}`); return; }
      const data = await res.json();
      if (data.error) { setAnalysisError(`${data.error.type}: ${data.error.message}`); return; }
      setAnalysis(data.content?.find(b => b.type === "text")?.text || "");
    } catch (e) {
      setAnalysisError(`Error de red: ${e.message}`);
    } finally { setAnalyzing(false); }
  };

  const analizar = () => useN8N ? analizarN8N() : analizarClaude();

  const wordCount = transcript ? transcript.trim().split(/\s+/).length : 0;
  const lineCount = transcript ? transcript.split("\n").length : 0;

  return (
    <div className="px-8 py-6 max-w-3xl w-full space-y-5">

      {/* ── Cargar archivo ── */}
      {!transcript && (
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <span className="text-base">🎙️</span>
            <h2 className="text-sm font-semibold text-gray-800">Cargar transcripción</h2>
          </div>
          <div className="px-6 py-8">
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current.click()}
              className={`border-2 border-dashed rounded-xl px-8 py-12 text-center cursor-pointer transition-all ${dragging ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"}`}>
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-4 text-xl">📄</div>
              <p className="text-sm font-medium text-gray-700 mb-1">Arrastra tu archivo .txt aquí</p>
              <p className="text-xs text-gray-400">o haz clic para seleccionarlo</p>
              <input ref={inputRef} type="file" accept=".txt" onChange={e => readFile(e.target.files[0])} className="hidden" />
            </div>
            {error && <p className="mt-3 text-xs text-red-500 font-medium">{error}</p>}
            <p className="text-xs text-gray-400 mt-4 text-center">Formatos admitidos: <span className="font-medium text-gray-500">.txt</span> · Próximamente: .docx, .vtt, .srt</p>
          </div>
        </section>
      )}

      {/* ── Archivo cargado ── */}
      {transcript && (
        <>
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-50 rounded-lg flex items-center justify-center text-base shrink-0">📄</div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{fileName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{wordCount.toLocaleString()} palabras · {lineCount.toLocaleString()} líneas</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={analizar} disabled={analyzing}
                  className={`flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-lg font-medium transition-all ${analyzing ? "bg-indigo-100 text-indigo-400 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}>
                  {analyzing
                    ? <><span className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />Analizando...</>
                    : <><Zap size={11} />Analizar</>}
                </button>
                <button onClick={clear} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all">
                  <X size={11} /> Quitar
                </button>
              </div>
            </div>

            {/* Modo activo + webhook config */}
            <div className="px-6 pb-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${useN8N ? "bg-violet-50 text-violet-600 border border-violet-100" : "bg-indigo-50 text-indigo-600 border border-indigo-100"}`}>
                  {useN8N ? "⚡ Via N8N" : "🤖 Claude directo"}
                </span>
                <span className="text-xs text-gray-400">{useN8N ? "El análisis lo procesa tu workflow de N8N" : "Llama directamente a la API de Claude"}</span>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1">
                  Webhook N8N <span className="normal-case font-normal text-gray-300">(opcional — si está vacío usa Claude directo)</span>
                </label>
                <input value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  onBlur={e => setWebhook('meetings', e.target.value)}
                  placeholder="https://tu-n8n.com/webhook/meetings"
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 font-mono" />
              </div>
            </div>
          </section>

          {analysisError && <div className="bg-red-50 border border-red-100 rounded-xl px-5 py-4 text-xs text-red-600 font-mono">{analysisError}</div>}

          {analysis && (
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-800">Análisis</h2>
                <button onClick={() => navigator.clipboard.writeText(analysis).catch(() => {})}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-all">
                  <Copy size={11} /> Copiar
                </button>
              </div>
              <div className="px-6 py-5 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{analysis}</div>
            </section>
          )}

          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Transcripción</h2>
            </div>
            <pre className="px-6 py-5 text-xs text-gray-500 font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto max-h-72 overflow-y-auto bg-gray-50">{transcript}</pre>
          </section>
        </>
      )}
    </div>
  );
}
