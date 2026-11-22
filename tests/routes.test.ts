import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as donorGet } from '../app/api/circle/route';
import { GET as inviteGet } from '../app/api/invite/[token]/route';
import { GET as portalGet } from '../app/api/portal/route';
import { addInvite, createCircle, deleteCircle, resetDemoData } from '../lib/store';

describe('privacy-sensitive routes',()=>{
  it('rejects donor data without the donor cookie',async()=>{
    const response=await donorGet(new NextRequest('http://localhost:3000/api/circle'));
    expect(response.status).toBe(401);
  });
  it('rejects an invalid invitation and hides sibling tokens',async()=>{
    const c=createCircle();c.wish='Synthetic wish';
    const mother=addInvite(c.id,'Mother')!,brother=addInvite(c.id,'Brother')!;
    const missing=await inviteGet(new NextRequest('http://localhost:3000/api/invite/invalid'),{params:Promise.resolve({token:'invalid'})});
    expect(missing.status).toBe(404);
    const response=await inviteGet(new NextRequest(`http://localhost:3000/api/invite/${mother.token}`),{params:Promise.resolve({token:mother.token})});
    expect(response.status).toBe(200);
    const body=JSON.stringify(await response.json());
    expect(body).toContain('Synthetic wish');
    expect(body).not.toContain(brother.token);
    expect(body).not.toContain(brother.name);
    deleteCircle(c.id);
  });
  it('keeps coordinator-only records behind the coordinator role cookie',async()=>{
    resetDemoData();
    const coordinatorResponse=await portalGet(new NextRequest('http://localhost:3000/api/portal',{headers:{cookie:'suno_active_role=coordinator; suno_coordinator=demo-coordinator'}}));
    expect(coordinatorResponse.status).toBe(200);
    expect(JSON.stringify(await coordinatorResponse.json())).toContain('Internal notes never appear');
    const donorCircle=createCircle(true);
    const donorResponse=await portalGet(new NextRequest('http://localhost:3000/api/portal',{headers:{cookie:`suno_active_role=donor; suno_demo=${donorCircle.id}`}}));
    expect(donorResponse.status).toBe(200);
    expect(JSON.stringify(await donorResponse.json())).not.toContain('Internal notes never appear');
    deleteCircle(donorCircle.id);
  });
});
