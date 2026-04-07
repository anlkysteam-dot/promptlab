import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px",
          background:
            "radial-gradient(circle at 18% 12%, #1b2a44 0%, rgba(27,42,68,0.25) 38%), radial-gradient(circle at 100% 0%, #2b1b47 0%, rgba(43,27,71,0.2) 35%), #0b0f14",
          color: "#e8eef7",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 14,
              border: "1px solid #32415f",
              background: "#121922",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 700,
              color: "#a78bfa",
            }}
          >
            pL
          </div>
          <div style={{ display: "flex", fontSize: 54, fontWeight: 700, letterSpacing: "-0.02em" }}>
            <span style={{ color: "#e8eef7" }}>Prompt</span>
            <span style={{ color: "#a78bfa", marginLeft: 10 }}>Lab</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: 980 }}>
          <div style={{ fontSize: 46, fontWeight: 700, lineHeight: 1.14 }}>
            Video Prompt Generator & AI Scene Continuity
          </div>
          <div style={{ fontSize: 28, color: "#9eb0c7", lineHeight: 1.35 }}>
            AI Prompt Builder ile karakter devamlılığını koruyarak video ve görsel promptlarını hızlıca üret.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
