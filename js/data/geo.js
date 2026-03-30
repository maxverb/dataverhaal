// Simplified gemeente boundaries as polygon paths
// Coordinates: [lon, lat] normalized to 0-1 range per region
// Source: CBS gemeentegrenzen (simplified)

const GEO_BOUNDS={
  rijnmond:{minLon:3.85,maxLon:4.65,minLat:51.65,maxLat:52.0},
  west:{minLon:4.1,maxLon:4.85,minLat:51.95,maxLat:52.35},
  zuidholland:{minLon:3.85,maxLon:5.0,minLat:51.6,maxLat:52.35},
  nederland:{minLon:3.35,maxLon:7.25,minLat:50.75,maxLat:53.55},
};

// Simplified polygons per gemeente per region
// Each gemeente: {name, path:[[lon,lat],...]}
// These are approximate center+radius circles for now, upgraded to polygons when available

function makeGeoCircle(lon,lat,r,n){
  const pts=[];
  for(let i=0;i<n;i++){const a=Math.PI*2*i/n;pts.push([lon+Math.cos(a)*r,lat+Math.sin(a)*r*0.6]);}
  return pts;
}

const GEO_DATA={

rijnmond:[
  {name:'Rotterdam',path:makeGeoCircle(4.48,51.92,0.08,12)},
  {name:'Schiedam',path:makeGeoCircle(4.39,51.92,0.035,8)},
  {name:'Vlaardingen',path:makeGeoCircle(4.34,51.91,0.035,8)},
  {name:'Maassluis',path:makeGeoCircle(4.25,51.92,0.03,8)},
  {name:'Capelle aan den IJssel',path:makeGeoCircle(4.58,51.93,0.03,8)},
  {name:'Krimpen aan den IJssel',path:makeGeoCircle(4.60,51.91,0.025,8)},
  {name:'Lansingerland',path:makeGeoCircle(4.52,51.98,0.04,8)},
  {name:'Albrandswaard',path:makeGeoCircle(4.42,51.86,0.03,8)},
  {name:'Barendrecht',path:makeGeoCircle(4.53,51.86,0.03,8)},
  {name:'Ridderkerk',path:makeGeoCircle(4.60,51.87,0.03,8)},
  {name:'Nissewaard',path:makeGeoCircle(4.33,51.82,0.05,8)},
  {name:'Brielle',path:makeGeoCircle(4.17,51.90,0.03,8)},
  {name:'Hellevoetsluis',path:makeGeoCircle(4.13,51.83,0.04,8)},
  {name:'Westvoorne',path:makeGeoCircle(4.05,51.88,0.04,8)},
  {name:'Hoeksche Waard',path:makeGeoCircle(4.45,51.78,0.06,10)},
  {name:'Goeree-Overflakkee',path:makeGeoCircle(4.05,51.75,0.08,10)},
],

west:[
  {name:'Den Haag',path:makeGeoCircle(4.30,52.08,0.07,12)},
  {name:'Delft',path:makeGeoCircle(4.36,52.01,0.035,8)},
  {name:'Leiden',path:makeGeoCircle(4.49,52.16,0.04,8)},
  {name:'Zoetermeer',path:makeGeoCircle(4.49,52.06,0.04,8)},
  {name:'Westland',path:makeGeoCircle(4.22,52.02,0.05,8)},
  {name:'Rijswijk',path:makeGeoCircle(4.33,52.04,0.03,8)},
  {name:'Leidschendam-Voorburg',path:makeGeoCircle(4.39,52.08,0.03,8)},
  {name:'Wassenaar',path:makeGeoCircle(4.33,52.14,0.03,8)},
  {name:'Voorschoten',path:makeGeoCircle(4.43,52.13,0.025,8)},
  {name:'Oegstgeest',path:makeGeoCircle(4.47,52.18,0.02,8)},
  {name:'Katwijk',path:makeGeoCircle(4.42,52.20,0.03,8)},
  {name:'Noordwijk',path:makeGeoCircle(4.44,52.24,0.03,8)},
  {name:'Hillegom',path:makeGeoCircle(4.58,52.29,0.025,8)},
  {name:'Lisse',path:makeGeoCircle(4.55,52.26,0.025,8)},
  {name:'Teylingen',path:makeGeoCircle(4.50,52.22,0.03,8)},
  {name:'Midden-Delfland',path:makeGeoCircle(4.30,51.97,0.03,8)},
  {name:'Pijnacker-Nootdorp',path:makeGeoCircle(4.43,52.02,0.03,8)},
  {name:'Alphen aan den Rijn',path:makeGeoCircle(4.66,52.13,0.05,8)},
  {name:'Nieuwkoop',path:makeGeoCircle(4.78,52.15,0.04,8)},
  {name:'Bodegraven-Reeuwijk',path:makeGeoCircle(4.75,52.08,0.04,8)},
  {name:'Waddinxveen',path:makeGeoCircle(4.65,52.04,0.03,8)},
  {name:'Gouda',path:makeGeoCircle(4.71,52.01,0.035,8)},
  {name:'Zuidplas',path:makeGeoCircle(4.60,51.99,0.035,8)},
  {name:'Krimpenerwaard',path:makeGeoCircle(4.73,51.95,0.05,8)},
],

};

// Zuid-Holland = rijnmond + west combined
GEO_DATA.zuidholland=[...GEO_DATA.rijnmond,...GEO_DATA.west,
  {name:'Dordrecht',path:makeGeoCircle(4.67,51.81,0.05,8)},
  {name:'Zwijndrecht',path:makeGeoCircle(4.63,51.82,0.025,8)},
  {name:'Hendrik-Ido-Ambacht',path:makeGeoCircle(4.63,51.85,0.02,8)},
  {name:'Papendrecht',path:makeGeoCircle(4.69,51.83,0.02,8)},
  {name:'Sliedrecht',path:makeGeoCircle(4.77,51.83,0.025,8)},
  {name:'Hardinxveld-Giessendam',path:makeGeoCircle(4.84,51.83,0.03,8)},
  {name:'Gorinchem',path:makeGeoCircle(4.97,51.83,0.03,8)},
  {name:'Molenlanden',path:makeGeoCircle(4.88,51.88,0.05,8)},
];
