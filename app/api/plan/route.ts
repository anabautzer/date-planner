import { NextRequest, NextResponse } from 'next/server';
import { createPlan, assertReasonableSize } from '@/lib/store';
import { emptyPerson } from '@/lib/types';
import type { PlanData } from '@/lib/types';
import { IS_DEMO } from '@/lib/demo';

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

// Creates a new plan record (the Host's side) and returns its id.
// The Host name is required server-side too — never trust client-only validation.
export async function POST(req: NextRequest) {
  // Demo invites live in the browser (lib/demoStore.ts) — never touch Redis.
  if (IS_DEMO) return json({ error: 'Indisponível no modo demonstração' }, 403);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'JSON inválido' }, 400);
  }

  const hostName = typeof body?.hostName === 'string' ? body.hostName.trim() : '';
  if (!hostName) {
    return json({ error: 'Nome do anfitrião é obrigatório' }, 400);
  }

  const plan: PlanData = {
    version: 1,
    createdAt: new Date().toISOString(),
    hostName,
    guestName: typeof body?.guestName === 'string' ? body.guestName.trim() : '',
    host: body?.host ?? emptyPerson(),
    guest: null,
  };

  try {
    assertReasonableSize(plan);
  } catch {
    return json({ error: 'Convite muito grande' }, 413);
  }

  try {
    const id = await createPlan(plan);
    return json({ id });
  } catch (err) {
    console.error('[api/plan] create failed:', err);
    return json({ error: 'Falha ao salvar o convite' }, 500);
  }
}
