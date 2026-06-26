interface StatusBannerProps {
  message: string;
  tone: "idle" | "loading" | "saving" | "error";
}

export function StatusBanner({ message, tone }: StatusBannerProps) {
  return (
    <div className={`status-banner status-${tone}`} role={tone === "error" ? "alert" : "status"}>
      <span className="sync-dot" />
      {message}
    </div>
  );
}
