import { ImageResponse } from "next/og";

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
        fontSize: 130,
        fontWeight: 600,
        lineHeight: 1,
        paddingBottom: 18,
      }}
    >
      g
    </div>,
    { width: 192, height: 192 },
  );
}
