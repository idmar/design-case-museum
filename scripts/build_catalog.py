"""Apply source-indexed curator notes and emit dependency-free browser data."""
import json
from pathlib import Path
root=Path(__file__).resolve().parent.parent
cats={'I':'沉浸體驗','B':'品牌敘事','T':'字體實驗','U':'產品介面','A':'視覺藝術','R':'設計閱讀'}
patterns={
'p':(['攝影敘事','觀看視角'],'先確定觀眾應從哪個距離看內容，再選擇近景、全景或情境照片。文字應落在影像較平靜的區域，避免遮蔽關鍵表情與物件。'),
'3':(['空間層次','視覺焦點'],'先用主體、前景和遠景建立深度，再安排少量清楚的導覽。將立體場景縮到手機時，仍應保留主體輪廓和明確的進入方式。'),
't':(['字體層級','尺度對比'],'先決定第一句要被看見的資訊，再透過字級、行距與字重安排其他內容。大字設計要在長標題和小螢幕上預先規劃換行。'),
's':(['材質光影','輪廓控制'],'先控制光源方向與明暗關係，再加入表面細節。讓材質幫助分辨形體，並避免高光或複雜紋理壓過必要的文字資訊。'),
'c':(['色彩識別','對比控制'],'以一個主要色彩建立辨識，再用少量對比色提示重要內容。不要只靠顏色區分操作；文字、形狀和位置也要能說明用途。'),
'g':(['網格系統','內容秩序'],'先定義重複單元、間距和群組邊界，再容納不同大小的內容。當作品增多時，清晰分組比單純縮小所有元素更有助於瀏覽。'),
'e':(['編輯拼貼','層次編排'],'讓一個穩定的標題或主圖作為中心，再安排不同尺度的內容。保留明確的邊界與留白，避免每個片段同時爭取注意力。'),
'u':(['介面層級','產品展示'],'把主要操作、預期結果和輔助說明分出先後。產品展示頁應讓使用者看見具體用途，並確保按鈕、選項與展示圖有清楚區別。'),
'i':(['插畫語言','形態一致性'],'先統一輪廓、比例與配色規則，再設計角色或場景變化。插畫應提供可辨認的主題線索，必要資訊仍用可讀文字說明。'),
'n':(['來源留存','待原站參照'],'前往原始來源時，先辨認主標題、內容結構與主要操作，再比較不同螢幕上的呈現。附件沒有圖像的部分不作視覺結論。')}
reading_lessons={
'e':'將這筆收藏作為延伸閱讀入口，先辨認封面中的主題與案例，再到原文比較各例的背景、方法與限制。封面拼貼本身不代表文章結論。',
'g':'閱讀原文時，把案例按版式、導覽與資訊層級分組比較，並記下可借鑑的結構。集合型封面只能提供線索，不能代替逐項檢視。',
't':'先觀察文章如何用標題與圖像建立議題，再閱讀其論證與來源。可把標題排版作為編輯設計參考，但不要把視覺說服力當成證據。',
'i':'區分封面插畫的比喻與文章中的實際內容，再閱讀原文的背景和方法。思考這個比喻在哪裡有助理解，又在哪裡可能造成誤解。',
's':'可先分析封面的材質和光影，再回到原文核對其製作方式與用途。靜態視覺表現不等同於可操作功能或已驗證的性能。',
'c':'比較封面中的主色、對比色與文字可讀性，再閱讀原文案例。帶回自己的專案時，要用實際內容與使用情境檢驗其適用性。',
'3':'先分辨畫面的空間層次與主要視覺，再到原文核對呈現方式。靜態截圖可以作為構圖參考，但無法直接證明互動流程。',
'u':'回到原文區分設計概念、示意介面與實際可用功能，再閱讀其依據與限制。把具體操作目標和成功條件寫清楚，才便於比較。'}
cs=json.loads((root/'dist/cases.json').read_text());notes={}
recovered=json.loads((root/'scripts/recovered-previews.json').read_text()) if (root/'scripts/recovered-previews.json').exists() else {}
for row in (root/'scripts/curator-notes.tsv').read_text().splitlines():
 i,cat,pattern,headline,summary,analysis=row.split('|');assert int(i) not in notes;notes[int(i)]=(cat,pattern,headline,summary,analysis)
for c in cs:
 if c['id']>12:
  cat,pattern,headline,summary,analysis=notes[c['source_index']];c.update(category=cats[cat],headline=headline,summary=summary,analysis=analysis,tags=patterns[pattern][0],lesson=reading_lessons.get(pattern,patterns[pattern][1])if cat=='R' else patterns[pattern][1])
  # Retain full exact source title independently from concise exhibit display labels.
  if ' | ' in c['name']:c['name']=c['name'].split(' | ')[0]
 overrides={82:'The 24 Solar Terms',120:'Framer Halloween AI Photo Booth',22:'The Women Gallery',50:'Speculative Worlds',51:'VIBRYX',83:'Robert S. Connett — Microscopic Worlds',96:'Custom Logo Illustrations with Nano Banana Pro',103:'Framer Website Templates for 2026',136:'Mechanical Poetry',141:'The Psychology of Design Feedback',175:'Our Roots · Flashlights',183:'Oops, I Did It IRL',184:'Arts Corporation — Animation Case Study',187:'FEW Issue 2',195:'Muzli Picked — Midlife Engineering',196:'Graffitied Buildings & the Housing Crisis',203:'Our First AI TV Show!',206:'Stupid Car Tray',208:'The 2025 Web Design Forecast',218:'Framer Website Templates for 2025',223:'Readymag Websites of the Year 2024',234:'Top 10 Private Spaces of 2024',243:'2025 Web Design Trends',252:'AI-driven Features for Banking UX',256:'The World of Tim Burton',257:'Set Any Text in Motion',271:'Digital Design Days 2024'}
 if c['source_index'] in overrides:c['name']=overrides[c['source_index']]
 if str(c['id']) in recovered:c.update(recovered[str(c['id'])])
 if c['preview_status']=='missing-in-source':assert not c.get('asset')
 assert all(c.get(k) for k in ['name','title','headline','summary','analysis','lesson','tags','category','url','source_url','pdf_page'])
 assert c['url'].startswith(('https://','http://'))
cs.sort(key=lambda c:c['id'])
(root/'dist/cases.json').write_text(json.dumps(cs,ensure_ascii=False,indent=2))
(root/'dist/data.js').write_text('window.MUSEUM_CASES='+json.dumps(cs,ensure_ascii=False,separators=(',',':'))+';\n')
print(json.dumps({'total':len(cs),'notes':len(notes),'categories':{cat:sum(c['category']==cat for c in cs)for cat in cats.values()},'embedded_images':sum(c['preview_status']=='embedded' for c in cs),'recovered_images':sum(c['preview_status']=='recovered-web' for c in cs),'missing_in_source':sum(c['preview_status']=='missing-in-source'for c in cs)},ensure_ascii=False))
