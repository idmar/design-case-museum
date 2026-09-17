"""Import every HTML feed record and match its PDF preview using hyperlink geometry.
Usage: python scripts/import_archive.py /path/to/bestweb.html /path/to/bestweb.pdf
Existing exhibit IDs and curator notes are preserved. PDF is only read, never modified.
"""
import sys,re,json,html,hashlib
from pathlib import Path
from urllib.parse import urlparse,parse_qs
from io import BytesIO
import fitz
from PIL import Image
root=Path(__file__).resolve().parent.parent
htmlpath,pdfpath=map(Path,sys.argv[1:3])
def direct(url):return parse_qs(urlparse(url).query).get('link',[url])[0]
s=htmlpath.read_text();source=[]
for b in re.split(r'<li ng-repeat="item in feed',s)[1:]:
 t=re.search(r'<h3[^>]*>(.*?)</h3>',b,re.S);im=re.search(r'muzli-lazy="([^"]+)',b);a=re.search(r'<a[^>]*href="([^"]+)',b)
 if not t:continue
 source.append({'title':html.unescape(t[1]).strip(),'image':html.unescape(im[1]) if im else '', 'source_url':html.unescape(a[1]) if a else '', 'source_index':len(source)+1})
old=json.loads((root/'dist/cases.json').read_text());byurl={c['url']:c for c in old};next_id=max(c['id'] for c in old)+1
p=fitz.open(pdfpath);matches={};link_occurrences={}
for n,page in enumerate(p):
 ims=[i for i in page.get_image_info(xrefs=True) if i['xref'] and i['width']>=300 and i['height']>=150]
 for a in page.get_links():
  url=a.get('uri','')
  if not url.startswith('http'):continue
  link_occurrences.setdefault(url,[]).append(n+1)
  rect=a['from']
  for im in ims:
   r=fitz.Rect(im['bbox']);overlap=(r&rect).get_area()/max(r.get_area(),1)
   if (overlap>.6 and abs(r.y0-rect.y0)<3) or (overlap>.5 and abs((r.y0+r.y1)/2-(rect.y0+127.875))<12):
    score=overlap+(0.1 if r.y0>1 else 0)
    if url not in matches or score>matches[url]['score']:matches[url]={'page':n+1,'xref':im['xref'],'score':score,'bbox':list(r)}
recovered=json.loads((root/'scripts/recovered-previews.json').read_text()) if (root/'scripts/recovered-previews.json').exists() else {}
result=[];missing=[]
for s in source:
 url=direct(s['source_url']);c=byurl.get(url)
 if c:c=dict(c)
 else:c={'id':next_id};next_id+=1
 c.update(s);c['url']=url;c.setdefault('name',s['title']);match=matches.get(s['source_url'])
 if match:
  raw=p.extract_image(match['xref']);image=Image.open(BytesIO(raw['image'])).convert('RGB');image.thumbnail((1200,1000));asset=f"assets/exhibit-{c['id']:03}.webp";
  if not (root/'dist'/asset).exists():image.save(root/'dist'/asset,'WEBP',quality=87,method=4)
  c.update(asset=asset,width=image.width,height=image.height,pdf_page=match['page'],preview_status='embedded',preview_xref=match['xref'])
 else:
  c['pdf_pages']=link_occurrences.get(s['source_url'],[]);c['pdf_page']=c['pdf_pages'][0] if c['pdf_pages'] else None;c['preview_status']='missing-in-source';c.pop('asset',None);c.pop('preview_xref',None);missing.append({'index':s['source_index'],'title':s['title'],'pages':c['pdf_pages']})
 if str(c['id']) in recovered:c.update(recovered[str(c['id'])])
 result.append(c)
result.sort(key=lambda c:c['id'])
(root/'dist/cases.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
(root/'scripts/import-audit.json').write_text(json.dumps({'source_count':len(source),'imported_count':len(result),'matched_previews':len(result)-len(missing),'unmatched':missing,'source_html_sha256':hashlib.sha256(htmlpath.read_bytes()).hexdigest(),'source_pdf_sha256':hashlib.sha256(pdfpath.read_bytes()).hexdigest()},ensure_ascii=False,indent=2))
print(json.dumps({'total':len(result),'matched':len(result)-len(missing),'missing':missing},ensure_ascii=False))
