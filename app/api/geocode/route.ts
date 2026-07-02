import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import { NextRequest, NextResponse } from 'next/server';

const execFileAsync = promisify(execFile);

function normalizeAbrResult(item: any, fallbackQuery: string) {
  const lat = item?.lat ?? item?.latitude ?? item?.geometry?.coordinates?.[1] ?? item?.y ?? item?.location?.lat;
  const lng = item?.lng ?? item?.longitude ?? item?.geometry?.coordinates?.[0] ?? item?.x ?? item?.location?.lng;

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return null;
  }

  return {
    latitude: Number(lat),
    longitude: Number(lng),
    query: fallbackQuery,
  };
}

function normalizeGsiApiResults(data: any[], fallbackQuery: string) {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((item: any) => {
      if (item?.geometry?.coordinates && Array.isArray(item.geometry.coordinates)) {
        const [lng, lat] = item.geometry.coordinates;
        return {
          latitude: lat,
          longitude: lng,
          query: fallbackQuery,
        };
      }

      return normalizeAbrResult(item, fallbackQuery);
    })
    .filter(Boolean);
}

async function geocodeWithAbr(query: string) {
  const cliPath = path.join(process.cwd(), 'node_modules', '.bin', process.platform === 'win32' ? 'abrg.cmd' : 'abrg');
  const { stdout } = await execFileAsync(cliPath, [query, '--format', 'json'], {
    timeout: 20000,
    windowsHide: true,
  });

  const trimmed = stdout.trim();
  if (!trimmed) {
    return [];
  }

  const parsed = JSON.parse(trimmed);
  const list = Array.isArray(parsed) ? parsed : parsed?.results ?? parsed?.items ?? [];

  return list
    .map((item: any) => normalizeAbrResult(item, query))
    .filter(Boolean);
}

async function geocodeWithGsi(query: string) {
  const response = await fetch(`https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error(`GSI API error: ${response.status}`);
  }
  const data = await response.json();
  return normalizeGsiApiResults(data, query);
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query')?.trim();
  if (!query) {
    return NextResponse.json({ results: [] }, { status: 400 });
  }

  try {
    const abrResults = await geocodeWithAbr(query);
    if (abrResults.length > 0) {
      return NextResponse.json({ results: abrResults });
    }
  } catch (error) {
    console.warn('abr-geocoder failed, falling back:', error);
  }

  try {
    const gsiResults = await geocodeWithGsi(query);
    return NextResponse.json({ results: gsiResults });
  } catch (error) {
    console.warn('GSI fallback failed:', error);
    return NextResponse.json({ results: [] });
  }
}
