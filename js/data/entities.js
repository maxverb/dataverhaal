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
},

gld:{
  name:'Omroep Gelderland',
  rss:'https://www.gld.nl/rss/index.xml',
  gemeenten:['Arnhem','Nijmegen','Apeldoorn','Ede','Doetinchem','Zutphen','Tiel','Harderwijk','Wageningen','Barneveld','Elburg','Ermelo','Putten','Nunspeet','Hattem','Heerde','Epe','Voorst','Brummen','Lochem','Berkelland','Winterswijk','Aalten','Oost Gelre','Bronckhorst','Montferland','Oude IJsselstreek','Zevenaar','Duiven','Westervoort','Overbetuwe','Lingewaard','Renkum','Rheden','Rozendaal','Berg en Dal','Heumen','Wijchen','Beuningen','Druten','West Maas en Waal','Neder-Betuwe','Culemborg','West Betuwe','Rivierenland'],
  wijken:['Velp','Oosterbeek','Doorwerth','Wolfheze','Malburgen','Presikhaaf','Klarendal','Spijkerkwartier','Geitenkamp','Kronenburg','Lent','Dukenburg','Lindenholt','Hatert','Brakkenstein','Bottendaal','Benedenstad','Hengelo','Zelhem','Vorden','Eerbeek','Dieren','De Steeg','Elst','Bemmel','Huissen','Angeren','Gendt','Driel','Heveadorp'],
  personen:['Ahmed Marcouch','Marcouch','Hubert Bruls','Bruls','Ton Heerts'],
  sport:['Vitesse','NEC','NEC Nijmegen','De Graafschap','AGOVV','GelreDome','Goffertstadion','Stadion De Vijverberg','VVOG','Go Ahead Eagles'],
  landmarks:['Burgers Zoo','Burgers\' Zoo','Openluchtmuseum','Nederlands Openluchtmuseum','Kröller-Müller','Kröller-Müller Museum','Park Sonsbeek','Sonsbeek','Musis Sacrum','Eusebius','Eusebiuskerk','John Frostbrug','Arnhem Centraal','Hoge Veluwe','De Hoge Veluwe','Posbank','Veluwezoom','Apenheul','Paleis Het Loo','Het Loo','Julianatoren','Koningspaleis','Walibi','Walibi Holland','Valkhof','Museum Het Valkhof','Doornroosje','LUX Nijmegen','Waalbrug','Rijn','Waal','IJssel','Betuwe','Veluwe','Achterhoek','Rivierenland'],
  overig:['026','Breng','Connexxion','GGD Gelderland','Rijnstate','Radboudumc','Radboud','CWZ','Slingeland','Gelre ziekenhuizen','Gelre','Hogeschool Arnhem Nijmegen','HAN','Wageningen University','WUR','Provincie Gelderland']
},

brabant:{
  name:'Omroep Brabant',
  rss:'https://www.omroepbrabant.nl/rss',
  gemeenten:['Eindhoven','Tilburg','Breda','Den Bosch','\'s-Hertogenbosch','Hertogenbosch','Helmond','Oss','Roosendaal','Bergen op Zoom','Waalwijk','Uden','Veghel','Meierijstad','Oosterhout','Dongen','Gilze en Rijen','Goirle','Hilvarenbeek','Oisterwijk','Loon op Zand','Heusden','Altena','Geertruidenberg','Drimmelen','Moerdijk','Halderberge','Rucphen','Etten-Leur','Zundert','Baarle-Nassau','Alphen-Chaam','Woensdrecht','Steenbergen','Bernheze','Boekel','Landerd','Sint-Michielsgestel','Boxtel','Best','Son en Breugel','Nuenen','Geldrop-Mierlo','Geldrop','Laarbeek','Gemert-Bakel','Asten','Someren','Deurne','Cranendonck','Eersel','Bladel','Reusel-De Mierden','Bergeijk','Valkenswaard','Heeze-Leende','Veldhoven','Waalre','Vught','Boxmeer','Land van Cuijk','Cuijk','Grave','Mill'],
  wijken:['Strijp','Woensel','Stratum','Gestel','Tongelre','Acht','Meerhoven','De Bergen','Binnenstad Breda','Princenhage','Teteringen','Reeshof','Berkel-Enschot','Udenhout','De Pettelaar','Rosmalen','Hintham','Kruiskamp','Binnenstad Den Bosch'],
  personen:['Jeroen Dijsselbloem','John Jorritsma','Paul Depla','Jack Mikkers','Theo Weterings'],
  sport:['PSV','PSV Eindhoven','Willem II','NAC','NAC Breda','FC Den Bosch','FC Eindhoven','RKC Waalwijk','RKC','TOP Oss','Philips Stadion','Koning Willem II Stadion','Rat Verlegh Stadion','Peter Bosz','De Mos','Noa Lang'],
  landmarks:['Efteling','De Efteling','Van Gogh Museum','Vincentre','Van Abbemuseum','Philips Museum','DAF Museum','Evoluon','Glow Eindhoven','Strijp-S','Brainport','High Tech Campus','ASML','Brabanthallen','013','Mezz','Chassé Theater','Chassé','Markiezenhof','Sint-Janskathedraal','Sint-Jan','Jeroen Bosch','De Peel','Biesbosch','Loonse en Drunense Duinen','Oisterwijk Vennen','Kampina','Strabrechtse Heide','Kempen','Grote Markt Breda','Piazza Eindhoven','Dommel','Mark','Aa','Maas'],
  overig:['040','Lichtstad','lichtstad','Brainport','brainport','GGD Brabant','Hermes','Arriva','Bravis','Amphia','Elisabeth-TweeSteden','ETZ','Catharina Ziekenhuis','Catharina','Jeroen Bosch Ziekenhuis','JBZ','Máxima Medisch Centrum','MMC','Fontys','TU Eindhoven','TU/e','Avans','NHTV','Breda University','Tilburg University','Provincie Brabant','Noord-Brabant']
},

