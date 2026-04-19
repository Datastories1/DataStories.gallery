import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "datastories.gallery — Power BI Templates",
  description: "Professional Power BI dashboard templates with instant delivery.",
  metadataBase: new URL("https://datastories.gallery"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif" }}>
        <header style={{ padding: 16, borderBottom: "1px solid #eee" }}>
          <a href="/" style={{ textDecoration: "none", color: "#111", fontWeight: 700 }}>
            datastories.gallery
          </a>
          <span style={{ marginLeft: 16 }}>
            <a href="/templates">Templates</a>
          </span>
        </header>
        <main style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>{children}</main>
        <footer style={{ padding: 16, borderTop: "1px solid #eee", marginTop: 40 }}>
          <small>© {new Date().getFullYear()} datastories.gallery</small>
        </footer>
      </body>
    </html>
  );
}
