import { BwbStatus, BwbItemResult, Facility, LeadTime } from '../types';

export function calculateBwb(
  facility: Facility,
  leadTimes: LeadTime[],
  currentDateStr: string = '2021-06-10',
  cadanganAmanHari: number = 0
): BwbItemResult[] {
  // Parse current date
  const [cy, cm, cd] = currentDateStr.split('-').map(Number);
  const curDate = new Date(Date.UTC(cy, cm - 1, cd));

  function addDays(d: Date, days: number): string {
    const next = new Date(d.getTime());
    next.setUTCDate(next.getUTCDate() + days);
    const y = next.getUTCFullYear();
    const m = String(next.getUTCMonth() + 1).padStart(2, '0');
    const day = String(next.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function getDiffDays(targetStr: string): number {
    const [ty, tm, td] = targetStr.split('-').map(Number);
    const target = new Date(Date.UTC(ty, tm - 1, td));
    return Math.round((target.getTime() - curDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  const results: BwbItemResult[] = [];

  // Define the standard resources and match with leadTimes
  const resourceConfigs = [
    {
      sumberDaya: 'TT Isolasi',
      matchPersiapan: 'Tempat tidur isolasi',
      capacity: facility.tt_isolasi,
      // Default estimate days until full relative to current date (e.g. 13-16 days for 10 June -> 23-26 Jun)
      defaultPenuhMinHari: 13,
      defaultPenuhMaxHari: 16,
    },
    {
      sumberDaya: 'TT ICU',
      matchPersiapan: 'Tempat tidur ICU',
      capacity: facility.tt_icu,
      defaultPenuhMinHari: 12,
      defaultPenuhMaxHari: 15,
    },
    {
      sumberDaya: 'Oksigen (Pemasok Int.)',
      matchPersiapan: 'Oksigen',
      capacity: facility.kapasitas_oksigen_liter_per_hari,
      defaultPenuhMinHari: 12,
      defaultPenuhMaxHari: 15,
    },
    {
      sumberDaya: 'APD (Masker N95)',
      matchPersiapan: 'APD',
      capacity: facility.stok_apd_n95,
      defaultPenuhMinHari: 14,
      defaultPenuhMaxHari: 21,
    },
    {
      sumberDaya: 'Obat Terapi Suportif',
      matchPersiapan: 'Obat',
      capacity: facility.stok_obat_suportif_dosis,
      defaultPenuhMinHari: 15,
      defaultPenuhMaxHari: 25,
    },
    {
      sumberDaya: 'Tenaga Kesehatan (Perawat)',
      matchPersiapan: 'Tenaga kesehatan',
      capacity: facility.tenaga_kesehatan_perawat,
      defaultPenuhMinHari: 18,
      defaultPenuhMaxHari: 28,
    },
  ];

  for (const config of resourceConfigs) {
    const hasData = config.capacity !== undefined && config.capacity !== null;
    
    // Find matching lead time from data or use fallback
    const lt = leadTimes.find(l => 
      l.persiapan.toLowerCase().includes(config.matchPersiapan.toLowerCase())
    ) || {
      persiapan: config.sumberDaya,
      lead_time_min_hari: 7,
      lead_time_max_hari: 14,
      dasar: 'Asumsi',
      status_data: 'ASUMSI' as const,
    };

    const penuhMinHari = config.defaultPenuhMinHari;
    const penuhMaxHari = config.defaultPenuhMaxHari;

    const tPenuhMinDate = addDays(curDate, penuhMinHari);
    const tPenuhMaxDate = addDays(curDate, penuhMaxHari);

    // BWB = T_penuh - Waktu_tunggu - Cadangan_aman
    // BWB_awal (paling cepat bertindak) = T_penuh_min - LT_max - Cadangan
    // BWB_akhir (paling lambat bertindak) = T_penuh_max - LT_min - Cadangan
    const bwbMinDays = penuhMinHari - lt.lead_time_max_hari - cadanganAmanHari;
    const bwbMaxDays = penuhMaxHari - lt.lead_time_min_hari - cadanganAmanHari;

    const bwbMinDate = addDays(curDate, bwbMinDays);
    const bwbMaxDate = addDays(curDate, bwbMaxDays);

    // Determine status (SPEC §8.7)
    let status: BwbStatus = 'AMAN';
    let tindakanDisarankan = 'Pantau; siapkan dokumen pengadaan.';

    if (bwbMaxDays < 0) {
      status = 'TERLEWAT';
      tindakanDisarankan = 'Pinjam antarfaskes, rujuk ke faskes longgar, pertimbangkan opsi pembatasan.';
    } else if (bwbMinDays < 0 && bwbMaxDays >= 0) {
      status = 'SIAGA_SEBAGIAN';
      tindakanDisarankan = 'Siaga: sebagian rentang BWB telah lewat. Segera mulai persiapan hari ini.';
    } else if (bwbMinDays <= 14) {
      status = 'SIAGA';
      tindakanDisarankan = 'Mulai persiapan; dahulukan sumber daya dengan BWB terdekat.';
    }

    results.push({
      sumberDaya: config.sumberDaya,
      penuhDalamMinHari: penuhMinHari,
      penuhDalamMaxHari: penuhMaxHari,
      leadTimeMinHari: lt.lead_time_min_hari,
      leadTimeMaxHari: lt.lead_time_max_hari,
      tanggalPenuhMin: tPenuhMinDate,
      tanggalPenuhMax: tPenuhMaxDate,
      bwbMin: bwbMinDate,
      bwbMax: bwbMaxDate,
      status,
      tindakanDisarankan,
      adaData: hasData,
    });
  }

  // Sort by nearest BWB (ascending bwbMinDays)
  results.sort((a, b) => a.bwbMin.localeCompare(b.bwbMin));

  return results;
}

