import pandas as pd, numpy as np, json, math
from shapely.geometry import LineString, Point
from shapely.ops import transform, unary_union
from shapely.strtree import STRtree
from pyproj import Transformer
from sklearn.cluster import DBSCAN
D="data-raw/"; OUT="public/data/"; import os; os.makedirs(OUT,exist_ok=True)
fw=Transformer.from_crs(4326,32614,always_xy=True).transform
bw=Transformer.from_crs(32614,4326,always_xy=True).transform
R=pd.read_csv(D+'gtfs/routes.txt'); R=R[R.agency_id=='CC']
T=pd.read_csv(D+'gtfs/trips.txt'); T=T[T.route_id.isin(R.route_id)]
S=pd.read_csv(D+'gtfs/shapes.txt'); F=pd.read_csv(D+'gtfs/frequencies.txt')
ST=pd.read_csv(D+'gtfs/stop_times.txt',usecols=['trip_id','arrival_time','departure_time','stop_sequence'])
def secs(x):
    h,m,s=map(int,str(x).split(':'));return h*3600+m*60+s
ST=ST[ST.trip_id.isin(T.trip_id)].copy(); ST['t']=ST.arrival_time.fillna(ST.departure_time).map(secs)
dur=ST.groupby('trip_id').t.agg(lambda s:s.max()-s.min())
hw=F.groupby('trip_id').headway_secs.min()
routes=[]
for rid,g in T.groupby('route_id'):
    rr=R[R.route_id==rid].iloc[0]
    lines=[]
    for sid in g.shape_id.unique():
        s=S[S.shape_id==sid].sort_values('shape_pt_sequence')
        if len(s)>1: lines.append(LineString(zip(s.shape_pt_lon,s.shape_pt_lat)))
    geo=transform(fw,unary_union(lines))
    d0=g[g.direction_id==0].shape_id; ln=[transform(fw,LineString(zip(S[S.shape_id==x].sort_values('shape_pt_sequence').shape_pt_lon,S[S.shape_id==x].sort_values('shape_pt_sequence').shape_pt_lat))).length for x in g.shape_id.unique()]
    km=max(ln)/1000
    cyc=sum(dur.get(t,0) for t in g.trip_id); h=min(hw.get(t,1e9) for t in g.trip_id)
    units=math.ceil(cyc/h) if h<1e8 and cyc>0 else None
    if units and units>150: units=None  # GTFS headway implausible for a micro route
    routes.append(dict(id=rid,name=f"{rr.route_short_name} · {rr.route_long_name}",short=str(rr.route_short_name),km=round(km,2),units=units,headway_min=round(h/60) if h<1e8 else None,cycle_min=round(cyc/60),geo=geo))
print('routes',len(routes),'units dist',pd.Series([r['units'] for r in routes]).describe().to_dict())
# crashes with microbus
V=pd.concat([pd.read_csv(D+'veh.csv',low_memory=False),pd.read_csv(D+'veh24.csv',low_memory=False)])
H=pd.concat([pd.read_csv(D+'hechos.csv',low_memory=False),pd.read_csv(D+'hechos24.csv',low_memory=False)])
def norm_date(s):
    s=str(s); return f"{s[6:10]}-{s[3:5]}-{s[0:2]}" if '/' in s else s[:10]
V['fecha']=V.fecha_evento.map(norm_date); H['fecha']=H.fecha_evento.map(norm_date)
M=V[V.tipo_vehiculo=='MICROBUS'][['folio','fecha','latitud','longitud','tipo_evento']].drop_duplicates('folio')
H2=H.drop_duplicates('folio')[['folio','personas_fallecidas','personas_lesionadas','punto_1','punto_2']]
M=M.merge(H2,on='folio',how='left')
M['latitud']=pd.to_numeric(M.latitud,errors='coerce');M['longitud']=pd.to_numeric(M.longitud,errors='coerce');M['personas_lesionadas']=pd.to_numeric(M.personas_lesionadas,errors='coerce');M['personas_fallecidas']=pd.to_numeric(M.personas_fallecidas,errors='coerce');M=M.dropna(subset=['latitud','longitud']); M=M[(M.latitud.between(19,19.7))&(M.longitud.between(-99.5,-98.8))]
print('microbus events',len(M), M.fecha.str[:4].value_counts().sort_index().to_dict())
pts=[transform(fw,Point(x,y)) for x,y in zip(M.longitud,M.latitud)]
tree=STRtree([r['geo'] for r in routes])
BUF=50; assign=[]
for p in pts:
    idx=tree.query(p.buffer(BUF))
    best=None;bd=1e9
    for i in idx:
        d=routes[i]['geo'].distance(p)
        if d<bd: bd=d;best=i
    assign.append(best if bd<=BUF else None)