zeeland:{
  name:'Omroep Zeeland',
  rss:'https://www.omroepzeeland.nl/rss/nieuws.xml',
  gemeenten:['Middelburg','Vlissingen','Goes','Terneuzen','Hulst','Sluis','Veere','Schouwen-Duiveland','Tholen','Reimerswaal','Kapelle','Borsele','Noord-Beveland','Zierikzee','Renesse','Domburg','Westkapelle','Breskens','Cadzand','Yerseke','Kruiningen','Hansweert','Kortgene','Wissenkerke','Arnemuiden','Koudekerke','Oostkapelle','Aardenburg','Axel','Sas van Gent','Philippine','Brouwershaven','Bruinisse','Sint-Maartensdijk','Stavenisse'],
  wijken:['Souburg','Oost-Souburg','Nieuw- en Sint Joosland','Ritthem','Serooskerke','Gapinge','Aagtekerke','Biggekerke','Meliskerke','Zoutelande','Dishoek'],
  personen:['Han Polman','Harald Bergmann','Marga Vermue'],
  sport:['FC Vlissingen','Hoek','Goes','JVOZ','Kloetinge','Zeelandia Middelburg'],
  landmarks:['Deltawerken','Oosterscheldekering','Zeelandbrug','Neeltje Jans','Watersnoodmuseum','Lange Jan','Abbey Middelburg','Abdij Middelburg','Abdij','Veerse Meer','Veerse Gatdam','Grevelingenmeer','Westerscheldetunnel','Arsenaal Vlissingen','Het Arsenaal','Slot Moermond','Stadhuismuseum Zierikzee','Terra Maris','Polderhuis Westkapelle','Boulevard Vlissingen','Nollestrand','Cadzand-Bad','Mini Mundi','Deltapark','Zeeuws Museum'],
  overig:['0118','Connexxion','Westerschelde','Oosterschelde','Veerse Meer','Grevelingen','GGD Zeeland','ADRZ','Admiraal de Ruyter Ziekenhuis','HZ University','HZ','UCR','Zeeuws-Vlaanderen','Walcheren','Zuid-Beveland','Noord-Beveland','Schouwen','Duiveland','Tholen','Sint-Philipsland','Provincie Zeeland']
},

l1:{
  name:'L1',
  rss:'https://www.l1nieuws.nl/rss/index.xml',
  gemeenten:['Maastricht','Heerlen','Sittard-Geleen','Sittard','Geleen','Venlo','Roermond','Weert','Kerkrade','Landgraaf','Brunssum','Stein','Beek','Meerssen','Valkenburg aan de Geul','Valkenburg','Gulpen-Wittem','Vaals','Eijsden-Margraten','Simpelveld','Nuth','Onderbanken','Schinnen','Sittard-Geleen','Born','Susteren','Echt-Susteren','Maasgouw','Leudal','Nederweert','Peel en Maas','Venray','Horst aan de Maas','Beesel','Bergen','Gennep','Mook en Middelaar'],
  wijken:['Wyck','Céramique','Jekerkwartier','Boschstraatkwartier','Heuvelland','Randwyck','Scharn','Amby','Wolder','Heugem','Borgharen','Itteren','Malberg','Caberg','Mariaberg','Daalhof','Pottenberg','Hoensbroek','Schaesberg','Nieuwenhagen','Bocholtz','Eygelshoven','Chevremont','Bleijerheide','Terwinselen'],
  personen:['Annemarie Penn-te Strake','Penn-te Strake','Emile Roemer'],
  sport:['Roda JC','Roda','MVV','MVV Maastricht','Fortuna Sittard','Fortuna','VVV-Venlo','VVV','Parkstad Limburg Stadion','De Geusselt','Fortuna Sittard Stadion','MECC'],
  landmarks:['Bonnefantenmuseum','Bonnefanten','Sint-Servaasbasiliek','Sint Servaas','Onze-Lieve-Vrouwebasiliek','Vrijthof','Markt Maastricht','Sint-Pietersberg','Fort Sint Pieter','Grotten Valkenburg','Drielandenpunt','GaiaZoo','Mondo Verde','Snowworld','Kasteel Hoensbroek','Thermenmuseum','Maasmechelen Village','Designer Outlet Roermond','Outlet Roermond','Maas','Geul','Heuvelland','Mergelland'],
  overig:['043','Arriva','GGD Zuid-Limburg','GGD Limburg-Noord','MUMC+','Maastricht UMC','Zuyderland','Zuyderland Medisch Centrum','VieCuri','Laurentius','Universiteit Maastricht','Zuyd Hogeschool','Zuyd','Fontys Venlo','Brightlands','Chemelot','Maastricht Aachen Airport','MAA','Provincie Limburg','Limburgs','Limburgse','Parkstad']
},

