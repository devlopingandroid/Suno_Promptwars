import { randomBytes } from 'node:crypto';
import { answerConcern, type ConcernResult } from './sources';

export type InviteStatus = 'invited'|'viewed'|'wish understood'|'question open'|'conversation completed'|'declined to discuss';
export type Invite = { token:string; name:string; expiresAt:number; viewedAt?:number; status:InviteStatus; question?:string; result?:ConcernResult; response?:'understand'|'question'|'not-ready' };
export type Circle = { id:string; wish:string; invites:Invite[]; createdAt:number };
type Store = Map<string,Circle>;
declare global { var sunoDemoStore: Store | undefined; }
const store: Store = globalThis.sunoDemoStore ?? (globalThis.sunoDemoStore=new Map<string,Circle>());
const token=()=>randomBytes(24).toString('base64url');
export const DEMO_TTL_MS=24*60*60*1000;
export function createCircle(seeded=false) {
  const id=token();
  const circle:Circle={id,wish:seeded?'I am considering organ and tissue donation after death. I would like my family to understand my wish and feel free to ask questions.':'',invites:[],createdAt:Date.now()};
  store.set(id,circle);
  if(seeded){addInvite(id,'Mother');addInvite(id,'Brother');}
  return circle;
}
export function getCircle(id:string|undefined){return id?store.get(id):undefined;}
export function saveWish(id:string,wish:string){const c=getCircle(id);if(!c) return null;c.wish=wish.slice(0,800);return c;}
export function addInvite(id:string,name:string){const c=getCircle(id);if(!c||c.invites.length>=3||!name.trim())return null;const i:Invite={token:token(),name:name.trim().slice(0,40),expiresAt:Date.now()+DEMO_TTL_MS,status:'invited'};c.invites.push(i);return i;}
export function findInvite(tokenValue:string,now=Date.now()){for(const c of store.values()){const invite=c.invites.find(i=>i.token===tokenValue);if(invite)return invite.expiresAt>now?{circle:c,invite}:null;}return null;}
export function getInviteView(tokenValue:string){const found=findInvite(tokenValue);if(!found)return null;found.invite.viewedAt=Date.now();if(found.invite.status==='invited')found.invite.status='viewed';return {wish:found.circle.wish,name:found.invite.name,status:found.invite.status,question:found.invite.question,result:found.invite.result,expiresAt:found.invite.expiresAt};}
export function submitResponse(tokenValue:string,kind:'understand'|'question'|'not-ready',question?:string,result?:ConcernResult){const found=findInvite(tokenValue);if(!found)return null;const i=found.invite;
  if(kind==='question'&&(!question?.trim()||question.length>600||!result))return null;
  i.response=kind;i.question=kind==='question'?question!.trim():undefined;i.result=kind==='question'?result:undefined;
  i.status=kind==='not-ready'?'declined to discuss':kind==='understand'?'wish understood':'question open';
  return getInviteView(tokenValue);
}
export function deleteOwnResponse(tokenValue:string){const found=findInvite(tokenValue);if(!found)return false;const i=found.invite;i.response=undefined;i.question=undefined;i.result=undefined;i.status='viewed';return true;}
export function markDiscussed(tokenValue:string){const found=findInvite(tokenValue);if(!found||found.invite.response!=='question'||found.invite.result?.status!=='supported')return null;found.invite.status='conversation completed';return getInviteView(tokenValue);}
export function deleteCircle(id:string){return store.delete(id);}
export function safeDonorView(c:Circle){return {id:c.id,wish:c.wish,invites:c.invites.map(i=>({name:i.name,token:i.token,expiresAt:i.expiresAt,status:i.status,question:i.question,result:i.result}))};}
export function safeFamilyView(tokenValue:string){return getInviteView(tokenValue);}
export function answerForInvite(tokenValue:string,question:string){if(!findInvite(tokenValue)||question.length>600||!question.trim())return null;return answerConcern(question);}
