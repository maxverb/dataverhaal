// Municipality grid cartograms per region
// Each entry: [name, col, row] — col=west→east, row=north→south

const MAP_DATA={

rijnmond:{name:'Rijnmond',cols:8,rows:7,gems:[
  ['Lansingerland',5,0],
  ['Capelle aan den IJssel',5,1],
  ['Krimpen aan den IJssel',6,1],
  ['Maassluis',1,1],
  ['Vlaardingen',2,1],
  ['Schiedam',3,1],
  ['Rotterdam',4,1],
  ['Ridderkerk',6,2],
  ['Albrandswaard',4,2],
  ['Barendrecht',5,2],
  ['Westvoorne',0,3],
  ['Brielle',1,3],
  ['Nissewaard',3,3],
  ['Hoeksche Waard',5,3],
  ['Hellevoetsluis',1,4],
  ['Goeree-Overflakkee',0,5],
]},

west:{name:'Omroep West',cols:7,rows:8,gems:[
  ['Noordwijk',2,0],
  ['Katwijk',1,0],
  ['Hillegom',3,0],
  ['Lisse',3,1],
  ['Teylingen',2,1],
  ['Oegstgeest',1,1],
  ['Leiden',1,2],
  ['Voorschoten',1,3],
  ['Wassenaar',0,3],
  ['Leidschendam-Voorburg',1,4],
  ['Den Haag',0,4],
  ['Rijswijk',1,5],
  ['Delft',2,5],
  ['Midden-Delfland',2,4],
  ['Westland',0,6],
  ['Pijnacker-Nootdorp',3,4],
  ['Zoetermeer',3,3],
  ['Alphen aan den Rijn',3,2],
  ['Nieuwkoop',4,2],
  ['Bodegraven-Reeuwijk',5,2],
  ['Waddinxveen',4,3],
  ['Gouda',5,3],
  ['Zuidplas',4,4],
  ['Krimpenerwaard',5,4],
]},

zuidholland:{name:'Zuid-Holland',cols:9,rows:10,gems:[
  // Noord (Omroep West gebied)
  ['Noordwijk',3,0],
  ['Katwijk',2,0],
  ['Hillegom',4,0],
  ['Lisse',4,1],
  ['Teylingen',3,1],
  ['Oegstgeest',2,1],
  ['Leiden',2,2],
  ['Voorschoten',2,3],
  ['Wassenaar',1,3],
  ['Leidschendam-Voorburg',2,4],
  ['Den Haag',1,4],
  ['Rijswijk',2,5],
  ['Delft',3,5],
  ['Midden-Delfland',3,4],
  ['Westland',1,6],
  ['Pijnacker-Nootdorp',4,4],
  ['Zoetermeer',4,3],
  ['Alphen aan den Rijn',4,2],
  ['Nieuwkoop',5,2],
  ['Bodegraven-Reeuwijk',6,2],
  ['Waddinxveen',5,3],
  ['Gouda',6,3],
  ['Zuidplas',5,4],
  ['Krimpenerwaard',6,4],
  // Rijnmond
  ['Lansingerland',5,5],
  ['Maassluis',2,6],
  ['Vlaardingen',3,6],
  ['Schiedam',4,6],
  ['Rotterdam',5,6],
  ['Capelle aan den IJssel',6,5],
  ['Krimpen aan den IJssel',7,5],
  ['Albrandswaard',5,7],
  ['Barendrecht',6,7],
  ['Ridderkerk',7,7],
  ['Westvoorne',1,7],
  ['Brielle',2,7],
  ['Nissewaard',4,7],
  ['Hoeksche Waard',6,8],
  ['Hellevoetsluis',2,8],
  ['Goeree-Overflakkee',0,9],
  // Drechtsteden
  ['Dordrecht',7,8],
  ['Zwijndrecht',7,7],
  ['Hendrik-Ido-Ambacht',7,6],
  ['Papendrecht',8,7],
  ['Sliedrecht',8,6],
  ['Hardinxveld-Giessendam',8,5],
  ['Gorinchem',8,4],
  ['Molenlanden',7,4],
]},

nederland:{name:'Nederland',cols:9,rows:14,gems:[
  // Groningen
  ['Groningen',7,0],
  // Friesland
  ['Leeuwarden',5,0],
  // Drenthe
  ['Assen',7,1],['Emmen',8,2],
  // Overijssel
  ['Zwolle',6,2],['Enschede',8,3],['Deventer',7,3],
  // Flevoland
  ['Almere',5,3],['Lelystad',5,2],
  // Gelderland
  ['Arnhem',7,4],['Nijmegen',7,5],['Apeldoorn',7,3],['Ede',6,4],
  // Utrecht
  ['Utrecht',5,4],['Amersfoort',6,3],
  // Noord-Holland
  ['Amsterdam',4,3],['Haarlem',3,3],['Alkmaar',3,1],['Zaanstad',4,2],['Hilversum',5,3],['Haarlemmermeer',4,4],['Den Helder',2,0],
  // Zuid-Holland
  ['Den Haag',3,5],['Rotterdam',4,6],['Leiden',3,4],['Dordrecht',5,7],['Zoetermeer',4,5],['Delft',3,6],['Gouda',5,5],['Schiedam',4,6],['Vlaardingen',3,6],['Alphen aan den Rijn',4,5],['Westland',2,6],
  // Zeeland
  ['Middelburg',1,7],['Goes',2,7],['Terneuzen',1,8],
  // Noord-Brabant
  ['Eindhoven',6,7],['Tilburg',5,7],["'s-Hertogenbosch",6,6],['Breda',4,7],['Helmond',7,7],['Roosendaal',3,8],
  // Limburg
  ['Maastricht',7,9],['Heerlen',8,9],['Venlo',8,7],['Roermond',8,8],['Sittard-Geleen',7,9],
]}

};

// Aliases for fuzzy matching
const MAP_ALIASES={
  "'s-gravenhage":'Den Haag',
  "the hague":'Den Haag',
  "s-gravenhage":'Den Haag',
  "'s-hertogenbosch":"'s-Hertogenbosch",
  "den bosch":"'s-Hertogenbosch",
};
