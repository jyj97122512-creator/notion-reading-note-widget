import { SendHorizontal } from "lucide-react";
import { useState } from "react";
import type { MemoType } from "../types";

interface ComposerProps {
  onSubmit(text: string, type: MemoType): boolean | Promise<boolean>;
}

export function Composer({ onSubmit }: ComposerProps) {
  const [text, setText] = useState("");
  const [type, setType] = useState<MemoType>("thought");

  async function submit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    const ok = await onSubmit(trimmed, type);
    if (ok) setText("");
  }

  return (
    <form
      className="composer"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="type-toggle" aria-label="메모 유형">
        <button type="button" className={type === "passage" ? "active" : ""} onClick={() => setType("passage")}>
          구절
        </button>
        <button type="button" className={type === "thought" ? "active" : ""} onClick={() => setType("thought")}>
          생각
        </button>
      </div>
      <textarea
        aria-label="메모 입력"
        value={text}
        rows={1}
        placeholder="구절이나 생각을 남기기..."
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void submit();
          }
        }}
      />
      <button type="submit" className="send-button" aria-label="등록" disabled={!text.trim()}>
        <SendHorizontal size={18} aria-hidden="true" />
      </button>
    </form>
  );
}
