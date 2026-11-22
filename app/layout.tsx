import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Suno | Donation coordination platform',description:'A clearer path from willingness to coordinated action for donors and hospital coordinators.',robots:{index:false,follow:false}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
