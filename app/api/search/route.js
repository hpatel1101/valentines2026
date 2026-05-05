import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getClient() {
  if (!url || !serviceRoleKey) throw new Error('Missing Supabase environment variables.');
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function normalize(value) {
  return (value ?? '').trim().toLowerCase();
}

function tokenize(value) {
  return normalize(value).split(/\s+/).filter(Boolean);
}

function matchToken(queryToken, targetToken) {
  if (!queryToken || !targetToken) return 0;
  if (queryToken === targetToken) return 100;

  const ratio = queryToken.length / targetToken.length;

  if (queryToken.length >= 2 && targetToken.startsWith(queryToken) && ratio >= 0.5) {
    return 75;
  }

  if (queryToken.length >= 3 && targetToken.includes(queryToken) && ratio >= 0.5) {
    return 60;
  }

  return 0;
}

function matchField(queryTokens, fieldValue) {
  const targetTokens = tokenize(fieldValue);
  if (!queryTokens.length || !targetTokens.length) return 0;

  const scores = queryTokens.map((queryToken) =>
    Math.max(...targetTokens.map((targetToken) => matchToken(queryToken, targetToken)), 0)
  );

  if (scores.some((score) => score === 0)) return 0;

  const exactMatches = scores.filter((score) => score === 100).length;
  return Math.min(...scores) + exactMatches;
}

function buildScore(row, query) {
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return 0;

  if (queryTokens.length === 1 && queryTokens[0].length < 2) return 0;

  const fullScore = matchField(queryTokens, row.fullName);
  const firstScore = matchField(queryTokens, row.firstName);
  const lastScore = matchField(queryTokens, row.lastName);
  const partyScore = matchField(queryTokens, row.partyName);

  if (fullScore === 101 || fullScore === 100) return 100;
  if (firstScore === 100 || lastScore === 100) return 92;
  if (partyScore === 100) return 88;
  if (fullScore > 0) return Math.min(85, fullScore);
  if (firstScore > 0 || lastScore > 0) return Math.min(80, Math.max(firstScore, lastScore));
  if (partyScore > 0) return Math.min(72, partyScore);
  return 0;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = normalize(searchParams.get('q'));
    if (!query) return NextResponse.json({ error: 'Missing search query.' }, { status: 400 });

    const supabase = getClient();
    const { data, error } = await supabase.from('guests').select('*').order('id', { ascending: true });
    if (error) throw error;

    const rows = (data ?? []).map((row) => {
      const firstName = row['First Name'] ?? '';
      const lastName = row['Last Name'] ?? '';
      const partyName = row['Party (Optional)'] ?? '';
      const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
      return {
        id: row.id,
        fullName,
        firstName,
        lastName,
        partyName: partyName || fullName,
        attending: row.attending ?? '',
      };
    });

    const matchedRows = rows
      .map((row) => ({ row, score: buildScore(row, query) }))
      .filter((item) => item.score > 0);

    if (!matchedRows.length) return NextResponse.json({ parties: [] });

    const partyMap = new Map();

    for (const item of matchedRows) {
      const key = item.row.partyName.toLowerCase();
      if (!partyMap.has(key)) {
        partyMap.set(key, {
          partyName: item.row.partyName,
          matchedGuests: [],
          members: rows
            .filter((member) => member.partyName.toLowerCase() === key)
            .map((member) => ({
              id: member.id,
              fullName: member.fullName,
              attending: member.attending,
            })),
          score: item.score,
        });
      }

      const entry = partyMap.get(key);
      entry.score = Math.max(entry.score, item.score);
      if (!entry.matchedGuests.includes(item.row.fullName)) {
        entry.matchedGuests.push(item.row.fullName);
      }
    }

    const parties = Array.from(partyMap.values())
      .sort((a, b) => b.score - a.score || a.partyName.localeCompare(b.partyName))
      .slice(0, 7)
      .map(({ score, ...party }) => party);

    return NextResponse.json({ parties });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unable to search guest list.' }, { status: 500 });
  }
}
