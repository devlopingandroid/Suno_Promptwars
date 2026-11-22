import { resolveConcern } from '../lib/ai';

// Uses synthetic questions only. Keys and response text are never printed.
for (const question of ['क्या अंगदान के बाद शरीर का चेहरा बदल जाएगा?', 'Will the hospital treat me differently?']) {
  const started = Date.now();
  const response = await resolveConcern(question);
  console.log(JSON.stringify({ mode:response.mode, status:response.result.status, sourceId:response.result.sourceId, elapsedMs:Date.now()-started }));
}
