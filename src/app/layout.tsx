import type { Metadata } from "next";
import { Figtree, Sora } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Oficinas & Arrendamientos",
  description: "Dashboard de arrendamientos y tickets",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${figtree.variable} ${sora.variable} h-full antialiased`}>
      <body className="min-h-full flex font-sans text-slate-800">
        <Sidebar />
        <div className="flex-1 min-w-0 flex flex-col">
          <Navbar />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </body>
    </html>
  );
}
