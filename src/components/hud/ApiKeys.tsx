"use client";

import { useState } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import { useHydrated } from "@/hooks/useHydrated";

interface ApiKeysProps {
  /** Direção em que o popover abre (no rodapé do Manifesto, abre p/ cima). */
  placement?: "down" | "up";
}

interface KeyFieldProps {
  label: string;
  hint: React.ReactNode;
  placeholder: string;
  value: string;
  hydrated: boolean;
  onSave: (k: string) => void;
  onClear: () => void;
  link: { href: string; text: string };
}

/** Um campo de chave (label + input password + salvar/remover + link). */
function KeyField({
  label, hint, placeholder, value, hydrated, onSave, onClear, link,
}: KeyFieldProps) {
  const [draft, setDraft] = useState(value);
  const active = hydrated && Boolean(value);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="font-display text-[10px] tracking-[0.12em] text-text">
          {label}
        </span>
        {active && <span className="font-mono text-[9px] text-gold">✓ ativa</span>}
      </div>
      <p className="mb-1.5 font-mono text-[9px] leading-relaxed text-text-muted">
        {hint}
      </p>
      <input
        type="password"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className="mb-1.5 w-full rounded border border-border bg-void px-2 py-1.5 font-mono text-[11px] text-text outline-none transition focus:border-cyan"
      />
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            onClear();
            setDraft("");
          }}
          className="font-mono text-[10px] text-text-dim transition hover:text-red-alert"
        >
          remover
        </button>
        <div className="flex items-center gap-2">
          <a
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[9px] text-text-dim underline transition hover:text-cyan"
          >
            {link.text}
          </a>
          <button
            type="button"
            onClick={() => onSave(draft)}
            className="rounded border border-cyan px-2 py-1 font-display text-[9px] tracking-wide text-cyan transition"
            style={{ backgroundColor: "#00F5FF14" }}
          >
            salvar
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Botão + popover para o Visitante colar as próprias chaves (BYOK, ADR-0002/0015):
 *  - Gemini (chave de host): roda o modelo base na cota dele, escapando da cota
 *    de teste limitada do host. Não destrava modelo novo.
 *  - OpenRouter (chave premium): destrava o modelo premium (Claude).
 * As chaves vivem só no navegador (settingsStore) e vão só na missão do ator.
 */
export function ApiKeys({ placement = "down" }: ApiKeysProps) {
  const hydrated = useHydrated();
  const byokKey = useSettingsStore((s) => s.byokKey);
  const setByokKey = useSettingsStore((s) => s.setByokKey);
  const clearByokKey = useSettingsStore((s) => s.clearByokKey);
  const geminiKey = useSettingsStore((s) => s.geminiKey);
  const setGeminiKey = useSettingsStore((s) => s.setGeminiKey);
  const clearGeminiKey = useSettingsStore((s) => s.clearGeminiKey);

  const [open, setOpen] = useState(false);
  const active = hydrated && (Boolean(byokKey) || Boolean(geminiKey));

  return (
    <div className="relative">
      <button
        type="button"
        title="Suas chaves de API — Gemini (uso na sua cota) e OpenRouter (modelo premium)"
        onClick={() => setOpen((o) => !o)}
        className="rounded border px-2.5 py-1 font-display text-[9px] tracking-[0.12em] transition"
        style={{
          borderColor: active ? "#FFD700" : "#1E3A5F",
          color: active ? "#FFD700" : "#5A7A94",
          boxShadow: active ? "0 0 10px #FFD70044" : undefined,
        }}
      >
        {active ? "✓ CHAVES DE API" : "+ CHAVES DE API"}
      </button>

      {open && (
        <div
          className={`absolute right-0 z-50 w-72 space-y-3 rounded border border-border bg-surface p-3 shadow-glow-cyan ${
            placement === "up" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          <KeyField
            label="GEMINI"
            hint={
              <>
                Sua chave do{" "}
                <span className="text-cyan">Google AI Studio</span> roda o modelo
                base na <span className="text-cyan">sua cota</span>, sem o limite
                de teste do demo.
              </>
            }
            placeholder="AIza..."
            value={geminiKey}
            hydrated={hydrated}
            onSave={setGeminiKey}
            onClear={clearGeminiKey}
            link={{ href: "https://aistudio.google.com/apikey", text: "obter chave →" }}
          />

          <div className="border-t border-border/60" />

          <KeyField
            label="OPENROUTER · PREMIUM"
            hint={
              <>
                Sua chave <span className="text-cyan">OpenRouter</span> destrava o
                modelo premium (Claude).
              </>
            }
            placeholder="sk-or-..."
            value={byokKey}
            hydrated={hydrated}
            onSave={setByokKey}
            onClear={clearByokKey}
            link={{ href: "https://openrouter.ai/keys", text: "obter chave →" }}
          />

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full rounded border border-border py-1 font-display text-[9px] tracking-wide text-text-muted transition hover:text-text"
          >
            fechar
          </button>
        </div>
      )}
    </div>
  );
}
