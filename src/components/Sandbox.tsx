import React, { useEffect, useRef, useState } from "react";

interface SandboxProps {
  htmlContent: string;
  onComplete: (correctCount: number, incorrectCount: number) => void;
  onAttempt: () => void;
}

export const Sandbox: React.FC<SandboxProps> = ({ htmlContent, onComplete, onAttempt }) => {
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
            onComplete(data.correctCount || 1, data.incorrectCount || 0);
          } else if (data.type === "game_attempt") {
            onAttempt();
          }
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [onComplete, onAttempt]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minHeight: "380px",
        borderRadius: "24px",
        overflow: "hidden",
        border: "3px solid #e2e8f0",
        backgroundColor: "#ffffff",
        position: "relative"
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
            minHeight: "380px",
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
