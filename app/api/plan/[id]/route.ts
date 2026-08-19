import { NextRequest, NextResponse } from 'next/server';
import { getPlan, patchPlan, assertReasonableSize } from '@/lib/store';

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const plan = await getPlan(params.id);
    if (!plan) return json({ error: 'Convite não encontrado ou expirado' }, 404);
    return json({ plan });
  } catch (err) {
    console.error('[api/plan/[id]] get failed:', err);
    return json({ error: 'Falha ao carregar o convite' }, 500);
  }
}

// Guest answers land here (partial `guest` patch). Also accepts a `host`
// patch so a Host revisiting their results link can update their own side.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'JSON inválido' }, 400);
  }

  const patch: { host?: any; guest?: any } = {};
  if (body?.guest) patch.guest = body.guest;
  if (body?.host) patch.host = body.host;
  if (!patch.guest && !patch.host) {
    return json({ error: 'Nada para atualizar' }, 400);
  }

  try {
    assertReasonableSize(patch);
  } catch {
    return json({ error: 'Dados muito grandes' }, 413);
  }

  try {
    const updated = await patchPlan(params.id, patch);
    if (!updated) return json({ error: 'Convite não encontrado ou expirado' }, 404);
    return json({ plan: updated });
  } catch (err) {
    console.error('[api/plan/[id]] patch failed:', err);
    return json({ error: 'Falha ao salvar respostas' }, 500);
  }
}
