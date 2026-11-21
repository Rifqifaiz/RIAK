import Papa from 'papaparse';
import { Region, Facility, LeadTime, BorObs, Event2021, PathogenProfile, EntryPoint, DailyCase } from '../types';

export interface LoadedAppData {
  regions: Region[];
  facilities: Facility[];
  leadTimes: LeadTime[];
  borObs: BorObs[];
  cases2021: DailyCase[];
  events2021: Event2021[];
  pathogenProfiles: PathogenProfile[];
  entryPoints: EntryPoint[];
}

export async function fetchCsv<T>(url: string): Promise<T[]> {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const text = await res.text();
    return new Promise((resolve) => {
      Papa.parse<T>(text, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
        error: () => resolve([]),
      });
    });
  } catch {
    return [];
  }
}

export async function fetchJson<T>(url: string): Promise<T[]> {
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function loadAllAppData(): Promise<LoadedAppData> {
  const [
    regions,
    facilities,
    leadTimes,
    borObs,
    cases2021Raw,
    events2021,
    pathogenProfiles,
    entryPoints,
  ] = await Promise.all([
    fetchCsv<Region>('./data/regions.csv'),
    fetchCsv<Facility>('./data/facilities.csv'),
    fetchCsv<Record<string, any>>('./data/lead_times.csv').then(normalizeLeadTimes),
    fetchCsv<BorObs>('./data/bor_obs_2021_dki.csv'),
    fetchCsv<{ tanggal: string; kasus: number }>('./data/cases_2021_dki.csv'),
    fetchJson<Event2021>('./data/events_2021.json'),
    fetchJson<PathogenProfile>('./data/pathogen_profiles.json'),
    fetchCsv<EntryPoint>('./data/entry_points.csv'),
  ]);

  const cases2021: DailyCase[] = cases2021Raw.map(c => ({
    tanggal: String(c.tanggal),
    kasus: Number(c.kasus) || 0,
  }));

  return {
    regions,
    facilities,
    leadTimes,
    borObs,
    cases2021,
    events2021,
    pathogenProfiles,
    entryPoints,
  };
}


/**
 * lead_times.csv memakai kolom lt_min_hari / lt_max_hari / label, sedangkan mesin BWB
 * membaca lead_time_min_hari / lead_time_max_hari / status_data. Samakan di sini.
 */
export function normalizeLeadTimes(raw: Array<Record<string, any>>): LeadTime[] {
  return raw.map((r) => ({
    persiapan: String(r.persiapan ?? ''),
    lead_time_min_hari: Number(r.lead_time_min_hari ?? r.lt_min_hari),
    lead_time_max_hari: Number(r.lead_time_max_hari ?? r.lt_max_hari),
    dasar: String(r.dasar ?? ''),
    status_data: (r.status_data ?? r.label ?? 'ASUMSI') as LeadTime['status_data'],
  }));
}
