import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type Payload = {
  updates?: Array<{
    id: number;
    attending: string;
  }>;
};

function getClient() {
  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables.');
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Payload;
    const updates = payload.updates ?? [];

    if (!updates.length) {
      return NextResponse.json({ error: 'No RSVP updates provided.' }, { status: 400 });
    }

    const normalized = updates.map((item) => ({
      id: item.id,
      attending: item.attending === 'Attending' ? 'Attending' : 'Not attending',
    }));

    const supabase = getClient();

    for (const update of normalized) {
      const { error } = await supabase
        .from('guests')
        .update({ attending: update.attending })
        .eq('id', update.id);

      if (error) {
        throw error;
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save RSVP.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
