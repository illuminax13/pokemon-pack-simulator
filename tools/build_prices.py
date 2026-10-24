"""Snapshot TCGplayer market prices (via tcgcsv.com, which has no CORS so the app can't call it live)
for sets/subsets that the live sources (pokemontcg.io bulk, TCGdex per card) don't price.
Writes data/px-snap.json: {dex:{d:date,src,p:{binder n:{h|n:usd}}}}. Re-run to refresh:
  python3 tools/build_prices.py"""
import json,re,urllib.request,datetime
B='https://tcgcsv.com/tcgplayer/3/'
def get(u):return json.load(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'rippermon-prices'}),timeout=30))
def norm(t):return re.sub(r'[^a-z0-9]','',re.sub(r'\((?!top|bottom)[^)]*\)','',t.replace('☆',' star').lower()).replace('é','e'))
def group(g):
    pr={}
    for x in get(f'{B}{g}/prices')['results']:
        if x.get('marketPrice') or x.get('midPrice'):pr.setdefault(x['productId'],{})[x['subTypeName']]=x.get('marketPrice') or x.get('midPrice')
    out=[]
    for x in get(f'{B}{g}/products')['results']:
        e={k['name']:k['value'] for k in x.get('extendedData',[])}
        if 'Number' not in e or x['productId'] not in pr:continue
        out.append((e['Number'],x['name'],pr[x['productId']]))
    return out
def ent(p):
    o={}
    if 'Normal' in p:o['n']=round(p['Normal'],2)
    h=p.get('Holofoil') or p.get('1st Edition Holofoil') or p.get('Unlimited Holofoil')
    if h:o['h']=round(h,2)
    if 'Reverse Holofoil' in p:o['r']=round(p['Reverse Holofoil'],2)
    return o
def bynum(rows,fn):
    p={}
    for num,name,pr in rows:
        k=fn(num)
        if k:p[k]=ent(pr)
    return p
def byname(rows,cards):
    """subset groups printed with their original numbers: match the binder card by name, in list order"""
    left=list(rows);p={}
    for c in cards:
        nn=norm(c['name'])
        for i,(num,name,pr) in enumerate(left):
            a=norm(re.sub(r'\s*-\s*\S+/\S+$','',name))
            if a==nn or a.replace('top','').replace('bottom','')==nn or re.sub(r'(top|bottom)$','',a)==nn:
                p[c['n']]=ent(pr);left.pop(i);break
    return p
def lst(dex):return json.load(open(f'data/{dex}.json'))['cards']
z=lambda s:s.lstrip('0') or '0'
snap={}
# 30th Celebration (me55): main set numbers NNN/128, RGB Mew = R/RGB; Classic Collection group uses original card numbers
p=bynum(group(24722),lambda n:('RGB-'+n[0]) if n.endswith('/RGB') else (z(n.split('/')[0]) if re.match(r'^\d+/',n) else None))
p.update(byname(group(24837),[c for c in lst('30th') if c['n'].startswith('CC')]))
snap['30th']=p
# Celebrations Classic Collection (cel25 CC001-CC025, priced from the cel25c group)
snap['cel25']=byname(group(2931),[c for c in lst('cel25') if c['n'].startswith('CC')])
# Crown Zenith Galarian Gallery GG01/GG70
snap['swsh12.5']=bynum(group(17689),lambda n:n.split('/')[0] if n.startswith('GG') else None)
d=datetime.date.today().isoformat()
out={k:{'d':d,'src':'TCGplayer via tcgcsv (snapshot)','p':v} for k,v in snap.items()}
for k,v in snap.items():
    want=[c['n'] for c in lst(k) if (k=='30th' or c['n'][:2] in('CC','GG'))]
    print(k,len(v),'priced; missing:',[n for n in want if n not in v][:20])
json.dump(out,open('data/px-snap.json','w'),separators=(',',':'))
