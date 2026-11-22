import { NextRequest, NextResponse } from 'next/server';
import { createCircle, getCircle, safeDonorView } from '@/lib/store';
export const runtime='nodejs';
export async function GET(req:NextRequest){const c=getCircle(req.cookies.get('suno_demo')?.value);return NextResponse.json(c?{circle:safeDonorView(c),mode:'demo'}:{circle:null,mode:'demo'},{headers:{'Cache-Control':'no-store'}});}
export async function POST(req:NextRequest){let seeded=false;try{seeded=(await req.json()).seeded===true;}catch{}const c=createCircle(seeded);const res=NextResponse.json({circle:safeDonorView(c),mode:'demo'});res.cookies.set('suno_demo',c.id,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:86400});return res;}
