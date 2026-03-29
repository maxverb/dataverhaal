// ── CHART REGISTRY ────────────────────────────────────────────────────────
const CHARTS={};
function registerChart(id,opts){ CHARTS[id]=opts; }

// ── CONSTANTS ──────────────────────────────────────────────────────────────
const PAL = {
  blauw:   {name:'Blauw',   sw:'linear-gradient(135deg,#1B4F8A 0%,#60A5FA 100%)', bg:'#F8F9FC',text:'#0D1117',muted:'#6B7280',bars:['#1B4F8A','#2563EB','#3B82F6','#60A5FA','#93C5FD','#BFDBFE'],acc:'#1B4F8A'},
  rood:    {name:'Rood',    sw:'linear-gradient(135deg,#B91C1C 0%,#F87171 100%)', bg:'#FAFAFA', text:'#0D1117',muted:'#6B7280',bars:['#B91C1C','#DC2626','#EF4444','#F87171','#FCA5A5','#FEE2E2'],acc:'#B91C1C'},
  groen:   {name:'Groen',   sw:'linear-gradient(135deg,#065F46 0%,#34D399 100%)', bg:'#F0FDF9', text:'#0D1117',muted:'#6B7280',bars:['#065F46','#047857','#059669','#10B981','#34D399','#6EE7B7'],acc:'#065F46'},
  oranje:  {name:'Oranje',  sw:'linear-gradient(135deg,#92400E 0%,#FCD34D 100%)', bg:'#FFFBF0', text:'#0D1117',muted:'#6B7280',bars:['#92400E','#B45309','#D97706','#F59E0B','#FCD34D','#FDE68A'],acc:'#B45309'},
  paars:   {name:'Paars',   sw:'linear-gradient(135deg,#4C1D95 0%,#A78BFA 100%)', bg:'#FAF5FF', text:'#0D1117',muted:'#6B7280',bars:['#4C1D95','#5B21B6','#7C3AED','#8B5CF6','#A78BFA','#C4B5FD'],acc:'#5B21B6'},
  donker:  {name:'Donker',  sw:'linear-gradient(135deg,#0F172A 0%,#334155 100%)', bg:'#0F172A', text:'#F1F5F9',muted:'#94A3B8',bars:['#38BDF8','#34D399','#FBBF24','#F472B6','#A78BFA','#6EE7B7'],acc:'#38BDF8'},
  rijnmond:{name:'Rijnmond',sw:'linear-gradient(135deg,#006aac 0%,#e2f5ff 100%)',bg:'#ffffff',text:'#0D1117',muted:'#6B7280',bars:['#006aac','#4d9fd4','#8ac4e6','#b3daf0','#e2f5ff','#006aac'],acc:'#006aac'},
  west:    {name:'West',    sw:'linear-gradient(135deg,#234d9d 0%,#d7004d 100%)', bg:'#ffffff',text:'#0D1117',muted:'#6B7280',bars:['#234d9d','#d7004d','#b8d5e0','#5a7fc4','#e8668a','#234d9d'],acc:'#234d9d'},
  dhfm:    {name:'DHFM',    sw:'linear-gradient(135deg,#c1d72e 0%,#5d5f5e 100%)', bg:'#ffffff',text:'#0D1117',muted:'#6B7280',bars:['#c1d72e','#5d5f5e','#f3e83c','#a0b525','#8a8c8b','#c1d72e'],acc:'#5d5f5e'},
};

const FMT = {
  ig_post:  {w:1080,h:1350,label:'IG Post 4:5',  ratio:'4:5'},
  ig_sq:    {w:1080,h:1080,label:'IG Vierkant',  ratio:'1:1'},
  story:    {w:1080,h:1920,label:'Story',         ratio:'9:16'},
  slide:    {w:1920,h:1080,label:'Slide 16:9',    ratio:'16:9'},
};

// Layout is fixed to 'lijn'

// ── STATE ──────────────────────────────────────────────────────────────────
const S = {
  data:[],
  colNames:[],
  cols:[0],
  highlight:null,
  customClr:null,
  ct:'bar',
  pal:'blauw',
  lay:'lijn',
  fmt:'ig_post',
};

let rt=null, fontsOK=false;
