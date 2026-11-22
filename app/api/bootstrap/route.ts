import { NextRequest, NextResponse } from 'next/server';
import { coordinatorView, createCircle, donorBloodView, donorEnquiries, ensureDemoData, getCircle, getHospital, resetDemoData, safeDonorView } from '@/lib/store';

export const runtime = 'nodejs';

function baseResponse(body: unknown) { return NextResponse.json(body, { headers: { 'Cache-Control': 'private, no-store' } }); }

export async function GET(req: NextRequest) {
  ensureDemoData();
  const donorId = req.cookies.get('suno_demo')?.value;
  const activeRole = req.cookies.get('suno_active_role')?.value;
  const coordinator = activeRole === 'coordinator' && req.cookies.get('suno_coordinator')?.value === 'demo-coordinator';
  return baseResponse({ mode: 'demo', role: coordinator ? 'coordinator' : donorId ? 'donor' : null, hospital: getHospital(), donor: donorId && getCircle(donorId) ? { circle: safeDonorView(getCircle(donorId)!), blood: donorBloodView(donorId), enquiries: donorEnquiries(donorId) } : null, coordinatorData: coordinator ? coordinatorView() : null });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* use defaults */ }
  const role = body.role === 'coordinator' ? 'coordinator' : 'donor';
  if (body.reset === true) resetDemoData(); else ensureDemoData();
  const response = role === 'coordinator' ? baseResponse({ mode: 'demo', role, hospital: getHospital(), coordinatorData: coordinatorView() }) : (() => {
    const existingId = req.cookies.get('suno_demo')?.value;
    const existing = existingId ? getCircle(existingId) : undefined;
    const circle = existing ?? createCircle(body.seeded === true);
    const res = baseResponse({ mode: 'demo', role, hospital: getHospital(), donor: { circle: safeDonorView(circle), blood: donorBloodView(circle.id), enquiries: donorEnquiries(circle.id) } });
    res.cookies.set('suno_demo', circle.id, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 86400 });
    return res;
  })();
  response.cookies.set('suno_active_role', role, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 86400 });
  if (role === 'coordinator') response.cookies.set('suno_coordinator', 'demo-coordinator', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 86400 });
  return response;
}
