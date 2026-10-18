#!/usr/bin/env python3
"""Audit card image URLs. Usage: audit_images.py <set> [<set>...]  -> writes tools/audit/<set>.json"""
import json,sys,re,os,urllib.request,concurrent.futures as cf,time
SETS={"base1":("base","base1"),"base2":("base","base2"),"base3":("base","base3"),"swsh7":("swsh","swsh7"),
"sv03.5":("sv","sv3pt5"),"sv08":("sv","sv8"),"sv08.5":("sv","sv8pt5"),"sv09":("sv","sv9"),"sv10":("sv","sv10"),
"sv10.5b":("sv","zsv10pt5"),"sv10.5w":("sv","rsv10pt5"),"me01":("me","me1"),"me02":("me","me2"),"me02.5":("me","me2pt5"),
"me03":("me","me3"),"me04":("me","me4"),"me05":("me","me5"),"sve":("sv","sve")}
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def head(u):
    for i in range(3):
        try:
            r=urllib.request.urlopen(urllib.request.Request(u,method="HEAD",headers={"User-Agent":"pps-audit"}),timeout=15)
            return r.status,r.headers.get("content-type",""),int(r.headers.get("content-length") or 0)
        except urllib.error.HTTPError as e:
            if e.code in (429,500,502,503): time.sleep(1+i); continue
            return e.code,"",0
        except Exception as e: time.sleep(1); err=str(e)
    return 0,err,0
def chain(serie,dex,ptcg,lid):
    n=re.sub(r"^0+(?=\d)","",str(lid));b=f"https://assets.tcgdex.net/en/{serie}/{dex}/{lid}"
    return [b+"/high.webp",b+"/low.webp",b+"/high.png",b+"/low.png",f"https://images.pokemontcg.io/{ptcg}/{n}.png",f"https://images.pokemontcg.io/{ptcg}/{n}_hires.png"]
def audit(dex):
    serie,ptcg=SETS[dex];d=json.load(open(f"{ROOT}/data/{dex}.json"));out=[]
    def one(c):
        ch=chain(serie,dex,ptcg,c["lid"]);res={}
        # primary tcgdex + primary pokemontcg; full chain only if primary fails
        for u in (ch[0],ch[4]): res[u]=head(u)
        if res[ch[0]][0]!=200:
            for u in ch[1:]:
                if u not in res: res[u]=head(u)
        ok=[u for u,(s,t,l) in res.items() if s==200 and t.startswith("image")]
        return {"id":c["id"],"lid":c["lid"],"name":c["name"],"rarity":c.get("rarity"),"img":c.get("img"),
                "res":{u:list(v) for u,v in res.items()},"ok":ok,"first_ok":next((u for u in ch if u in ok),None)}
    with cf.ThreadPoolExecutor(12) as ex: out=list(ex.map(one,d["cards"]))
    os.makedirs(f"{ROOT}/tools/audit",exist_ok=True);json.dump(out,open(f"{ROOT}/tools/audit/{dex}.json","w"),indent=0)
    bad=[o for o in out if not o["first_ok"]];prim=[o for o in out if o["res"][chain(serie,dex,ptcg,o['lid'])[0]][0]!=200]
    small=[o for o in out if (o['res'].get(chain(serie,dex,ptcg,o['lid'])[0]) or [0,0,0])[2] and o['res'][chain(serie,dex,ptcg,o['lid'])[0]][2]<8000]
    print(dex,len(out),"primaryFail",len(prim),"allFail",len(bad),"tinyPrimary",len(small),"ptcgFail",sum(1 for o in out if o['res'][chain(serie,dex,ptcg,o['lid'])[4]][0]!=200),flush=True)
for s in sys.argv[1:]: audit(s)
