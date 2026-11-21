import { describe, it, expect } from 'vitest';
import { nameTokens, titleMatches, aerialImageUrl, googleLinks } from './media';

describe('pencocokan foto Wikipedia', () => {
  it('membuang kata umum', () => {
    expect(nameTokens('RS UMUM DAERAH KEBAYORAN LAMA')).toEqual(['kebayoran', 'lama']);
  });

  it('cocok untuk artikel RS yang benar', () => {
    expect(titleMatches('RSUP FATMAWATI', 'Rumah Sakit Umum Pusat Fatmawati')).toBe(true);
    expect(titleMatches('RS UMUM DAERAH KEBAYORAN LAMA', 'RSUD Kebayoran Lama')).toBe(true);
  });

  it('menolak artikel non-faskes atau nama lain', () => {
    expect(titleMatches('RSUP FATMAWATI', 'Fatmawati')).toBe(false); // artikel tokoh
    expect(titleMatches('RS UMUM AULIA', 'Rumah Sakit Fatmawati')).toBe(false);
    expect(titleMatches('RUMAH SAKIT UMUM', 'Rumah Sakit Umum')).toBe(false); // tidak ada token khas
  });
});

describe('tautan & citra', () => {
  it('membuat URL citra satelit Esri berpusat di titik', () => {
    const u = new URL(aerialImageUrl(-6.2, 106.8));
    expect(u.hostname).toBe('server.arcgisonline.com');
    const [x1, , x2] = u.searchParams.get('bbox')!.split(',').map(Number);
    expect((x1 + x2) / 2).toBeCloseTo((106.8 * 20037508.34) / 180, 0);
  });

  it('membuat tautan Google Maps & Earth', () => {
    const l = googleLinks(-6.2, 106.8, 'RS X');
    expect(l.maps).toContain('google.com/maps');
    expect(l.earth).toContain('-6.2,106.8');
  });
});
