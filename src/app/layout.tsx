import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: `${site.name} | Building and pest inspections in ${site.area}`, template: `%s | ${site.name}` },
  description: `Pre-purchase building and timber pest inspections across ${site.area}, with photo reports you can view online.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={archivo.variable}>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
