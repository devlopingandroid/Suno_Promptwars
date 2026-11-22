import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Suno | A conversation about your wish',description:'A private space to discuss organ and tissue donation wishes with family.',robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
