import pandas as pd, numpy as np, sys
d=pd.read_csv(sys.argv[1],parse_dates=['Date'])
j=d[d.Location=='DKI JAKARTA'].set_index('Date').sort_index()['KASUS'].asfreq('D').fillna(0)
k7=j.rolling(7).mean()
LOS=14
def load(series): return series.rolling(LOS).sum()   # proxy beban: kasus 14 hari terakhir
obs={'2021-05-31':(2176,362),'2021-06-14':(5752,773),'2021-06-23':(8874,1048),'2021-07-18':(10016,1447)}
cap0=(6621,1014)   # kapasitas 31 Mei
L=load(j)
kI=obs['2021-05-31'][0]/L['2021-05-31']; kC=obs['2021-05-31'][1]/L['2021-05-31']
print(f"Beban proxy 31 Mei={L['2021-05-31']:.0f}  kIso={kI:.3f} kICU={kC:.4f}")
for dt,(i,c) in obs.items():
    print(dt,"obs iso",i,"pred(fit 31Mei, data aktual)",round(kI*L[dt]),"| obs icu",c,"pred",round(kC*L[dt]))
# tanggal nyata melewati kapasitas 31 Mei (interpolasi linear antar titik)
def cross(a,b,cap,da,db):
    da,db=pd.Timestamp(da),pd.Timestamp(db); return da+(db-da)*((cap-a)/(b-a))
print("Nyata: iso > 6621 sekitar", cross(5752,8874,6621,'2021-06-14','2021-06-23').date(),
      "| ICU > 1014 sekitar", cross(773,1048,1014,'2021-06-14','2021-06-23').date())
print()
for cut in ['2021-06-07','2021-06-10','2021-06-14','2021-06-17']:
    c=pd.Timestamp(cut)
    g=(k7[c]/k7[c-pd.Timedelta(days=7)])**(1/7)    # laju tumbuh harian 7 hari terakhir
    res=[]
    for gg in [g**0.85, g, g**1.15]:               # rentang +-15% pada laju log
        hist=j[:c].copy()
        fut=pd.Series([k7[c]*gg**h for h in range(1,61)],index=pd.date_range(c+pd.Timedelta(days=1),periods=60))
        s=pd.concat([hist,fut]); Ls=load(s)
        di=Ls[Ls*kI>cap0[0]].index; dc=Ls[Ls*kC>cap0[1]].index
        di=[x for x in di if x>c]; dc=[x for x in dc if x>c]
        res.append((di[0].date() if di else None, dc[0].date() if dc else None))
    td=np.log(2)/np.log(g)
    print(f"cutoff {cut}: doubling {td:.1f} hari | iso penuh (lambat/tengah/cepat): {[r[0] for r in res]} | ICU penuh: {[r[1] for r in res]}")
