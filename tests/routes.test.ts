import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as donorGet } from '../app/api/circle/route';
import { GET as inviteGet } from '../app/api/invite/[token]/route';
import { addInvite, createCircle, deleteCircle } from '../lib/store';

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
});
