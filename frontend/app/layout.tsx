import "./globals.css";
import { Manrope } from "next/font/google";
import { AuthProvider } from "@/providers/auth-providers";
import { Providers } from "@/app/providers";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-ui",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body className={`${manrope.variable} font-sans`}>
        <AuthProvider>
          <Providers>{children}</Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
