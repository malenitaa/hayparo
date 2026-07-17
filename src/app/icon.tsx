import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#059669",
          borderRadius: 7,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="5" width="16" height="12" rx="3" fill="white" />
          <rect x="6.5" y="7.5" width="3" height="3" rx="0.6" fill="#059669" />
          <rect x="10.5" y="7.5" width="3" height="3" rx="0.6" fill="#059669" />
          <rect x="14.5" y="7.5" width="3" height="3" rx="0.6" fill="#059669" />
          <circle cx="8.5" cy="18.5" r="2.3" fill="#0f172a" />
          <circle cx="15.5" cy="18.5" r="2.3" fill="#0f172a" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
