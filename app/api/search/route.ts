import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

function normalize(value: string | null) {
  return (value ?? '').trim().toLowerCase();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = normalize(searchParams.get('q'));

    if (!query) {
      return NextResponse.json({ error: 'Missing search query.' }, { status: 400 });
    }

    const supabase = getClient();
    const { data, error } = await supabase
      .from('guests')
      .select('id, "Party (Optional)", "First Name", "Last Name", attending')
      .order('Party (Optional)', { ascending: true, nullsFirst: false })
      .order('Last Name', { ascending: true, nullsFirst: false })
      .order('First Name', { ascending: true, nullsFirst: false });

    if (error) {
      throw error;
    }

    const rows = (data ?? []).map((row) => {
      const firstName = ((row as Record<string, unknown>)['First Name'] as string | null) ?? '';
      const lastName = ((row as Record<string, unknown>)['Last Name'] as string | null) ?? '';
      const partyName = ((row as Record<string, unknown>)['Party (Optional)'] as string | null) ?? '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

      return {
        id: row.id as number,
        firstName,
        lastName,
        fullName,
        partyName: partyName || fullName,
        attending: (row.attending as string | null) ?? '',
      };
    });

    const matched = rows.find((row) => {
      const haystack = [row.fullName, row.firstName, row.lastName, row.partyName]
        .join(' | ')
        .toLowerCase();
      return haystack.includes(query);
    });

    if (!matched) {
      return NextResponse.json({ party: null });
    }

    const partyMembers = rows.filter((row) => row.partyName.toLowerCase() === matched.partyName.toLowerCase());

    return NextResponse.json({
      party: {
        partyName: matched.partyName,
        members: partyMembers.map((member) => ({
          id: member.id,
          fullName: member.fullName,
          attending: member.attending,
        })),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to search guest list.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
