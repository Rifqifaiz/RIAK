export interface DailyCaseRow {
  tanggal: string; // YYYY-MM-DD
  kasus: number;
}

export interface CutoffResult {
  cutoff: string;
  waktuGandakan: number; // doubling time in days
  g: number;
  icuPenuh: {
    lambat: string;
    tengah: string;
    cepat: string;
  };
  isolasiPenuh: {
    lambat: string;
    tengah: string;
    cepat: string;
  };
}

export interface HistoricalObsPoint {
  tanggal: string;
  isolasi: number;
  icu: number;
}

export const OBS_2021: Record<string, HistoricalObsPoint> = {
  '2021-05-31': { tanggal: '2021-05-31', isolasi: 2176, icu: 362 },
  '2021-06-14': { tanggal: '2021-06-14', isolasi: 5752, icu: 773 },
  '2021-06-23': { tanggal: '2021-06-23', isolasi: 8874, icu: 1048 },
  '2021-07-18': { tanggal: '2021-07-18', isolasi: 10016, icu: 1447 },
};

export const CAP_31_MEI = {
  isolasi: 6621,
  icu: 1014,
};

function parseDate(dStr: string): Date {
  const [y, m, d] = dStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(dStr: string, days: number): string {
  const d = parseDate(dStr);
  d.setUTCDate(d.getUTCDate() + days);
  return formatDate(d);
}

export function runBacktest(cases: DailyCaseRow[]): {
  kI: number;
  kC: number;
  load31Mei: number;
  results: Record<string, CutoffResult>;
} {
  // Sort cases chronologically
  const sorted = [...cases].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  const caseMap = new Map<string, number>();
  for (const c of sorted) {
    caseMap.set(c.tanggal, c.kasus);
  }

  // Helper for rolling mean of 7 days up to date d (inclusive: d-6..d)
  function getK7(dStr: string): number {
    let sum = 0;
    for (let i = 0; i < 7; i++) {
      const cur = addDays(dStr, -i);
      sum += caseMap.get(cur) ?? 0;
    }
    return sum / 7;
  }

  // Helper for rolling 14 sum up to date d (inclusive: d-13..d)
  function getL14(dStr: string, customMap?: Map<string, number>): number {
    const map = customMap || caseMap;
    let sum = 0;
    for (let i = 0; i < 14; i++) {
      const cur = addDays(dStr, -i);
      sum += map.get(cur) ?? 0;
    }
    return sum;
  }

  const load31Mei = getL14('2021-05-31');
  const kI = OBS_2021['2021-05-31'].isolasi / load31Mei;
  const kC = OBS_2021['2021-05-31'].icu / load31Mei;

  const cutoffs = ['2021-06-07', '2021-06-10', '2021-06-14', '2021-06-17'];
  const results: Record<string, CutoffResult> = {};

  for (const cutoff of cutoffs) {
    const k7Cutoff = getK7(cutoff);
    const k7Minus7 = getK7(addDays(cutoff, -7));
    const g = Math.pow(k7Cutoff / k7Minus7, 1 / 7);
    const waktuGandakan = Math.log(2) / Math.log(g);

    // Multipliers: lambat (g^0.85), tengah (g), cepat (g^1.15)
    // Note: since g > 1, g^0.85 is slower growth (takes longer to fill), g^1.15 is faster growth
    const speeds = [
      { name: 'lambat', rate: Math.pow(g, 0.85) },
      { name: 'tengah', rate: g },
      { name: 'cepat', rate: Math.pow(g, 1.15) },
    ];

    const icuMap: Record<string, string> = {};
    const isoMap: Record<string, string> = {};

    for (const { name, rate } of speeds) {
      // Build future series for 60 days
      const simMap = new Map<string, number>(caseMap);
      for (let h = 1; h <= 60; h++) {
        const futDate = addDays(cutoff, h);
        const futCase = k7Cutoff * Math.pow(rate, h);
        simMap.set(futDate, futCase);
      }

      let dateIcu: string | null = null;
      let dateIso: string | null = null;

      for (let h = 1; h <= 60; h++) {
        const checkDate = addDays(cutoff, h);
        const Ls = getL14(checkDate, simMap);

        if (!dateIso && Ls * kI > CAP_31_MEI.isolasi) {
          dateIso = checkDate;
        }
        if (!dateIcu && Ls * kC > CAP_31_MEI.icu) {
          dateIcu = checkDate;
        }
        if (dateIcu && dateIso) break;
      }

      icuMap[name] = dateIcu || '';
      isoMap[name] = dateIso || '';
    }

    results[cutoff] = {
      cutoff,
      waktuGandakan: Number(waktuGandakan.toFixed(1)),
      g,
      icuPenuh: {
        lambat: icuMap['lambat'],
        tengah: icuMap['tengah'],
        cepat: icuMap['cepat'],
      },
      isolasiPenuh: {
        lambat: isoMap['lambat'],
        tengah: isoMap['tengah'],
        cepat: isoMap['cepat'],
      },
    };
  }

  return { kI, kC, load31Mei, results };
}

