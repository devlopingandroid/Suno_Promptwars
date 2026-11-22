import { describe, expect, it } from 'vitest';
import { answerConcern, sources } from '../lib/sources';
import { addInvite, createCircle, deleteCircle, deleteOwnResponse, findInvite, getCircle, getInviteView, markDiscussed, safeDonorView, submitResponse } from '../lib/store';

describe('source-grounded answers',()=>{
  it('answers a Hindi body concern with the reviewed NOTTO excerpt',()=>{
    const result=answerConcern('क्या अंगदान के बाद शरीर का चेहरा बदल जाएगा?');
    expect(result.status).toBe('supported');
    expect(result.sourceId).toBe('notto-body');
    expect(result.supportingExcerpt).toBe(sources[0].excerpt);
    expect(result.language).toBe('hi');
  });
  it('leaves hospital trust and personal faith questions unanswered',()=>{
    for(const question of ['Will the hospital treat me differently?','क्या मेरा धर्म इसकी अनुमति देता है?']){
      const result=answerConcern(question);
      expect(result.status).toBe('unsupported');
      expect(result.sourceId).toBeNull();
      expect(result.answer).toBeNull();
    }
  });
  it('does not use a nearby topic as evidence for an unrelated claim',()=>{
    for(const question of ['Can my body be donated if I have diabetes?','Will my family pay for travel?','Does my family have to give legal consent?']){
      expect(answerConcern(question).status).toBe('unsupported');
    }
  });
});

describe('private invitation lifecycle',()=>{
  it('keeps each family view limited to its shared wish and own response',()=>{
    const circle=createCircle();circle.wish='Synthetic wish';
    const mother=addInvite(circle.id,'Mother')!;
    const brother=addInvite(circle.id,'Brother')!;
    const motherView=getInviteView(mother.token)!;
    expect(motherView).toEqual(expect.objectContaining({wish:'Synthetic wish',name:'Mother',status:'viewed'}));
    expect(JSON.stringify(motherView)).not.toContain(brother.token);
    const result=answerConcern('Will the body look different?');
    submitResponse(mother.token,'question','Will the body look different?',result);
    expect(findInvite(mother.token)?.invite.status).toBe('question open');
    markDiscussed(mother.token);
    expect(findInvite(mother.token)?.invite.status).toBe('conversation completed');
    deleteOwnResponse(mother.token);
    expect(findInvite(mother.token)?.invite.status).toBe('viewed');
    expect(findInvite(mother.token)?.invite.question).toBeUndefined();
    submitResponse(mother.token,'question','Will the hospital treat me differently?',answerConcern('Will the hospital treat me differently?'));
    expect(markDiscussed(mother.token)).toBeNull();
    expect(findInvite(mother.token)?.invite.status).toBe('question open');
    deleteCircle(circle.id);
    expect(findInvite(mother.token)).toBeNull();
    expect(getCircle(circle.id)).toBeUndefined();
  });
  it('expires tokens and limits circle size',()=>{
    const c=createCircle();
    const first=addInvite(c.id,'A')!;addInvite(c.id,'B');addInvite(c.id,'C');
    expect(addInvite(c.id,'D')).toBeNull();
    expect(findInvite(first.token,first.expiresAt+1)).toBeNull();
    expect(safeDonorView(c).invites).toHaveLength(3);
    deleteCircle(c.id);
  });
});
