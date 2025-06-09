import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from '@/components/providers/Providers'
import { ThemeProvider } from "@/components/ThemeProvider"
import { Toaster } from "@/components/ui/Toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "TokenIQ",
  description: "Real World Asset Tokenization Platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background font-sans antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>{children}</Providers>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}