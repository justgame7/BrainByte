const APP='BrainByte',LH={courses:[],L:{},Q:{}},$=s=>document.querySelector(s);
LH.add=o=>{o.modules=o.phases.map((p,i)=>({id:`${o.id}:${i+1}`,title:`Phase ${i+1}: ${p[0]}`,topics:p[1].map((t,j)=>({id:`${o.id}:${i+1}:${j+1}`,title:t}))}));LH.courses.push(o)};
const g=c=>{try{return JSON.parse(localStorage.getItem('lh:'+c.id))||{t:{},q:{}}}catch(e){return{t:{},q:{}}}};
const sv=(c,d)=>{try{localStorage.setItem('lh:'+c.id,JSON.stringify(d))}catch(e){}};
const secs=b=>{const r=[];b.forEach(k=>{if(k.t=='h'&&k.s)r.push({title:k.x.replace(/^\d+\.\s*/,''),b:[]});else{if(!r.length)r.push({title:'Overview',b:[]});r[r.length-1].b.push(k)}});return r};
const tops=c=>c.modules.flatMap(m=>m.topics),ready=c=>tops(c).filter(t=>LH.L[t.id]);
const done=(c,l)=>l.filter(t=>g(c).t[t.id]=='done').length;
const pct=c=>Math.round(100*done(c,tops(c))/tops(c).length);
const B={h:b=>`<h2>${b.x}</h2>`,p:b=>`<p>${b.x}</p>`,tip:b=>`<div class=tip>${b.x}</div>`,code:b=>`<pre>${b.x}</pre>`,
list:b=>`<ul>${b.i.map(i=>`<li>${i}</li>`).join('')}</ul>`,
tbl:b=>`<div class=tw><table><tr>${b.h.map(h=>`<th>${h}</th>`).join('')}</tr>${b.r.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</table></div>`,
flow:b=>`<div class=flow>${b.s.map(s=>`<div class=st>${s}</div>`).join('<i>▼</i>')}</div>`,
arch:b=>`<div class=arch>${b.g.map(x=>`<div class=g1><span>${x[0]}</span><div>${x[1].map(i=>`<em>${i}</em>`).join('')}</div></div>`).join('')}</div>`,
ex:b=>`<div class=ex><b>Real-world example</b>${b.x}</div>`,warn:b=>`<div class=warn>${b.x}</div>`,
steps:b=>`<ol class=steps>${b.i.map(i=>`<li>${i}</li>`).join('')}</ol>`,
cmp:b=>`<div class=cmp>${[b.a,b.b].map(s=>`<div><h3>${s[0]}</h3><ul>${s[1].map(i=>`<li>${i}</li>`).join('')}</ul></div>`).join('')}</div>`,
qa:b=>`<details><summary>${b.q}</summary><p>${b.x}</p></details>`,
svg:b=>`<div class=dg>${b.x}</div>`};
LH.home=()=>{const cs=LH.courses,all=cs.flatMap(tops),d=cs.reduce((n,c)=>n+done(c,tops(c)),0);
const qs=cs.flatMap(c=>Object.values(g(c).q));const avg=qs.length?Math.round(qs.reduce((a,x)=>a+100*x.s/x.n,0)/qs.length)+'%':'–';
$('#app').innerHTML=`<div class=w><h1>${APP}</h1><p class=mu>Learn IT topics step by step, with diagrams, tables and quizzes.</p>
<div class=stats><div><b>${d}/${all.length}</b><span class=mu>topics done</span></div><div><b>${cs.length}</b><span class=mu>courses</span></div><div><b>${avg}</b><span class=mu>quiz average</span></div></div>
<h2>Courses</h2>${cs.map(c=>{const t=tops(c),n=done(c,t),p=t.filter(x=>g(c).t[x.id]=='prog').length;return`<a class=card href="${c.id}.html"><span class=ic>${c.icon}</span><h3>${c.title}</h3><p class=mu>${c.desc}</p><div class=bar><i style="width:${pct(c)}%"></i></div><span class=mu>${c.modules.length} phases · ${t.length} topics · ${ready(c).length} lessons ready</span><br><span class=mu>${n} done · ${p} in progress · ${t.length-n-p} not started</span></a>`}).join('')}</div>`};
LH.open=id=>{const c=LH.courses.find(x=>x.id==id),R=()=>{document.ontouchstart=document.ontouchend=null;const h=location.hash.slice(1).split('/'),d=g(c);
const hd=`<div class=top><a class="btn g" href="index.html">← Home</a>${h[0]?`<a class="btn g" href="#">Course</a>`:''}</div>`;
if(h[0]=='t'){const t=tops(c),i=t.findIndex(x=>x.id==h[1]),x=t[i],b=LH.L[x.id],S=b?secs(b):[],n=+h[2]||0,id=x.id,nx=t[i+1]?`<a class="btn g" href="#t/${t[i+1].id}">Next topic</a>`:'';
d.s=d.s||{};if(b&&d.t[id]!='done'){d.t[id]='prog';sv(c,d)}
if(S.length<2){$('#app').innerHTML=`<div class=w>${hd}<h1>${x.title}</h1>${b?b.map(k=>B[k.t](k)).join(''):'<div class=card><b>Lesson coming soon</b><p class=mu>This topic is on the roadmap. The detailed lesson will be added in a later update.</p></div>'}<p>${!b?'':d.t[id]=='done'?'<span class=mu>Completed ✓</span>':`<button class=btn id=dn>Mark complete</button>`}${nx}</p></div>`;const k=$('#dn');if(k)k.onclick=()=>{d.t[id]='done';sv(c,d);R()};scrollTo(0,0);return}
if(!n||n>S.length){const rd=S.filter((_,k)=>d.s[id+':'+(k+1)]).length,nu=S.findIndex((_,k)=>!d.s[id+':'+(k+1)])+1||1;
$('#app').innerHTML=`<div class=w>${hd}<h1>${x.title}</h1><div class=bar><i style="width:${100*rd/S.length}%"></i></div><span class=mu>${rd} of ${S.length} sections read${d.t[id]=='done'?' · Completed ✓':''}</span><p><a class=btn href="#t/${id}/${nu}">${rd?(rd==S.length?'Read again':'Continue'):'Start'} ›</a>${nx}</p><div class=card>${S.map((s,k)=>`<div class=row tabindex=0 data-h="t/${id}/${k+1}"><span class="dot ${d.s[id+':'+(k+1)]?'done':''}"></span><b>${s.title}</b><span class=mu>›</span></div>`).join('')}</div></div>`;
document.querySelectorAll('.row').forEach(r=>r.onclick=()=>location.hash=r.dataset.h);scrollTo(0,0);return}
const s=S[n-1],L=n==S.length;d.s[id+':'+n]=1;sv(c,d);
$('#app').innerHTML=`<div class=w><div class=top><a class="btn g" href="#t/${id}">☰ Sections</a><a class="btn g" href="#">Course</a></div><span class=mu>${x.title} · ${n} of ${S.length}</span><div class=bar><i style="width:${100*n/S.length}%"></i></div><h1>${s.title}</h1>${s.b.map(k=>B[k.t](k)).join('')}</div><div class=pn>${n>1?`<a class="btn g" href="#t/${id}/${n-1}">‹ Prev</a>`:'<span></span>'}<a class=pc href="#t/${id}">${n} / ${S.length}</a>${L?'<button class=btn id=dn>Finish ✓</button>':`<a class=btn href="#t/${id}/${n+1}">Next ›</a>`}</div>`;
const k=$('#dn');if(k)k.onclick=()=>{d.t[id]='done';sv(c,d);location.hash='t/'+id};
let X;document.ontouchstart=e=>{X=e.target.closest('.tw,.dg,pre')?null:e.touches[0].clientX};
document.ontouchend=e=>{if(X==null)return;const dx=e.changedTouches[0].clientX-X,m=dx<0?n+1:n-1;if(Math.abs(dx)>90&&m>=1&&m<=S.length)location.hash='t/'+id+'/'+m};
scrollTo(0,0);return}
if(h[0]=='q'){const m=c.modules.find(x=>x.id==h[1]),Q=LH.Q[m.id],sel=[];let fin=0;
const draw=()=>{$('#app').innerHTML=`<div class=w>${hd}<h1>Quiz: ${m.title}</h1><p class=mu>${Q.length} questions</p>${Q.map((q,i)=>`<div class=q><b>${i+1}. ${q.q}</b>${q.o.map((o,j)=>`<button class="o ${fin?(j==q.a?'ok':sel[i]==j?'no':''):sel[i]==j?'s':''}" data-i=${i} data-j=${j}>${o}</button>`).join('')}${fin?`<p class=mu>${q.e}</p>`:''}</div>`).join('')}
${fin?`<div class=card><span class=score>${fin.s}/${fin.n}</span> <span class=mu>${Math.round(100*fin.s/fin.n)}%</span></div><button class=btn id=rt>Retake</button>`:`<button class=btn id=sb>Submit</button>`}</div>`;
document.querySelectorAll('.o').forEach(b=>b.onclick=()=>{if(!fin){sel[+b.dataset.i]=+b.dataset.j;draw()}});
const s=$('#sb');if(s)s.onclick=()=>{if(Q.some((q,i)=>sel[i]==null))return alert('Answer every question first.');const sc=Q.filter((q,i)=>sel[i]==q.a).length;fin={s:sc,n:Q.length};const o=d.q[m.id];if(!o||sc>=o.s)d.q[m.id]=fin;sv(c,d);draw();scrollTo(0,0)};
const r=$('#rt');if(r)r.onclick=()=>{fin=0;sel.length=0;draw();scrollTo(0,0)}};draw();return}
$('#app').innerHTML=`<div class=w>${hd}<h1><span class=ic>${c.icon}</span> ${c.title}</h1><p class=mu>${c.desc}</p><div class=bar><i style="width:${pct(c)}%"></i></div><span class=mu>${pct(c)}% complete · ${ready(c).length} of ${tops(c).length} lessons ready</span>
${c.modules.map(m=>{const q=d.q[m.id];return`<div class=card><h3>${m.title}</h3><span class=mu>${done(c,m.topics)}/${m.topics.length} topics done</span>${m.topics.map(x=>`<div class=row tabindex=0 data-h="t/${x.id}"><span class="dot ${d.t[x.id]||''}"></span><b>${x.title}</b>${LH.L[x.id]?'':'<span class=mu>Soon</span>'}</div>`).join('')}${LH.Q[m.id]?`<div class=row tabindex=0 data-h="q/${m.id}"><span class=ic>📝</span><b>Phase quiz</b><span class=mu>${q?q.s+'/'+q.n:'Not taken'}</span></div>`:''}</div>`}).join('')}
<button class="btn g r" id=rs>Reset this course</button></div>`;
document.querySelectorAll('.row').forEach(r=>r.onclick=()=>location.hash=r.dataset.h);
$('#rs').onclick=()=>{if(confirm('Reset all progress and quiz scores for '+c.title+'?')){sv(c,{t:{},q:{}});R()}}};
addEventListener('hashchange',R);R()};
