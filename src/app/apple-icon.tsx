import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
        fontSize: 110,
        fontWeight: 600,
        lineHeight: 1,
        paddingBottom: 16,
      }}
    >
      g
    </div>,
    { ...size },
  );
}
