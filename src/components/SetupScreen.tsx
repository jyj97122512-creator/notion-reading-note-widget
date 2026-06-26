import { useState } from "react";
import { saveConfig, DEFAULT_CONFIG, buildEmbedUrl, type WidgetConfig } from "../config";

interface Props {
  onDone: () => void;
}

type Step = "input" | "embed";

export function SetupScreen({ onDone }: Props) {
  const [step, setStep] = useState<Step>("input");
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = token.trim();
    if (!t) { setError("Notion 통합 토큰을 입력하세요."); return; }

    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Authorization": `Bearer ${t}` }
      });

      if (!res.ok) {
        setError(await res.text());
        setStatus("error");
        return;
      }

      const { notesDatabaseId, recordsDatabaseId } = await res.json() as {
        notesDatabaseId: string;
        recordsDatabaseId: string;
      };

      const config: WidgetConfig = {
        token: t,
        notesDatabaseId,
        recordsDatabaseId,
        ...DEFAULT_CONFIG
      };
      saveConfig(config);
      setEmbedUrl(buildEmbedUrl(config));
      setStatus("idle");
      setStep("embed");
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setStatus("error");
    }
  }

  function handleCopy() {
    void navigator.clipboard.writeText(embedUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (step === "embed") {
    return (
      <div style={styles.overlay}>
        <div style={styles.card}>
          <div style={styles.successIcon}>✅</div>
          <h2 style={styles.title}>연결 완료!</h2>
          <p style={styles.subtitle}>
            아래 링크를 Notion 페이지에 임베드하면 위젯을 바로 사용할 수 있습니다.
          </p>

          <div style={styles.urlBox}>
            <span style={styles.urlText}>{embedUrl}</span>
          </div>

          <button style={styles.copyBtn} onClick={handleCopy}>
            {copied ? "✓ 복사됨" : "링크 복사"}
          </button>

          <div style={styles.helpBox}>
            <p style={styles.helpTitle}>Notion 임베드 방법</p>
            <ol style={styles.helpList}>
              <li>Notion 페이지에서 <code>/embed</code> 입력</li>
              <li>위 링크 붙여넣기 → Enter</li>
            </ol>
          </div>

          <p style={styles.warningText}>
            ⚠️ 이 링크에는 Notion 토큰이 포함됩니다. 신뢰할 수 있는 사람과만 공유하세요.
          </p>

          <button style={styles.startBtn} onClick={onDone}>
            위젯 시작하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay}>
      <form onSubmit={(e) => { void handleSubmit(e); }} style={styles.card}>
        <h2 style={styles.title}>독서노트 위젯 설정</h2>
        <p style={styles.subtitle}>
          Notion 통합 토큰을 입력하면 DB를 자동으로 연결합니다.
        </p>

        <label style={styles.label}>
          Notion 통합 토큰 <span style={styles.required}>*</span>
        </label>
        <input
          style={styles.input}
          type="password"
          placeholder="secret_..."
          value={token}
          onChange={e => setToken(e.target.value)}
          autoComplete="off"
          disabled={status === "loading"}
        />

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" style={styles.submit} disabled={status === "loading"}>
          {status === "loading" ? "DB 검색 중..." : "시작하기"}
        </button>

        <p style={styles.hint}>
          토큰은 브라우저 localStorage에만 저장되며 서버로 전송될 때만 사용됩니다.
        </p>

        <div style={styles.helpBox}>
          <p style={styles.helpTitle}>통합 토큰 발급 방법</p>
          <ol style={styles.helpList}>
            <li>notion.so/my-integrations 에서 새 통합 생성</li>
            <li>생성된 <code>secret_...</code> 토큰 복사</li>
            <li>Notion에서 <strong>독서노트</strong>, <strong>독서기록</strong> DB 각각 열고 → ··· → 연결 → 통합 추가</li>
          </ol>
        </div>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed", inset: 0,
    background: "#F5F5F7",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 16, zIndex: 100
  },
  card: {
    background: "#fff", borderRadius: 20,
    padding: "32px 28px",
    width: "100%", maxWidth: 440,
    boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
    display: "flex", flexDirection: "column", gap: 10
  },
  successIcon: { fontSize: 40, textAlign: "center" },
  title: { margin: 0, fontSize: 22, fontWeight: 700, color: "#1C1C1E", textAlign: "center" },
  subtitle: { margin: "0 0 8px", fontSize: 14, color: "#6C6C70", lineHeight: 1.5, textAlign: "center" },
  label: { fontSize: 13, fontWeight: 600, color: "#3C3C43" },
  required: { color: "#FF3B30" },
  input: {
    padding: "10px 14px", borderRadius: 10,
    border: "1.5px solid #D1D1D6", fontSize: 14, outline: "none",
    background: "#F5F5F7", width: "100%", boxSizing: "border-box"
  },
  error: { color: "#FF3B30", fontSize: 13, margin: 0 },
  submit: {
    marginTop: 4, padding: "14px", borderRadius: 999,
    background: "#0A84FF", color: "#fff", border: "none",
    fontSize: 16, fontWeight: 700, cursor: "pointer"
  },
  hint: { fontSize: 12, color: "#AEAEB2", margin: 0, textAlign: "center", lineHeight: 1.5 },
  urlBox: {
    background: "#F5F5F7", borderRadius: 10, padding: "12px 14px",
    wordBreak: "break-all", fontSize: 12, color: "#3C3C43", lineHeight: 1.6
  },
  urlText: { fontFamily: "monospace" },
  copyBtn: {
    padding: "12px", borderRadius: 999,
    background: "#0A84FF", color: "#fff", border: "none",
    fontSize: 15, fontWeight: 700, cursor: "pointer"
  },
  startBtn: {
    padding: "12px", borderRadius: 999,
    background: "#F5F5F7", color: "#0A84FF", border: "none",
    fontSize: 15, fontWeight: 600, cursor: "pointer"
  },
  warningText: {
    fontSize: 12, color: "#FF9F0A", lineHeight: 1.5,
    background: "#FFF9F0", borderRadius: 8, padding: "10px 12px", margin: 0
  },
  helpBox: {
    background: "#F5F5F7", borderRadius: 12, padding: "14px 16px"
  },
  helpTitle: { margin: "0 0 6px", fontSize: 12, fontWeight: 700, color: "#3C3C43" },
  helpList: { margin: 0, paddingLeft: 18, fontSize: 12, color: "#6C6C70", lineHeight: 1.8 }
};