noord:{
  name:'RTV Noord',
  rss:'https://www.rtvnoord.nl/rss/index.xml',
  gemeenten:['Groningen','Assen','Emmen','Delfzijl','Appingedam','Veendam','Stadskanaal','Winschoten','Hoogezand','Leek','Haren','Het Hogeland','Westerkwartier','Midden-Groningen','Oldambt','Westerwolde','Pekela','Eemsdelta','Loppersum','Bedum','Ten Boer','Zuidhorn','Marum','Grootegast','Winsum','De Marne','Eemsmond','Delfzijl','Bellingwedde','Vlagtwedde','Scheemda','Menterwolde','Slochteren','Hooglede'],
  wijken:['Paddepoel','Vinkhuizen','Beijum','Lewenborg','Helpman','Haren','Hoogkerk','Stad','Binnenstad Groningen','Europapark','Meerstad','Reitdiep','Selwerd','Korrewegwijk','Oosterpoort','Rivierenbuurt','Corpus den Hoorn','De Wijert'],
  personen:['Koen Schuiling','Marco Out'],
  sport:['FC Groningen','FC Emmen','Euroborg','De Oude Meerdijk','SC Veendam','Be Quick 1887'],
  landmarks:['Martinitoren','Martini','Groninger Museum','Forum Groningen','Forum','Noorderplantsoen','Grote Markt Groningen','Vismarkt','Stadspark','Eemshaven','Eems','Lauwersmeer','Lauwerszee','Bourtange','Waddengebied','Dollard','Blauwestad','Hunebedcentrum','Drentse Aa','Hondsrug'],
  overig:['050','Qbuzz','Arriva','GGD Groningen','UMCG','Martini Ziekenhuis','Ommelander Ziekenhuis','Rijksuniversiteit Groningen','RUG','Hanzehogeschool','Hanze','Groningen Airport Eelde','Eelde','Provincie Groningen','Ommelanden','Ommeland']
},

oost:{
  name:'RTV Oost',
  rss:'https://www.oost.nl/rss/nieuws.xml',
  gemeenten:['Zwolle','Enschede','Deventer','Almelo','Hengelo','Kampen','Hardenberg','Raalte','Olst-Wijhe','Dalfsen','Ommen','Staphorst','Steenwijkerland','Zwartewaterland','Hellendoorn','Rijssen-Holten','Wierden','Twenterand','Tubbergen','Dinkelland','Oldenzaal','Losser','Haaksbergen','Hof van Twente','Borne'],
  wijken:['Stadshagen','Wipstrik','Assendorp','Berkum','Holtenbroek','Aa-landen','Dieze','Wesselerbrink','Hogeland','Roombeek','Lonneker','Glanerbrug','Boekelo','Colmschate','Bathmen','Borgele','Schalkhaar'],
  personen:['Peter Snijders','Roelof Bleker'],
  sport:['FC Twente','PEC Zwolle','Heracles Almelo','Heracles','De Grolsch Veste','MAC3PARK Stadion','Erve Asito','Go Ahead Eagles'],
  landmarks:['Fundatie','Museum de Fundatie','Sassenpoort','Grote Kerk Zwolle','Peperbus','De Waag Deventer','Lebuinuskerk','Bergkerk','Rijksmuseum Twenthe','Overijssels Museum','Enschede Markt','Oude Markt Enschede','Hoge Hexel','Sallandse Heuvelrug','Lemelerberg','Weerribben-Wieden','Giethoorn','Vecht','IJssel','Regge','Dinkel','Twentekanaal'],
  overig:['038','074','053','Keolis','Arriva','GGD Twente','GGD IJsselland','Isala','Isala Klinieken','MST','Medisch Spectrum Twente','ZGT','Ziekenhuisgroep Twente','Deventer Ziekenhuis','Saxion','Universiteit Twente','Windesheim','Provincie Overijssel','Overijssel','Twente','Salland','Kop van Overijssel']
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
  {id:'brabant',name:'Omroep Brabant',url:'https://www.omroepbrabant.nl/rss'},
  {id:'nh',name:'NH Nieuws',url:'https://rss.nhnieuws.nl/rss'},
  {id:'flevoland',name:'Omroep Flevoland',url:'https://www.omroepflevoland.nl/RSS/rss.aspx'},
  {id:'nos',name:'NOS',url:'https://feeds.nos.nl/nosnieuwsalgemeen'},
];
