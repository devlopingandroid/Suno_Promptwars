import { NextRequest, NextResponse } from 'next/server';
import { addEnquiry, closeBloodRequest, coordinatorView, createBloodRequest, donorBloodView, donorEnquiries, expressAvailability, getCircle, proposeAppointment, publishBloodRequest, safeDonorView, updateAppointment, updateEnquiry, withdrawAvailability } from '@/lib/store';

export const runtime = 'nodejs';
const error = (message: string, status = 400) => NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'private, no-store' } });
const ok = (body: unknown) => NextResponse.json(body, { headers: { 'Cache-Control': 'private, no-store' } });
function coordinator(req: NextRequest) { return req.cookies.get('suno_active_role')?.value === 'coordinator' && req.cookies.get('suno_coordinator')?.value === 'demo-coordinator'; }
function donor(req: NextRequest): string | null { const id = req.cookies.get('suno_demo')?.value; return req.cookies.get('suno_active_role')?.value === 'donor' && typeof id === 'string' && !!getCircle(id) ? id : null; }

export async function GET(req: NextRequest) {
  if (coordinator(req)) return ok({ role: 'coordinator', coordinatorData: coordinatorView() });
  const donorId = donor(req); if (donorId) return ok({ role: 'donor', donor: { circle: safeDonorView(getCircle(donorId)!), blood: donorBloodView(donorId), enquiries: donorEnquiries(donorId) } });
  return error('Choose a demo role first.', 401);
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>; try { body = await req.json(); } catch { return error('Invalid request.'); }
  if (coordinator(req)) {
    const action = body.action;
    if (action === 'create-request' && typeof body.title === 'string' && typeof body.location === 'string' && typeof body.bloodGroup === 'string' && typeof body.appointmentWindow === 'string' && typeof body.instructions === 'string') return ok({ coordinatorData: coordinatorView(), created: createBloodRequest({ title: body.title, location: body.location, bloodGroup: body.bloodGroup, appointmentWindow: body.appointmentWindow, instructions: body.instructions }) });
    if (typeof body.requestId === 'string' && action === 'publish') return publishBloodRequest(body.requestId) ? ok({ coordinatorData: coordinatorView() }) : error('Only draft requests can be published.');
    if (typeof body.requestId === 'string' && action === 'close') return closeBloodRequest(body.requestId) ? ok({ coordinatorData: coordinatorView() }) : error('Only published requests can be closed.');
    if (typeof body.requestId === 'string' && typeof body.responseId === 'string' && action === 'propose') return proposeAppointment(body.requestId, body.responseId) ? ok({ coordinatorData: coordinatorView() }) : error('This volunteer response is no longer available.');
    if (typeof body.appointmentId === 'string' && (action === 'cancel' || action === 'complete')) return updateAppointment(body.appointmentId, null, action === 'complete' ? 'completed' : 'cancelled', typeof body.reason === 'string' ? body.reason : undefined) ? ok({ coordinatorData: coordinatorView() }) : error('That appointment cannot make this transition.');
    if (typeof body.enquiryId === 'string' && (action === 'start-follow-up' || action === 'resolve')) return updateEnquiry(body.enquiryId, action === 'resolve' ? 'resolved' : 'in progress', typeof body.answer === 'string' ? body.answer : undefined) ? ok({ coordinatorData: coordinatorView() }) : error('Enquiry not found.');
    return error('Unknown coordinator action.');
  }
  const donorId = donor(req); if (!donorId) return error('Choose the donor demo first.', 401);
  const action = body.action;
  if (action === 'volunteer' && typeof body.requestId === 'string') { const result = expressAvailability(body.requestId, donorId); return 'error' in result ? error(result.error ?? 'Unable to record availability.') : ok({ donor: { circle: safeDonorView(getCircle(donorId)!), blood: donorBloodView(donorId), enquiries: donorEnquiries(donorId) } }); }
  if (action === 'withdraw' && typeof body.requestId === 'string') return withdrawAvailability(body.requestId, donorId) ? ok({ donor: { circle: safeDonorView(getCircle(donorId)!), blood: donorBloodView(donorId), enquiries: donorEnquiries(donorId) } }) : error('Only an available response can be withdrawn.');
  if (typeof body.appointmentId === 'string' && (action === 'confirm' || action === 'decline' || action === 'cancel')) { const updated = updateAppointment(body.appointmentId, donorId, action === 'confirm' ? 'confirmed' : action === 'decline' ? 'declined' : 'cancelled'); return updated ? ok({ donor: { circle: safeDonorView(getCircle(donorId)!), blood: donorBloodView(donorId), enquiries: donorEnquiries(donorId) } }) : error('That appointment cannot make this transition.'); }
  if (action === 'request-follow-up' && typeof body.question === 'string') return addEnquiry(donorId, body.question, body.language === 'hi' ? 'hi' : 'en') ? ok({ donor: { circle: safeDonorView(getCircle(donorId)!), blood: donorBloodView(donorId), enquiries: donorEnquiries(donorId) } }) : error('Write a question before requesting follow-up.');
  return error('Unknown donor action.');
}
