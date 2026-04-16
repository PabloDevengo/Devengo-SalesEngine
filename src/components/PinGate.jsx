import { useState, useEffect, useRef } from "react";
import { getPinStatus, verifyPin, createPin } from "../services/authService";

// ── Moved OUTSIDE PinGate to avoid remount on every render ─────────────────
function PinInputs({ arr, setArr, inputRefs, onComplete, onDigit, onKey, disabled }) {
  return (
    <div className="flex gap-3 justify-center">
      {arr.map((d, i) => (
        <input
          key={i}
          ref={inputRefs[i]}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={e => onDigit(e.target.value, i, arr, setArr, inputRefs, onComplete)}
          onKeyDown={e => onKey(e, i, inputRefs)}
          disabled={disabled}
          className="w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:outline-none transition-colors bg-white disabled:opacity-50"
        />
      ))}
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function PinGate({ onSuccess }) {
  const [status, setStatus]     = useState("loading"); // loading | unset | enter
  const [digits, setDigits]     = useState(["", "", "", ""]);
  const [confirm, setConfirm]   = useState(["", "", "", ""]);
  const [step, setStep]         = useState("pin");     // pin | confirm (only in unset)
  const [error, setError]       = useState("");
  const [checking, setChecking] = useState(false);

  const refs  = [useRef(), useRef(), useRef(), useRef()];
  const cRefs = [useRef(), useRef(), useRef(), useRef()];

  // Check if PIN has been created
  useEffect(() => {
    getPinStatus()
      .then(s => setStatus(s === "set" ? "enter" : "unset"))
      .catch(() => setStatus("enter"));
  }, []);

  // Auto-focus first box whenever the visible inputs change
  useEffect(() => {
    if (status === "loading") return;
    const firstRef = step === "confirm" ? cRefs[0] : refs[0];
    setTimeout(() => firstRef.current?.focus(), 50);
  }, [status, step]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Digit handler (passed as prop so PinInputs stays pure) ───────────────
  function handleDigit(val, idx, arr, setArr, nextRefs, onComplete) {
    if (!/^\d?$/.test(val)) return;
    const next = [...arr];
    next[idx] = val;
    setArr(next);
    setError("");
    if (val && idx < 3) nextRefs[idx + 1].current?.focus();
    if (val && idx === 3) onComplete(next.join(""));
  }

  function handleKey(e, idx, inputRefs) {
    if (e.key === "Backspace" && !inputRefs[idx].current?.value && idx > 0) {
      inputRefs[idx - 1].current?.focus();
    }
  }

  // ── Actions ───────────────────────────────────────────────────
  async function handleEnter(pin) {
    setChecking(true);
    const ok = await verifyPin(pin);
    setChecking(false);
    if (ok) {
      sessionStorage.setItem("se_auth", "1");
      onSuccess();
    } else {
      setError("PIN incorrecto. Inténtalo de nuevo.");
      setDigits(["", "", "", ""]);
      setTimeout(() => refs[0].current?.focus(), 50);
    }
  }

  function handleCreate(pin) {
    setStep("confirm");
  }

  async function handleConfirm(confirmPin) {
    const pin = digits.join("");
    if (confirmPin !== pin) {
      setError("Los PINs no coinciden. Inténtalo de nuevo.");
      setConfirm(["", "", "", ""]);
      setTimeout(() => cRefs[0].current?.focus(), 50);
      return;
    }
    setChecking(true);
    await createPin(pin);
    setChecking(false);
    sessionStorage.setItem("se_auth", "1");
    onSuccess();
  }

  // ── Loading ───────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Main screen ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 w-full max-w-sm text-center space-y-8">

        {/* Logo / Brand */}
        <div className="space-y-2">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto text-white text-2xl font-bold shadow-md">
            D
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Sales Engine</h1>
          <p className="text-xs text-gray-400">Devengo · Herramienta interna</p>
        </div>

        {/* Instruction */}
        <div>
          {status === "unset" && step === "pin" && (
            <>
              <p className="text-sm font-medium text-gray-700">Crea el PIN del equipo</p>
              <p className="text-xs text-gray-400 mt-1">Todos usaréis este PIN para acceder</p>
            </>
          )}
          {status === "unset" && step === "confirm" && (
            <>
              <p className="text-sm font-medium text-gray-700">Confirma el PIN</p>
              <p className="text-xs text-gray-400 mt-1">Repite los 4 dígitos</p>
            </>
          )}
          {status === "enter" && (
            <>
              <p className="text-sm font-medium text-gray-700">Introduce el PIN</p>
              <p className="text-xs text-gray-400 mt-1">Acceso compartido del equipo</p>
            </>
          )}
        </div>

        {/* PIN inputs */}
        {status === "unset" && step === "pin" && (
          <PinInputs
            arr={digits} setArr={setDigits}
            inputRefs={refs}
            onComplete={handleCreate}
            onDigit={handleDigit}
            onKey={handleKey}
            disabled={checking}
          />
        )}
        {status === "unset" && step === "confirm" && (
          <PinInputs
            arr={confirm} setArr={setConfirm}
            inputRefs={cRefs}
            onComplete={handleConfirm}
            onDigit={handleDigit}
            onKey={handleKey}
            disabled={checking}
          />
        )}
        {status === "enter" && (
          <PinInputs
            arr={digits} setArr={setDigits}
            inputRefs={refs}
            onComplete={handleEnter}
            onDigit={handleDigit}
            onKey={handleKey}
            disabled={checking}
          />
        )}

        {/* Spinner / error */}
        {checking && (
          <div className="flex justify-center">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {error && (
          <p className="text-xs text-red-500 font-medium">{error}</p>
        )}

        {/* Hint */}
        <p className="text-xs text-gray-300">
          {status === "enter" ? "4 dígitos · se cierra al cerrar el navegador" : "4 dígitos"}
        </p>
      </div>
    </div>
  );
}