M['route']=[routes[i]['id'] if i is not None else None for i in assign]
M['yr']=M.fecha.str[:4].astype(int)
print('on a CC route within 50m:',M.route.notna().sum(),'of',len(M))
YRS=list(range(2018,2025)); ny=len(YRS)
cnt=M[M.route.notna()].groupby('route').size()
for r in routes:
    r['crashes']=int(cnt.get(r['id'],0)); r['by_year']={y:int(((M.route==r['id'])&(M.yr==y)).sum()) for y in YRS}
    r['hurt']=int(M[M.route==r['id']].personas_lesionadas.fillna(0).sum()); r['dead']=int(M[M.route==r['id']].personas_fallecidas.fillna(0).sum())
# Empirical Bayes (HSM-style, exposure = km)
obs=np.array([r['crashes']/ny for r in routes]); km=np.array([r['km'] for r in routes])
lam=obs.sum()/km.sum(); mu=lam*km
# overdispersion k by moments: Var(y)=mu+k*mu^2
resid=((obs*ny-mu*ny)**2-(obs*ny)).sum(); k=max(resid/((mu*ny)**2).sum(),1e-3)
w=1/(1+k*mu*ny); eb=w*mu*ny+(1-w)*obs*ny
for r,m,e,ww in zip(routes,mu*ny,eb,w):
    r['expected']=round(m,1); r['eb']=round(e,1); r['eb_excess']=round(e-m,1); r['eb_per_km_yr']=round(e/ny/r['km'],3); r['w']=round(ww,3)
print('lambda/km/yr',round(lam,3),'k',round(k,3))
KMIN=11
for r in routes: r['eligible']=bool(r['units'] and r['units']>=KMIN)
routes.sort(key=lambda r:(not r['eligible'],-r['eb_excess']))
for i,r in enumerate(routes): r['rank']=i+1
ELIG=[r for r in routes if r['eligible']]; print('eligible',len(ELIG))
# DBSCAN hotspots on all microbus crashes
XY=np.array([[p.x,p.y] for p in pts]); lab=DBSCAN(eps=120,min_samples=8).fit_predict(XY)
M['cl']=lab; hs=[]
for c in sorted(set(lab)-{-1}):
    g=M[M.cl==c]; cx,cy=XY[lab==c].mean(0); lon,lat=bw(cx,cy)
    corner=(g.punto_1.mode().iat[0] if g.punto_1.notna().any() else '')+' / '+(g.punto_2.mode().iat[0] if g.punto_2.notna().any() else '')
    hs.append(dict(lat=round(lat,5),lon=round(lon,5),n=int(len(g)),hurt=int(g.personas_lesionadas.fillna(0).sum()),dead=int(g.personas_fallecidas.fillna(0).sum()),corner=corner.title()))
hs.sort(key=lambda h:-h['n']); print('hotspots',len(hs),hs[:5])
# Power simulation: DiD, NB counts, top-N routes by EB, half treated
rng=np.random.default_rng(7)
def power(N,eff,years_after,sims=2000,years_pre=2):
    base=np.array([r['eb']/ny for r in ELIG[:N]])  # route's persistent crashes/yr (EB estimate)
    hits=0
    for _ in range(sims):
        tr=rng.permutation(N)<N//2
        pre=rng.poisson(base*years_pre); post=rng.poisson(base*years_after*np.where(tr,1-eff,1))
        def stat(t): return np.log((post[t].sum()+.5)/(pre[t].sum()+.5))-np.log((post[~t].sum()+.5)/(pre[~t].sum()+.5))
        s0=stat(tr); null=np.array([stat(rng.permutation(tr)) for _ in range(200)])
        if np.mean(null<=s0)<0.05: hits+=1
    return round(hits/sims,2)
