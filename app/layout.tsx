import type React from "react"
import type { Metadata, Viewport } from "next"
import { JetBrains_Mono } from "next/font/google"
import "./globals.css"

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500", "700"],
})

export const metadata: Metadata = {
  title: "Free Code — CLI",
  description: "Claude Code 风格的命令行终端网页界面",
}

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className={`${jetbrainsMono.variable} bg-background`}>
      <body className="font-mono antialiased">{children}</body>
    </html>
  )
}
