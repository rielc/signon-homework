import { http, HttpResponse } from 'msw';
import {
  trains,
  rbcs,
  relations,
  persistTrains,
  persistRBCs,
  persistRelations,
  resetAll,
} from './data';
import type { Train, RBC } from '../types';

const delay = () =>
  new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 600));

const createId = () => ({id: crypto.randomUUID() });

export const handlers = [
  // get existing Trains
  http.get('/api/trains', async () => {
    await delay();
    return HttpResponse.json(trains);
  }),

  // create new Train
  http.post('/api/trains', async ({ request }) => {
    await delay();
    const body = (await request.json()) as Omit<Train, 'id'>;
    const train: Train = { ...createId(), ...body };
    trains.push(train);
    persistTrains();
    return HttpResponse.json(train, { status: 201 });
  }),

  // update existing Train
  http.put('/api/trains/:id', async ({ params, request }) => {
    await delay();
    const { id } = params;
    const body = (await request.json()) as Partial<Train>;
    const idx = trains.findIndex((t) => t.id === id);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    trains[idx] = { ...trains[idx], ...body };
    persistTrains();
    return HttpResponse.json(trains[idx]);
  }),

  // delete existing Train
  http.delete('/api/trains/:id', async ({ params }) => {
    await delay();
    const { id } = params;
    const idx = trains.findIndex((t) => t.id === id);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    trains.splice(idx, 1);
    for (let i = relations.length - 1; i >= 0; i--) {
      if (relations[i].trainId === id) relations.splice(i, 1);
    }
    persistTrains();
    persistRelations();
    return new HttpResponse(null, { status: 200 });
  }),

  // get existing RBCs
  http.get('/api/rbcs', async () => {
    await delay();
    return HttpResponse.json(rbcs);
  }),

  // create new RBC
  http.post('/api/rbcs', async ({ request }) => {
    await delay();
    const body = (await request.json()) as Omit<RBC, 'id'>;
    const rbc: RBC = { ...createId(), ...body };
    rbcs.push(rbc);
    persistRBCs();
    return HttpResponse.json(rbc, { status: 201 });
  }),

  // update existing RBC
  http.put('/api/rbcs/:id', async ({ params, request }) => {
    await delay();
    const { id } = params;
    const body = (await request.json()) as Partial<RBC>;
    const idx = rbcs.findIndex((r) => r.id === id);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    rbcs[idx] = { ...rbcs[idx], ...body };
    persistRBCs();
    return HttpResponse.json(rbcs[idx]);
  }),

  // delete existing RBC
  http.delete('/api/rbcs/:id', async ({ params }) => {
    await delay();
    const { id } = params;
    const idx = rbcs.findIndex((r) => r.id === id);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    rbcs.splice(idx, 1);
    for (let i = relations.length - 1; i >= 0; i--) {
      if (relations[i].rbcId === id) relations.splice(i, 1);
    }
    persistRBCs();
    persistRelations();
    return new HttpResponse(null, { status: 200 });
  }),

  // Get existing relations with optional filtering
  http.get('/api/relations', async ({ request }) => {
    await delay();
    const url = new URL(request.url);
    const trainId = url.searchParams.get('trainId');
    const rbcId = url.searchParams.get('rbcId');
    let result = relations;
    if (trainId) result = result.filter((r) => r.trainId === trainId);
    if (rbcId) result = result.filter((r) => r.rbcId === rbcId);
    return HttpResponse.json(result);
  }),

  // Create new relation
  http.post('/api/relations', async ({ request }) => {
    await delay();
    const body = (await request.json()) as { trainId: string; rbcId: string; key: string };
    const relation = { trainId: body.trainId, rbcId: body.rbcId, key: body.key };
    relations.push(relation);
    persistRelations();
    return HttpResponse.json(relation, { status: 201 });
  }),

  // Delete existing relation
  http.delete('/api/relations/:trainId/:rbcId', async ({ params }) => {
    await delay();
    const { trainId, rbcId } = params;
    const idx = relations.findIndex(
      (r) => r.trainId === trainId && r.rbcId === rbcId,
    );
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    relations.splice(idx, 1);
    persistRelations();
    return new HttpResponse(null, { status: 200 });
  }),

  // Update relation key
  http.put('/api/relations/:trainId/:rbcId/key', async ({ params, request }) => {
    await delay();
    const { trainId, rbcId } = params;
    const body = (await request.json()) as { key: string };
    const rel = relations.find(
      (r) => r.trainId === trainId && r.rbcId === rbcId,
    );
    if (!rel) return new HttpResponse(null, { status: 404 });
    rel.key = body.key;
    persistRelations();
    return HttpResponse.json(rel);
  }),

  // Reset to seed data
  http.get('/api/reset', async () => {
    await delay();
    resetAll();
    return HttpResponse.json({ ok: true });
  }),
];
