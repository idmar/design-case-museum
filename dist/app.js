'use strict';
const cases=window.MUSEUM_CASES;
const categories=['全部','沉浸體驗','品牌敘事','字體實驗','產品介面','視覺藝術','設計閱讀'];
const pageSize=24;
const gallery=document.getElementById('gallery'),dialog=document.getElementById('detail'),search=document.getElementById('search'),filters=document.getElementById('filters'),pagination=document.getElementById('pagination');
let category='全部',query='',page=1,activeId=null,lastTrigger=null,searchTimer;
const num=n=>String(n).padStart(2,'0');
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=s=>s.normalize('NFKC').toLocaleLowerCase().trim();
const searchable=new Map(cases.map(c=>[c.id,normalize([c.name,c.title,c.category,c.headline,c.summary,...c.tags,c.url].join(' '))]));
function filtered(){const words=normalize(query).split(/\s+/).filter(Boolean);return cases.filter(c=>(category==='全部'||c.category===category)&&words.every(w=>searchable.get(c.id).includes(w)))}
const revealObserver='IntersectionObserver'in window?new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');revealObserver.unobserve(e.target)}})},{threshold:.06}):null;
function previewHTML(c,detail=false,priority=false,lazy=true){
 if(c.preview_status==='missing-in-source')return `<div class="${detail?'detail-empty':'frame'} preview-unavailable"><span class="archive-code">ARCHIVE ${num(c.id)}</span><span class="archive-label">原附件未保存預覽</span><span class="archive-hint">${detail?'名稱與原始來源已完整保留。':'開啟筆記與原始來源 ↗'}</span></div>`;
 return `${detail?'':'<div class="frame">'}<img class="${detail?'detail-image':''}" src="${c.asset}" alt="${escapeHTML(c.name)} ${detail?'完整':'存檔'}預覽" width="${c.width}" height="${c.height}" decoding="async" ${priority?'fetchpriority="high"':(lazy?'loading="lazy"':'')}>${detail?'':'<span class="view" aria-hidden="true">↗</span></div>'}`;
}
function renderFilters(){filters.innerHTML=categories.map(t=>`<button data-filter="${t}" aria-pressed="${category===t}">${t==='全部'?'全部館藏':t} <sup>${num(t==='全部'?cases.length:cases.filter(c=>c.category===t).length)}</sup></button>`).join('')}
function render(){
 revealObserver?.disconnect();const items=filtered(),total=items.length,totalPages=Math.max(1,Math.ceil(total/pageSize));page=Math.max(1,Math.min(page,totalPages));
 const start=(page-1)*pageSize,shown=items.slice(start,start+pageSize);
 document.getElementById('count').textContent=total?`${start+1}–${start+shown.length} / ${total} 件館藏`:'沒有符合的館藏';
 document.getElementById('clear-search').hidden=!query;
 if(!shown.length){gallery.innerHTML='<div class="empty"><span>NO MATCHES</span><h3>換一個詞，再探索一次。</h3><p>可搜尋作品名稱、設計特點或標籤，亦可清除條件，返回全部館藏。</p><button id="reset-results">清除搜尋與分類</button></div>'}
 else gallery.innerHTML=shown.map((c,i)=>{const feature=category==='全部'&&!query&&page===1&&i===0;return `<article class="card ${feature?'feature':''}" style="animation-delay:${Math.min(i,3)*40}ms"><button class="card-trigger" data-id="${c.id}" aria-label="查看 ${escapeHTML(c.name)}：${escapeHTML(c.headline)}">${previewHTML(c,false,feature,i>2)}<div class="info"><div class="card-meta"><span>${feature?'CURATOR’S PICK':'EXHIBIT '+num(c.id)}</span><span>${c.category}</span></div>${feature?'<div class="feature-kicker">本期焦點 / '+escapeHTML(c.headline)+'</div>':''}<h3>${escapeHTML(c.name)}</h3><p>${feature?escapeHTML(c.summary):escapeHTML(c.headline)}</p><div class="sub">${c.tags.map(t=>`<span>${escapeHTML(t)}</span>`).join('')}</div>${feature?'<div class="feature-link">閱讀策展筆記 <span>↗</span></div>':''}</div></button></article>`}).join('');
 if(revealObserver)gallery.querySelectorAll('.card').forEach((el,i)=>{if(i>2){el.classList.add('reveal');revealObserver.observe(el)}});
 filters.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===category)));
 pagination.hidden=totalPages<=1;
 if(totalPages>1){let pages=[];for(let n=1;n<=totalPages;n++){if(n===1||n===totalPages||Math.abs(n-page)<=1)pages.push(n)}
 pagination.innerHTML=`<button data-page="${page-1}" ${page===1?'disabled':''} aria-label="上一頁">← <span>上一頁</span></button><div class="page-numbers">${pages.map((n,i)=>`${i&&n-pages[i-1]>1?'<span class="ellipsis">…</span>':''}<button data-page="${n}" ${n===page?'aria-current="page"':''} aria-label="第 ${n} 頁">${n}</button>`).join('')}</div><button data-page="${page+1}" ${page===totalPages?'disabled':''} aria-label="下一頁"><span>下一頁</span> →</button>`}
 document.getElementById('page-caption').textContent=total?`第 ${page} / ${totalPages} 頁 · 每頁最多 ${pageSize} 件`:'277 件收藏，等待下一次發現。';
 progress();
}
function showCase(id){const c=cases.find(c=>c.id===id);if(!c)return;activeId=id;
 document.getElementById('detail-number').textContent=`EXHIBIT ${num(c.id)} / ${c.category}`;
 const isReading=c.category==='設計閱讀';
 document.getElementById('detail-body').innerHTML=`${previewHTML(c,true,true,false)}<div class="detail-copy"><div class="eyebrow">${c.tags.map(escapeHTML).join(' / ')}</div><h2 id="detail-title">${escapeHTML(c.name)}</h2><h3 class="lead">${escapeHTML(c.headline)}</h3><p>${escapeHTML(c.summary)}</p><div class="notes"><section><h3><span>01</span>${isReading?'視覺觀察':'設計亮點'}</h3><p>${escapeHTML(c.analysis)}</p></section><section><h3><span>02</span>${isReading?'閱讀切入點':'可以帶走的靈感'}</h3><p>${escapeHTML(c.lesson)}</p></section></div><a class="original" href="${escapeHTML(c.url)}" target="_blank" rel="noopener noreferrer">${isReading?'前往原始文章':'前往原始作品'} <span aria-hidden="true">↗</span></a><div class="source-note"><p>在新分頁開啟 · ${c.preview_status==='embedded'?'預覽取自':'收藏記錄位於'} bestweb.pdf，第 ${c.pdf_page} 頁。原站內容可能已更新。</p>${c.preview_status==='recovered-web'?`<p>補回題圖：<a href="${escapeHTML(c.preview_source_url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(c.preview_source_label)} ↗</a> · ${escapeHTML(c.preview_retrieved_at)}。${escapeHTML(c.preview_version_note)}</p>`:''}<details><summary>查看原始收藏資料</summary><p>${escapeHTML(c.title)}</p><p>原始收藏序號 ${num(c.source_index)} · ${c.preview_status==='missing-in-source'?'原附件缺圖，筆記僅提供來源線索與觀察方向':'圖片為靜態存檔，筆記基於可見畫面'}${isReading?'與標題，未將文章內容作為已核實結論':''}。</p></details></div></div>`;
 const items=filtered(),index=items.findIndex(c=>c.id===id);document.getElementById('position').textContent=`${num(index+1)} / ${num(items.length)}`;document.getElementById('prev').disabled=index<=0;document.getElementById('next').disabled=index>=items.length-1||index<0;
 if(!dialog.open){lastTrigger=document.activeElement;dialog.showModal();document.body.classList.add('locked')}
 dialog.scrollTop=0;
}
function closeDetail(){const currentId=activeId;dialog.close();activeId=null;document.body.classList.remove('locked');
 const index=filtered().findIndex(c=>c.id===currentId),targetPage=Math.floor(index/pageSize)+1;
 if(index>=0&&targetPage!==page){page=targetPage;render();gallery.querySelector(`[data-id="${currentId}"]`)?.focus({preventScroll:true})}else if(lastTrigger?.isConnected)lastTrigger.focus({preventScroll:true});
}
function updateURL(id,replace=false){const p=new URLSearchParams();if(category!=='全部')p.set('category',category);if(query)p.set('q',query);if(page>1)p.set('page',page);if(id)p.set('case',id);history[replace?'replaceState':'pushState']({},'',location.pathname+location.search+(p.size?'#'+p.toString():'#collection'))}
function stateFromURL(){const params=new URLSearchParams(location.hash.slice(1));const selected=params.get('category')||'全部';category=categories.includes(selected)?selected:'全部';query=params.get('q')||'';page=Math.max(1,parseInt(params.get('page')||'1',10)||1);search.value=query;const id=Number(params.get('case'));
 if(id&&cases.some(c=>c.id===id)){if(!filtered().some(c=>c.id===id)){category='全部';query='';search.value=''}page=Math.floor(filtered().findIndex(c=>c.id===id)/pageSize)+1;render();showCase(id)}else{if(dialog.open){dialog.close();activeId=null;document.body.classList.remove('locked')}render()}
}
function reset(){clearTimeout(searchTimer);category='全部';query='';page=1;search.value='';render();updateURL(null,true);search.focus()}
gallery.addEventListener('click',e=>{const b=e.target.closest('[data-id]');if(b){const id=Number(b.dataset.id);updateURL(id);showCase(id)}else if(e.target.closest('#reset-results'))reset()});
filters.addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(!b||category===b.dataset.filter)return;category=b.dataset.filter;page=1;render();updateURL(null,true)});
function applySearch(){query=search.value.trim();page=1;render();updateURL(null,true)}
search.addEventListener('input',e=>{if(e.isComposing)return;clearTimeout(searchTimer);searchTimer=setTimeout(applySearch,180)});search.addEventListener('compositionend',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(applySearch,180)});
document.getElementById('search-form').addEventListener('submit',e=>{e.preventDefault();clearTimeout(searchTimer);applySearch()});
document.getElementById('clear-search').addEventListener('click',()=>{clearTimeout(searchTimer);search.value='';query='';page=1;render();updateURL(null,true);search.focus()});
pagination.addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(!b||b.disabled)return;page=Number(b.dataset.page);render();updateURL(null);document.getElementById('collection-title').focus({preventScroll:true});document.getElementById('collection').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'})});
function dismiss(){closeDetail();updateURL(null,true)}document.getElementById('close').onclick=dismiss;
dialog.addEventListener('cancel',e=>{e.preventDefault();dismiss()});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dismiss()}});
function adjacent(step){const items=filtered(),i=items.findIndex(c=>c.id===activeId),c=items[i+step];if(c){showCase(c.id);updateURL(c.id,true)}}
document.getElementById('prev').onclick=()=>adjacent(-1);document.getElementById('next').onclick=()=>adjacent(1);
dialog.addEventListener('keydown',e=>{if(/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName))return;if(e.key==='ArrowLeft'){e.preventDefault();adjacent(-1)}if(e.key==='ArrowRight'){e.preventDefault();adjacent(1)}});
window.addEventListener('popstate',stateFromURL);window.addEventListener('hashchange',stateFromURL);
let scheduled=false;function progress(){const max=document.documentElement.scrollHeight-innerHeight;document.querySelector('.progress').style.transform=`scaleX(${max>0?Math.min(1,scrollY/max):0})`;scheduled=false}addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(progress)}},{passive:true});
renderFilters();stateFromURL();
if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}})},{threshold:.12});document.querySelectorAll('.about').forEach(el=>{el.classList.add('reveal');observer.observe(el)})}
