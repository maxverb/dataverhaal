// ── AUTO TEXT SUGGESTIONS ──────────────────────────────────────────────────

function suggestText(){
  if(!S.data.length)return;
  const ci=S.cols[0]||0;
  const vals=S.data.map(d=>d.values[ci]||0);
  const labels=S.data.map(d=>d.label);
  const n=vals.length;

  const maxI=vals.indexOf(Math.max(...vals));
  const minI=vals.indexOf(Math.min(...vals));
  const total=vals.reduce((s,v)=>s+v,0);
  const avg=total/n;
  const first=vals[0], last=vals[n-1];
  const change=first?((last-first)/first*100):0;

  // Detect if labels look like dates/years
  const isTime=labels.every(l=>/^\d{4}$/.test(l)||/\d{1,2}[\/\-]\d{1,2}/.test(l)||/^\d{4}[\/\-]/.test(l));

  // Eyebrow
  const now=new Date();
  const MND=['JANUARI','FEBRUARI','MAART','APRIL','MEI','JUNI','JULI','AUGUSTUS','SEPTEMBER','OKTOBER','NOVEMBER','DECEMBER'];
  document.getElementById('eyebrow').value=`ANALYSE · ${MND[now.getMonth()]} ${now.getFullYear()}`;

  // Title
  let title='';
  if(isTime&&n>=3){
    if(Math.abs(change)>=5){
      const dir=change>0?'stijging':'daling';
      title=`${Math.abs(Math.round(change))}% ${dir} van ${shortLabel(labels[0])} tot ${shortLabel(labels[n-1])}`;
    } else {
      title=`Stabiel rond ${fmtN(Math.round(avg))} over ${n} periodes`;
    }
  } else {
    title=`${shortLabel(labels[maxI])} scoort het hoogst met ${fmtN(vals[maxI])}`;
  }
  document.getElementById('ttl').value=title;

  // Subtitle
  let sub='';
  if(isTime){
    sub=`Piek bij ${shortLabel(labels[maxI])} (${fmtN(vals[maxI])}), laagste bij ${shortLabel(labels[minI])} (${fmtN(vals[minI])})`;
  } else {
    const topN=Math.min(3,n);
    const sorted=[...vals].map((v,i)=>({v,l:labels[i]})).sort((a,b)=>b.v-a.v);
    sub=`Top ${topN}: ${sorted.slice(0,topN).map(s=>s.l).join(', ')}`;
  }
  document.getElementById('sub').value=sub;

  sched();
}
