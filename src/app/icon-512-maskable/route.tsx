import { ImageResponse } from "next/og";

// Maskable icons get cropped by OS mask shapes (circle, squircle, etc.),
// so the "g" sits smaller and centered within a safe zone.
export function GET() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#b0563a",
        color: "#faf7f2",
        fontSize: 220,
        fontWeight: 600,
        lineHeight: 1,
        paddingBottom: 30,
      }}
    >
      g
    </div>,
    { width: 512, height: 512 },
  );
}
