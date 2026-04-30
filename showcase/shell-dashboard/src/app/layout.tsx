import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CopilotKit Internal Showcase",
  description: "Internal feature × integration matrix",
  icons: { icon: "/icon.svg" },
  openGraph: {
    title: "CopilotKit Internal Showcase",
    description: "Internal feature × integration matrix",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
