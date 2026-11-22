import { NextRequest, NextResponse } from 'next/server';
import { getCircle } from '@/lib/store';
export const runtime='nodejs';
export async function POST(req:NextRequest){if(!getCircle(req.cookies.get('suno_demo')?.value))return NextResponse.json({error:'Start a conversation first.'},{status:401});let wish='';try{wish=(await req.json()).wish;}catch{}if(typeof wish!=='string'||wish.length>800)return NextResponse.json({error:'Write up to 800 characters.'},{status:400});
  // Demo aid keeps the original statement verbatim and only adds an optional, gentle frame.
  const original=wish.trim().replace(/\s+/g,' ');
  const hindi=/[\u0900-\u097F]/.test(original);
  const opening=hindi?'मैं आपसे अपनी एक निजी बात साझा करना चाहता/चाहती हूँ। ':'I would like to share something personal with you. ';
  const closing=hindi?' हम इस पर तब बात कर सकते हैं जब आप सहज हों।':' We can talk about it when you feel ready.';
  const framed=original.startsWith(opening)?original:opening+original+closing;
  const suggestion=framed.length<=800?framed:original;
  return NextResponse.json({suggestion,mode:'demo',note:'Your original words are preserved inside an optional gentle opening and closing. Review and edit before saving.'});
}
