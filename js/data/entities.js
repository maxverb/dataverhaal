// ── ENTITEITEN PER OMROEP VOOR RELEVANTIE-SCORING ──

const MONITOR_ENTITIES={

rijnmond:{
  name:'Rijnmond',
  rss:'https://www.rijnmond.nl/rss/index.xml',
  gemeenten:['Rotterdam','Schiedam','Vlaardingen','Maassluis','Capelle aan den IJssel','Krimpen aan den IJssel','Lansingerland','Albrandswaard','Barendrecht','Ridderkerk','Nissewaard','Voorne aan Zee','Hoeksche Waard','Goeree-Overflakkee','Hellevoetsluis','Brielle','Westvoorne','Spijkenisse','Berkel en Rodenrijs','Bergschenhoek','Bleiswijk'],
  wijken:['Kralingen','Delfshaven','Feijenoord','Lombardijen','Ommoord','Pernis','Rozenburg','Overschie','Hillegersberg','Schiebroek','Charlois','IJsselmonde','Prins Alexander','Zuidwijk','Pendrecht','Katendrecht','Kop van Zuid','Crooswijk','Blijdorp','Nesselande','Carnisse','Afrikaanderwijk','Bospolder','Tussendijken','Cool','West-Kruiskade','Europoort','Botlek','Maasvlakte','Heijplaat'],
  personen:['Aboutaleb','Ahmed Aboutaleb','Carola Schouten','Marco Pastors','Joost Eerdmans','Leefbaar Rotterdam','Vincent Karremans','Bonte','Simons'],
  sport:['Feyenoord','Sparta Rotterdam','Sparta','Excelsior','SBV Excelsior','De Kuip','Stadion Feijenoord','Het Kasteel','Van Donge & De Roo Stadion','Arne Slot','Robin van Persie','Te Kloese','Dennis te Kloese'],
  landmarks:['Erasmusbrug','Euromast','Markthal Rotterdam','Markthal','SS Rotterdam','Rotterdam Ahoy','Ahoy','Diergaarde Blijdorp','Blijdorp','Hotel New York','Centraal Station Rotterdam','Willemsbrug','Koningshaven','De Hef','Luxor Theater','Luxor','Kunsthal','Museum Boijmans','Boijmans','Witte de Withstraat','Lijnbaan','Coolsingel','Grote Markt Rotterdam','Rivoli','Attractiepark Rotterdam','Havengebied','Maasvlakte','Europoort','World Port Center','Tropicana','Maeslantkering','Waterweg','Nieuwe Waterweg','Benelux Tunnel','Beneluxtunnel','Maastunnel','Brielse Meer','Oostvoornse Meer','Rockanje','Ouddorp'],
  overig:['010','Havenstad','havenstad','Randstadrail','RET','GGD Rijnmond','Rijnmondband','Erasmus MC','Erasmus Universiteit','Erasmus','Sophia Kinderziekenhuis','Ikazia','Maasstad Ziekenhuis','Maasstad','Franciscus Gasthuis','Havenbedrijf Rotterdam','Port of Rotterdam','Deltalinqs']
},

west:{
  name:'Omroep West',
  rss:'https://www.omroepwest.nl/rss/index.xml',
  gemeenten:['Den Haag','Delft','Leiden','Zoetermeer','Westland','Rijswijk','Leidschendam-Voorburg','Leidschendam','Voorburg','Wassenaar','Voorschoten','Oegstgeest','Katwijk','Noordwijk','Hillegom','Lisse','Teylingen','Midden-Delfland','Pijnacker-Nootdorp','Pijnacker','Nootdorp','Alphen aan den Rijn','Nieuwkoop','Bodegraven-Reeuwijk','Bodegraven','Reeuwijk','Waddinxveen','Gouda','Zuidplas','Krimpenerwaard','Kaag en Braassem','Leiderdorp','Zoeterwoude','Sassenheim','Voorhout','Warmond','Naaldwijk','Monster','Wateringen','Kwintsheul'],
  wijken:['Scheveningen','Loosduinen','Laak','Transvaal','Ypenburg','Leidschenveen','Bezuidenhout','Benoordenhout','Statenkwartier','Archipel','Duinoord','Regentessekwartier','Schilderswijk','Moerwijk','Morgenstond','Bouwlust','Vrederust','Escamp','Mariahoeve','Haagse Hout','Binckhorst','Kijkduin','Houtwijk','Segbroek','Bohemen','Waldeck','Vogelwijk','Belgisch Park','Bollenstreek'],
  personen:['Jan van Zanen','Van Zanen','Marja van Bijsterveldt','Liesbeth Spies','Charlie Aptroot','Richard de Mos','Hart voor Den Haag','Pieter van Aartsen'],
  sport:['ADO Den Haag','ADO','Cars Jeans Stadion','Bingoal Stadion','Quick Boys','Alphense Boys','FC Lisse','Haaglandse Golfclub','RKAVV'],
  landmarks:['Binnenhof','Vredespaleis','Madurodam','Pier Scheveningen','De Pier','Kurhaus','Mall of the Netherlands','Mall of NL','Grote Kerk Den Haag','Haagse Toren','Huis ten Bosch','Paleis Noordeinde','Noordeinde','Panorama Mesdag','Gemeentemuseum','Kunstmuseum Den Haag','Omniversum','AFAS Circustheater','World Forum','Lange Voorhout','Hofvijver','Passage Den Haag','Keukenhof','Space Expo','Corpus','Archeon','Duinrell','Wassenaarseslag','Meijendel','Kaag','Kagerplassen','Leidse Hout','Pieterskerk Leiden','Universiteit Leiden','TU Delft','Bieslandse Bos','Delftse Hout','Oostpoort Delft'],
  overig:['070','Hofstad','hofstad','Residentie','residentie','HTM','Randstadrail','GGD Haaglanden','Haaglanden','HMC','Haga Ziekenhuis','Haga','LUMC','Reinier de Graaf','Groene Hart Ziekenhuis','Alrijne','Ridderzaal','Prinsjesdag']
}

};

// All RSS feeds
const MONITOR_FEEDS=[
  {id:'l1',name:'L1',url:'https://www.l1nieuws.nl/rss/index.xml'},
  {id:'west',name:'Omroep West',url:'https://www.omroepwest.nl/rss/index.xml'},
  {id:'rijnmond',name:'Rijnmond',url:'https://www.rijnmond.nl/rss/index.xml'},
  {id:'drenthe',name:'RTV Drenthe',url:'https://www.rtvdrenthe.nl/rss/index.xml'},
  {id:'gld',name:'Omroep Gelderland',url:'https://www.gld.nl/rss/index.xml'},
  {id:'noord',name:'RTV Noord',url:'https://www.rtvnoord.nl/rss/index.xml'},
  {id:'zeeland',name:'Omroep Zeeland',url:'https://www.omroepzeeland.nl/rss/nieuws.xml'},
  {id:'oost',name:'RTV Oost',url:'https://www.oost.nl/rss/nieuws.xml'},
  {id:'fryslan',name:'Omroep Fryslân',url:'https://www.omropfryslan.nl/rss/nieuws.xml'},
  {id:'utrecht',name:'RTV Utrecht',url:'https://www.rtvutrecht.nl/rss/nieuws.xml'},
];
