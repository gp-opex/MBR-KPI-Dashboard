import { Source_Sans_3 } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from './components/ThemeContext'

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-source-sans',
})

export const metadata = {
  title: 'GroundProbe — Support Operations',
  description: 'GroundProbe Support Operations Dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sourceSans.variable} h-full`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var s=localStorage.getItem('mbr-kpi-theme');if(s==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}`,
          }}
        />
      </head>
      <body style={{ fontFamily: 'var(--font-source-sans), Segoe UI, Tahoma, sans-serif', minHeight: '100vh', margin: 0 }}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
