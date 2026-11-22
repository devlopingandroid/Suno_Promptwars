import { NextRequest, NextResponse } from 'next/server';
import { addInvite, deleteCircle, getCircle, safeDonorView, saveWish } from '@/lib/store';
export const runtime='nodejs';
const unauthorized=()=>NextResponse.json({error:'Start a demo conversation first.'},{status:401});
export async function GET(req:NextRequest){const c=getCircle(req.cookies.get('suno_demo')?.value);return c?NextResponse.json({circle:safeDonorView(c)},{headers:{'Cache-Control':'no-store'}}):unauthorized();}
export async function POST(req:NextRequest){const id=req.cookies.get('suno_demo')?.value,c=getCircle(id);if(!c||!id)return unauthorized();let body:unknown;try{body=await req.json();}catch{return NextResponse.json({error:'Invalid request.'},{status:400});}if(typeof body!=='object'||!body)return NextResponse.json({error:'Invalid request.'},{status:400});const b=body as Record<string,unknown>;
  if(b.action==='wish'&&typeof b.wish==='string'){saveWish(id,b.wish);return NextResponse.json({circle:safeDonorView(c)});}
  if(b.action==='invite'&&typeof b.name==='string'){const invite=addInvite(id,b.name);return invite?NextResponse.json({circle:safeDonorView(c)}):NextResponse.json({error:'Enter a name. A circle can have up to three invitees.'},{status:400});}
  if(b.action==='delete'){deleteCircle(id);const res=NextResponse.json({ok:true});res.cookies.delete('suno_demo');return res;}
  return NextResponse.json({error:'Invalid request.'},{status:400});
}
