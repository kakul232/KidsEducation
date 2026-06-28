import React, { useEffect, useRef, useState } from "react";

interface SandboxProps {
  htmlContent: string;
  onComplete: (correctCount: number, incorrectCount: number, stars?: number) => void;
  onAttempt: () => void;
  onAction?: (question: string, answer: string, success: boolean) => void;
}

export const Sandbox: React.FC<SandboxProps> = ({ htmlContent, onComplete, onAttempt, onAction }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [blobUrl, setBlobUrl] = useState<string>("");

  useEffect(() => {
    if (!htmlContent) return;

    // Create a Blob with HTML content and set it as the iframe source
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);

    // Cleanup blob URL on unmount
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [htmlContent]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Check if message comes from our iframe source
      if (iframeRef.current && event.source === iframeRef.current.contentWindow) {
        const data = event.data;
        if (data && typeof data === "object") {
          if (data.type === "game_complete") {
            onComplete(data.correctCount || 0, data.incorrectCount || 0, data.stars);
          } else if (data.type === "game_attempt") {
            onAttempt();
          } else if (data.type === "game_action") {
            if (onAction) {
              onAction(data.question || "Unknown Question", data.answer || "Unknown Answer", !!data.success);
            }
          }
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [onComplete, onAttempt, onAction]);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "460px",
        margin: "0 auto",
        aspectRatio: "9 / 16",
        borderRadius: "24px",
        overflow: "hidden",
        border: "5px solid var(--text-primary)",
        backgroundColor: "#ffffff",
        position: "relative",
        boxShadow: "0 12px 24px rgba(0,0,0,0.08)"
      }}
    >
      {blobUrl ? (
        <iframe
          ref={iframeRef}
          src={blobUrl}
          title="Educational Game Sandbox"
          sandbox="allow-scripts"
          style={{
            width: "100%",
            height: "100%",
            border: "none",
            display: "block"
          }}
        />
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "var(--text-secondary)"
          }}
        >
          Loading game sandbox...
        </div>
      )}
    </div>
  );
};
export default Sandbox;
