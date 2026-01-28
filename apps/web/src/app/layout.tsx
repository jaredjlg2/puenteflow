import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Puenteflow",
  description: "GoHighLevel-style CRM MVP"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
