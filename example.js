var map = L.map('map', {
  center: [44.327,-72.888],
  zoom: 12,
  zoomControl: false
});

var url  = window.xyz_tile_source_url;

var colors = {
  base: '#f7ecdc',
  land: '#f7ecdc',
  water: '#357abf',
  grass: '#E6F2C1',
  beach: '#FFEEC7',
  park: '#a5af6e',
  cemetery: '#D6DED2',
  wooded: '#C3D9AD',
  agriculture: '#F2E8B6',
  building: '#b3bdc4',
  hospital: 'rgb(229,198,195)',
  school: '#FFF5CC',
  sports: '#B8E6B8',
  residential: '#f7ecdc',
  commercial: '#f7ecdc',
  industrial: '#f7ecdc',
  parking: '#EEE',
  big_road: '#673919',
  little_road: '#b29176',
  railway: '#ef7369'
};

L.tileLayer.hoverboard(url, {hidpiPolyfill: true})

  .render('landuse')
    .minZoom(12)
    .fillBy('kind', {
      allotments: colors.base,
      apron: colors.base,
      cemetery: colors.cemetery,
      cinema: colors.base,
      college: colors.school,
      commercial: colors.industrial,
      common: colors.residential,
      farm: colors.park,
      farmland: colors.park,
      farmyard: colors.park,
      footway: colors.little_road,
      forest: colors.park,
      fuel: colors.base,
      garden: colors.park,
      glacier: colors.water,
      golf_course: colors.sports,
      grass: colors.park,
      hospital: colors.hospital,
      industrial: colors.industrial,
      land: colors.land,
      library: colors.school,
      meadow: colors.park,
      nature_reserve: colors.park,
      park: colors.park,
      parking: colors.parking,
      pedestrian: colors.little_road,
      pitch: colors.base,
      place_of_worship: colors.base,
      playground: colors.sports,
      quarry: colors.industrial,
      railway: colors.railway,
      recreation_ground: colors.park,
      residential: colors.residential,
      retail: colors.industrial,
      runway: colors.base,
      school: colors.school,
      scrub: colors.park,
      sports_centre: colors.sports,
      stadium: colors.sports,
      taxiway: colors.little_road,
      theatre: colors.industrial,
      university: colors.school,
      village_green: colors.park,
      wetland: colors.water,
      wood: colors.wooded,
      urban_area: colors.residential,
      park: colors.park,
      protected: colors.park,
      protected_area: colors.park
    })

  .render('roads')
    .where('kind', ['major_road', 'highway', 'rail'])
    .stroke(1.75, 'rgba(255, 255, 255, 0.5)')
    .stroke(0.75, colors.big_road)

  .render('roads')
    .where('kind', ['minor_road', 'path'])
    .stroke(1, 'rgba(255, 255, 255, 0.5)')
    .stroke(0.5, colors.little_road)

  .render('buildings')
    .fill('#888896')
    .stroke(0.5, 'rgba(0,0,0,0.4)')

  .render('water')
    .fill(colors.water)
    .stroke(1, colors.water)

  .addTo(map);

var hash = L.hash(map);