PW=[]
for N in sorted(set([10,20,30,40,60,len(ELIG)//2*2])):
    for eff in [0.25,0.33,0.5]:
        for ya in [1,2]:
            PW.append(dict(routes=N,effect=eff,years_after=ya,power=power(N,eff,ya,sims=500)))
print(pd.DataFrame(PW).pivot_table(index=['routes','years_after'],columns='effect',values='power'))
# Placebo on real data: top-40, random half 'treated' with fixed seed, fake start 2023-07-01, 12m pre / 12m post
top=[r['id'] for r in ELIG[:40]]; prng=np.random.default_rng(2041); trt=set(np.array(top)[prng.permutation(40)<20])
Mm=M[M.route.isin(top)].copy(); Mm['d']=pd.to_datetime(Mm.fecha)
pre=(Mm.d>='2022-07-01')&(Mm.d<'2023-07-01'); post=(Mm.d>='2023-07-01')&(Mm.d<'2024-07-01')
def agg(t): g=Mm[Mm.route.isin(t)]; return int(pre[g.index].sum()),int(post[g.index].sum())
tp,tq=agg(trt); cp,cq=agg(set(top)-trt)
ratio=(tq/tp)/(cq/cp)
perm=[]
for _ in range(2000):
    t=set(np.array(top)[rng.permutation(40)<20]); a,b=agg(t); c,d=agg(set(top)-t); perm.append((b/a)/(d/c))
lo,hi=np.percentile(perm,[2.5,97.5])
PL=dict(treated_pre=tp,treated_post=tq,control_pre=cp,control_post=cq,ratio=round(ratio,3),null_lo=round(lo,3),null_hi=round(hi,3),seed=2041,start='2023-07-01')
print('placebo',PL)
# outputs
def simp(g): return transform(bw,g.simplify(25))
feats=[]
for r in routes:
    g=simp(r['geo']); gj=json.loads(json.dumps(g.__geo_interface__))
    def rnd(c): return [round(c[0],5),round(c[1],5)]
    if gj['type']=='LineString': gj['coordinates']=[rnd(c) for c in gj['coordinates']]
    else: gj['coordinates']=[[rnd(c) for c in l] for l in gj['coordinates']]
    props={k:v for k,v in r.items() if k!='geo'}
    feats.append(dict(type='Feature',geometry=gj,properties=props))
json.dump(dict(type='FeatureCollection',features=feats),open(OUT+'rutas.json','w'),separators=(',',':'))
M['ym']=M.fecha.str[:7]
cr=[[round(a,5),round(b,5),ym,int(h or 0),int(dd or 0),rt] for a,b,ym,h,dd,rt in zip(M.latitud,M.longitud,M.ym,M.personas_lesionadas.fillna(0),M.personas_fallecidas.fillna(0),M.route)]
json.dump(cr,open(OUT+'choques.json','w'),separators=(',',':'))
meta=dict(kmin=KMIN,eligible=len(ELIG),years=YRS,n_events=len(M),n_on_routes=int(M.route.notna().sum()),buffer_m=BUF,lambda_km_yr=round(lam,4),k=round(k,4),routes=len(routes),hotspots=hs[:25],power=PW,placebo={k:(float(v) if isinstance(v,(np.floating,)) else v) for k,v in PL.items()},
  sources=dict(ssc='datos.cdmx.gob.mx — Hechos de tránsito registrados por la SSC (serie ampliada 2018–2023 y 2024), tabla de vehículos involucrados, tipo_vehiculo=MICROBUS',gtfs='datos.cdmx.gob.mx — GTFS estático CDMX (16-feb-2026), agency_id=CC (Corredores Concesionados)'))
json.dump(meta,open(OUT+'meta.json','w'),ensure_ascii=False,indent=1)
print({f:os.path.getsize(OUT+f) for f in os.listdir(OUT)})
print([ (r['rank'],r['short'],r['km'],r['units'],r['crashes'],r['eb_excess']) for r in routes[:12]])
