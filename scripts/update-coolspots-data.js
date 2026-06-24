#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_FILE = path.join(ROOT_DIR, 'coolspots-data.json');
const CACHE_DIR = path.join(ROOT_DIR, '.cache');
const COOLING_CSV_FILES = [
  path.join(ROOT_DIR, 'coolspots_brussels_complet.csv'),
  path.join(ROOT_DIR, 'coolspots_cooling_points.csv')
];
const REGION_BBOX = '50.772,4.255,50.913,4.455';
const [REGION_SOUTH, REGION_WEST, REGION_NORTH, REGION_EAST] = REGION_BBOX.split(',').map(Number);
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];
const COMMUNES = [
  { slug: 'anderlecht', label: 'Anderlecht', aliases: ['anderlecht'], lat: 50.836, lon: 4.307, radiusKm: 3.2 },
  { slug: 'auderghem', label: 'Auderghem', aliases: ['auderghem', 'oudergem'], lat: 50.815, lon: 4.434, radiusKm: 2.8 },
  { slug: 'berchem', label: 'Berchem-Sainte-Agathe', aliases: ['berchem-sainte-agathe', 'sint-agatha-berchem'], lat: 50.864, lon: 4.289, radiusKm: 2.1 },
  { slug: 'bruxelles', label: 'Bruxelles-Ville', aliases: ['bruxelles', 'brussel', 'bruxelles-ville', 'stad brussel', 'ville de bruxelles'], lat: 50.847, lon: 4.352, radiusKm: 4.6 },
  { slug: 'etterbeek', label: 'Etterbeek', aliases: ['etterbeek'], lat: 50.836, lon: 4.389, radiusKm: 2.3 },
  { slug: 'evere', label: 'Evere', aliases: ['evere'], lat: 50.874, lon: 4.400, radiusKm: 2.4 },
  { slug: 'forest', label: 'Forest', aliases: ['forest', 'vorst'], lat: 50.817, lon: 4.326, radiusKm: 2.8 },
  { slug: 'ganshoren', label: 'Ganshoren', aliases: ['ganshoren'], lat: 50.875, lon: 4.310, radiusKm: 2.0 },
  { slug: 'ixelles', label: 'Ixelles', aliases: ['ixelles', 'elsene'], lat: 50.827, lon: 4.372, radiusKm: 2.7 },
  { slug: 'jette', label: 'Jette', aliases: ['jette'], lat: 50.879, lon: 4.326, radiusKm: 2.6 },
  { slug: 'koekelberg', label: 'Koekelberg', aliases: ['koekelberg'], lat: 50.863, lon: 4.327, radiusKm: 1.7 },
  { slug: 'molenbeek', label: 'Molenbeek-Saint-Jean', aliases: ['molenbeek-saint-jean', 'sint-jans-molenbeek', 'molenbeek'], lat: 50.854, lon: 4.326, radiusKm: 2.8 },
  { slug: 'saint-gilles', label: 'Saint-Gilles', aliases: ['saint-gilles', 'sint-gillis'], lat: 50.830, lon: 4.346, radiusKm: 2.1 },
  { slug: 'saint-josse', label: 'Saint-Josse-ten-Noode', aliases: ['saint-josse-ten-noode', 'sint-joost-ten-node', 'saint-josse'], lat: 50.856, lon: 4.373, radiusKm: 1.5 },
  { slug: 'schaerbeek', label: 'Schaerbeek', aliases: ['schaerbeek', 'schaarbeek'], lat: 50.867, lon: 4.379, radiusKm: 3.0 },
  { slug: 'uccle', label: 'Uccle', aliases: ['uccle', 'ukkel'], lat: 50.802, lon: 4.340, radiusKm: 4.4 },
  { slug: 'watermael', label: 'Watermael-Boitsfort', aliases: ['watermael-boitsfort', 'watermaal-bosvoorde'], lat: 50.800, lon: 4.409, radiusKm: 3.2 },
  { slug: 'woluwe-saint-lambert', label: 'Woluwe-Saint-Lambert', aliases: ['woluwe-saint-lambert', 'sint-lambrechts-woluwe'], lat: 50.846, lon: 4.429, radiusKm: 2.8 },
  { slug: 'woluwe-saint-pierre', label: 'Woluwe-Saint-Pierre', aliases: ['woluwe-saint-pierre', 'sint-pieters-woluwe'], lat: 50.831, lon: 4.440, radiusKm: 3.2 }
];

const CATEGORY_CONFIG = {
  library: {
    key: 'libraries',
    label: 'Library',
    query: ['amenity=library'],
    publicBuilding: true,
    acLikely: 'unknown',
    freeAccess: 'yes',
    indoor: true
  },
  pool: {
    key: 'pools',
    label: 'Pool',
    query: ['leisure=swimming_pool'],
    publicBuilding: false,
    acLikely: 'unknown',
    freeAccess: 'unknown',
    indoor: true
  },
  sports_centre: {
    key: 'sportsCentres',
    label: 'Sports centre',
    query: ['leisure=sports_centre'],
    publicBuilding: false,
    acLikely: 'unknown',
    freeAccess: 'unknown',
    indoor: true
  },
  mall: {
    key: 'malls',
    label: 'Mall',
    query: ['shop=mall'],
    publicBuilding: true,
    acLikely: 'likely',
    freeAccess: 'yes',
    indoor: true
  },
  museum: {
    key: 'museums',
    label: 'Museum',
    query: ['tourism=museum'],
    publicBuilding: true,
    acLikely: 'likely',
    freeAccess: 'unknown',
    indoor: true
  },
  community_centre: {
    key: 'communityCentres',
    label: 'Community centre',
    query: ['amenity=community_centre'],
    publicBuilding: true,
    acLikely: 'unknown',
    freeAccess: 'yes',
    indoor: true
  },
  townhall: {
    key: 'publicBuildings',
    label: 'Town hall',
    query: ['amenity=townhall'],
    publicBuilding: true,
    acLikely: 'unknown',
    freeAccess: 'yes',
    indoor: true
  },
  station: {
    key: 'stations',
    label: 'Station',
    query: ['railway=station'],
    publicBuilding: true,
    acLikely: 'unknown',
    freeAccess: 'yes',
    indoor: true
  },
  public_building: {
    key: 'publicBuildings',
    label: 'Public building',
    query: ['amenity=public_building'],
    publicBuilding: true,
    acLikely: 'unknown',
    freeAccess: 'unknown',
    indoor: true
  }
};

function ensureCacheDir() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function cachePath(name) {
  return path.join(CACHE_DIR, `${name}.json`);
}

function writeCache(name, payload) {
  ensureCacheDir();
  fs.writeFileSync(cachePath(name), JSON.stringify({
    cachedAt: new Date().toISOString(),
    payload
  }, null, 2));
}

function readCache(name) {
  try {
    const raw = JSON.parse(fs.readFileSync(cachePath(name), 'utf8'));
    return raw && typeof raw === 'object' && 'payload' in raw ? raw : null;
  } catch (error) {
    return null;
  }
}

async function fetchOverpassWithCache(cacheKey, query, mapFn, fallbackValue) {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const requestUrl = endpoint.includes('?data=')
        ? endpoint
        : `${endpoint}?data=${encodeURIComponent(query)}`;
      const response = await fetch(requestUrl, {
        headers: {
          'User-Agent': 'coolspots-data-refresh/1.0 (static-build local refresh)',
          'Accept': 'application/json,text/plain;q=0.9,*/*;q=0.8'
        },
        signal: AbortSignal.timeout(50000)
      });
      if (!response.ok) continue;
      const payload = await response.json();
      const mapped = mapFn(payload);
      writeCache(cacheKey, mapped);
      return mapped;
    } catch (error) {
      console.warn('Overpass indoor fetch failed:', endpoint, error.message);
    }
  }

  const cached = readCache(cacheKey);
  if (cached) {
    console.warn(`Overpass unavailable, using indoor cache from ${cached.cachedAt}`);
    return cached.payload;
  }

  return fallbackValue;
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function parseDelimitedFile(filePath, delimiter) {
  const text = fs.readFileSync(filePath, 'utf8').trim();
  if (!text) return [];

  const lines = text.split(/\r?\n/);
  const headers = splitDelimitedLine(lines[0], delimiter).map(value => value.replace(/^\uFEFF/, ''));
  return lines.slice(1).filter(Boolean).map(line => {
    const cells = splitDelimitedLine(line, delimiter);
    return headers.reduce((record, header, index) => {
      record[header] = cells[index] || '';
      return record;
    }, {});
  });
}

function splitDelimitedLine(line, delimiter) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }

  values.push(current.trim());
  return values;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = value => value * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isFiniteCoord(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon);
}

function isInRegionBounds(lat, lon) {
  return isFiniteCoord(lat, lon)
    && lat >= REGION_SOUTH
    && lat <= REGION_NORTH
    && lon >= REGION_WEST
    && lon <= REGION_EAST;
}

function getClosestCommune(lat, lon) {
  if (!isFiniteCoord(lat, lon)) return null;
  let best = null;
  let minDist = Infinity;
  for (const commune of COMMUNES) {
    const dist = haversineKm(lat, lon, commune.lat, commune.lon);
    if (dist < minDist) {
      minDist = dist;
      best = commune;
    }
  }
  if (!best) return null;
  return minDist <= best.radiusKm * 1.35 ? best : null;
}

function getCommuneFromLabel(label, lat, lon) {
  const normalized = normalizeText(label);
  const direct = COMMUNES.find(commune => commune.aliases.includes(normalized) || normalizeText(commune.label) === normalized);
  return direct || getClosestCommune(lat, lon);
}

function formatAddress(tags) {
  const parts = [
    tags['addr:street'],
    tags['addr:housenumber'],
    tags['addr:postcode'],
    tags['addr:city']
  ].filter(Boolean);
  return parts.join(', ');
}

function detectType(tags) {
  const pairs = [
    ['amenity', 'library', 'library'],
    ['leisure', 'swimming_pool', 'pool'],
    ['leisure', 'sports_centre', 'sports_centre'],
    ['shop', 'mall', 'mall'],
    ['tourism', 'museum', 'museum'],
    ['amenity', 'community_centre', 'community_centre'],
    ['amenity', 'townhall', 'townhall'],
    ['railway', 'station', 'station'],
    ['amenity', 'public_building', 'public_building']
  ];
  for (const [key, value, type] of pairs) {
    if (tags[key] === value) return type;
  }
  return null;
}

function getElementLatLon(element) {
  if (isFiniteCoord(element.lat, element.lon)) return { lat: element.lat, lon: element.lon };
  if (isFiniteCoord(element.center?.lat, element.center?.lon)) return { lat: element.center.lat, lon: element.center.lon };
  return { lat: null, lon: null };
}

function normalizeIndoorElements(elements, treeData, timestamp) {
  const allAxes = (treeData.communes || []).flatMap(commune => (commune.axes || []).map(axis => ({
    ...axis,
    communeSlug: commune.slug,
    communeLabel: commune.label
  })));

  const waterAxes = allAxes.filter(axis => axis.placeType === 'water');
  const shadeAxes = allAxes.filter(axis => axis.placeType !== 'water' && axis.score >= 60);
  const indoor = [];

  for (const element of elements) {
    const tags = element.tags || {};
    const type = detectType(tags);
    if (!type) continue;

    const { lat, lon } = getElementLatLon(element);
    if (!isInRegionBounds(lat, lon)) continue;

    const name = tags.name || tags['name:fr'] || tags['name:nl'];
    if (!name) continue;

    const category = CATEGORY_CONFIG[type];
    const commune = getClosestCommune(lat, lon);
    const waterNearby = waterAxes.some(axis => haversineKm(lat, lon, axis.centLat, axis.centLon) <= 0.35);
    const shadeNearby = shadeAxes.some(axis => haversineKm(lat, lon, axis.centLat, axis.centLon) <= 0.35);
    const openingHours = tags.opening_hours || '';
    const indoorFlag = tags.indoor === 'no' ? false : category.indoor;
    const acLikely = tags.air_conditioning === 'yes' ? 'likely'
      : tags.air_conditioning === 'no' ? 'unlikely'
      : category.acLikely;
    const freeAccess = tags.fee === 'no' ? 'yes'
      : tags.fee === 'yes' ? 'no'
      : category.freeAccess;
    const completeness = [
      Boolean(name),
      Boolean(formatAddress(tags)),
      Boolean(openingHours),
      Boolean(tags.website || tags.phone),
      Boolean(tags['operator'])
    ].filter(Boolean).length;
    const confidence = Math.min(100, 45 + completeness * 10 + (tags['addr:street'] ? 5 : 0) + (tags.indoor ? 5 : 0));
    const typeBoost = ['library', 'museum', 'mall'].includes(type) ? 20 : 0;
    const poolBoost = type === 'pool' || waterNearby ? 15 : 0;
    const shadeBoost = shadeNearby ? 15 : 0;
    const accessBoost = indoorFlag ? 25 : 0;
    const acBoost = acLikely === 'likely' ? 25 : 0;
    const hoursBoost = openingHours ? 5 : 0;
    const confidenceBoost = confidence >= 80 ? 10 : confidence >= 65 ? 5 : 0;
    const coolScore = Math.min(100, accessBoost + acBoost + typeBoost + poolBoost + shadeBoost + hoursBoost + confidenceBoost);

    indoor.push({
      id: `osm-${element.type}-${element.id}`,
      name,
      type,
      cool_type: 'indoor_cool',
      lat,
      lon,
      lng: lon,
      address: formatAddress(tags),
      commune: commune ? commune.label : '',
      communeSlug: commune ? commune.slug : '',
      source: 'osm',
      opening_hours: openingHours,
      indoor: Boolean(indoorFlag),
      ac_likely: acLikely,
      free_access: freeAccess,
      water_nearby: waterNearby,
      shade_nearby: shadeNearby,
      cool_score: coolScore,
      confidence,
      last_updated: timestamp,
      user_reports: []
    });
  }

  return dedupeIndoor(indoor);
}

function dedupeIndoor(items) {
  const deduped = [];
  for (const item of items) {
    const duplicate = deduped.find(existing => (
      normalizeText(existing.name) === normalizeText(item.name)
      && haversineKm(existing.lat, existing.lon, item.lat, item.lon) <= 0.12
    ));

    if (!duplicate) {
      deduped.push(item);
      continue;
    }

    if ((item.confidence || 0) > (duplicate.confidence || 0)) {
      Object.assign(duplicate, item);
    }
  }
  return deduped.sort((a, b) => (b.cool_score || 0) - (a.cool_score || 0) || a.name.localeCompare(b.name, 'fr'));
}

function readCoolingCsvRows() {
  for (const filePath of COOLING_CSV_FILES) {
    if (!fs.existsSync(filePath)) continue;
    const delimiter = filePath.endsWith('.csv') && path.basename(filePath) === 'coolspots_cooling_points.csv' ? ',' : ';';
    return parseDelimitedFile(filePath, delimiter);
  }
  return [];
}

function normalizeCoolingWaterPoints(rows, timestamp) {
  const allowedTypes = new Set(['borne_eau_potable', 'fontaine_voirie', 'fontaine_ornementale', 'etang_bassin', 'fontaine_potable', 'étang_bassin']);
  const points = [];

  for (const row of rows) {
    const rowType = normalizeText(row.type).replace(/^etang_/, 'etang_');
    if (!allowedTypes.has(rowType)) continue;

    const lat = Number.parseFloat(row.lat);
    const lon = Number.parseFloat(row.lon);
    if (!isInRegionBounds(lat, lon)) continue;

    const commune = getCommuneFromLabel(row.commune_fr || row.commune, lat, lon);
    const rawName = row.nom || '';
    const type = rowType === 'borne_eau_potable' || rowType === 'fontaine_potable'
      ? 'drinking_water'
      : rowType === 'fontaine_ornementale'
        ? 'ornamental_fountain'
        : rowType === 'fontaine_voirie'
          ? 'street_fountain'
          : 'pond';

    points.push({
      id: `csv-water-${type}-${lat.toFixed(6)}-${lon.toFixed(6)}`,
      name: rawName || (type === 'drinking_water'
        ? 'Borne d’eau potable'
        : type === 'street_fountain'
          ? 'Fontaine de voirie'
          : type === 'ornamental_fountain'
            ? 'Fontaine ornementale'
            : 'Étang / bassin'),
      type,
      cool_type: type === 'pond' ? 'water_spot' : 'water_point',
      lat,
      lon,
      lng: lon,
      address: row.adresse || '',
      commune: commune ? commune.label : (row.commune_fr || row.commune || ''),
      communeSlug: commune ? commune.slug : '',
      source: 'brussels_open_data_csv',
      potable: normalizeText(row.potable) === 'oui' || normalizeText(row.potable) === 'yes',
      dog_friendly: normalizeText(row.dog_friendly) === 'oui' || normalizeText(row.dog_friendly) === 'yes',
      status: row.statut || '',
      surface_m2: Number.parseFloat(row.surface_m2) || null,
      last_updated: timestamp
    });
  }

  return dedupeCoolingWaterPoints(points);
}

function dedupeCoolingWaterPoints(items) {
  const deduped = [];
  for (const item of items) {
    const duplicate = deduped.find(existing => (
      normalizeText(existing.name) === normalizeText(item.name)
      && haversineKm(existing.lat, existing.lon, item.lat, item.lon) <= 0.05
    ) || haversineKm(existing.lat, existing.lon, item.lat, item.lon) <= 0.01);

    if (!duplicate) {
      deduped.push(item);
      continue;
    }

    const existingScore = Number(Boolean(duplicate.address)) + Number(Boolean(duplicate.commune)) + Number(Boolean(duplicate.surface_m2));
    const nextScore = Number(Boolean(item.address)) + Number(Boolean(item.commune)) + Number(Boolean(item.surface_m2));
    if (nextScore > existingScore) Object.assign(duplicate, item);
  }

  return deduped.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

function mergeIndoorCsvRows(existingIndoor, rows, timestamp) {
  const mapped = [];

  for (const row of rows) {
    const sourceType = normalizeText(row.type);
    const lat = Number.parseFloat(row.lat);
    const lon = Number.parseFloat(row.lon);
    const name = String(row.nom || '').trim();
    if (!name || !isInRegionBounds(lat, lon)) continue;

    let type = null;
    let freeAccess = 'unknown';
    if (sourceType === 'bibliotheque') {
      type = 'library';
      freeAccess = 'yes';
    } else if (sourceType === 'infrastructure_sportive' || sourceType === 'espace_sportif') {
      type = 'sports_centre';
    } else if (sourceType === 'metro') {
      type = 'station';
      freeAccess = 'yes';
    }

    if (!type) continue;

    const duplicate = existingIndoor.find(item => (
      normalizeText(item.name) === normalizeText(name)
      && haversineKm(item.lat, item.lon, lat, lon) <= 0.25
    ) || haversineKm(item.lat, item.lon, lat, lon) <= 0.08);
    if (duplicate) continue;

    const commune = getCommuneFromLabel(row.commune_fr || row.commune, lat, lon);
    mapped.push({
      id: `csv-${sourceType}-${lat.toFixed(6)}-${lon.toFixed(6)}`,
      name,
      type,
      cool_type: 'indoor_cool',
      lat,
      lon,
      lng: lon,
      address: row.adresse || '',
      commune: commune ? commune.label : (row.commune_fr || row.commune || ''),
      communeSlug: commune ? commune.slug : '',
      source: 'brussels_open_data_csv',
      opening_hours: '',
      indoor: true,
      ac_likely: type === 'library' ? 'likely' : 'unknown',
      free_access: freeAccess,
      water_nearby: false,
      shade_nearby: false,
      cool_score: type === 'library' ? 50 : 25,
      confidence: 60,
      last_updated: timestamp,
      user_reports: []
    });
  }

  return dedupeIndoor(existingIndoor.concat(mapped));
}

function buildIndoorQuery() {
  const fragments = [];
  for (const config of Object.values(CATEGORY_CONFIG)) {
    for (const pair of config.query) {
      const [key, value] = pair.split('=');
      fragments.push(`node["${key}"="${value}"](${REGION_BBOX});`);
      fragments.push(`way["${key}"="${value}"](${REGION_BBOX});`);
      fragments.push(`relation["${key}"="${value}"](${REGION_BBOX});`);
    }
  }

  return `[out:json][timeout:45];
(
  ${fragments.join('\n  ')}
);
out center tags;`;
}

function updateTotals(baseTotals, indoorCoolspots, coolingWaterPoints) {
  const totals = { ...(baseTotals || {}) };
  totals.coolingWaterPoints = coolingWaterPoints.length;
  totals.indoorCoolspots = indoorCoolspots.length;
  totals.libraries = indoorCoolspots.filter(item => item.type === 'library').length;
  totals.pools = indoorCoolspots.filter(item => item.type === 'pool').length;
  totals.malls = indoorCoolspots.filter(item => item.type === 'mall').length;
  totals.museums = indoorCoolspots.filter(item => item.type === 'museum').length;
  totals.publicBuildings = indoorCoolspots.filter(item => ['public_building', 'townhall'].includes(item.type)).length;
  totals.communityCentres = indoorCoolspots.filter(item => item.type === 'community_centre').length;
  totals.stations = indoorCoolspots.filter(item => item.type === 'station').length;
  totals.sportsCentres = indoorCoolspots.filter(item => item.type === 'sports_centre').length;
  return totals;
}

async function main() {
  if (!fs.existsSync(DATA_FILE)) {
    throw new Error('coolspots-data.json introuvable');
  }

  const treeData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  const previousIndoor = Array.isArray(treeData.indoorCoolspots) ? treeData.indoorCoolspots : [];
  const previousCoolingWaterPoints = Array.isArray(treeData.coolingWaterPoints) ? treeData.coolingWaterPoints : [];
  const timestamp = new Date().toISOString();
  const query = buildIndoorQuery();
  const indoorElements = await fetchOverpassWithCache(
    'indoor-coolspots',
    query,
    payload => payload.elements || [],
    []
  );

  const indoorCoolspots = indoorElements.length
    ? normalizeIndoorElements(indoorElements, treeData, timestamp)
    : previousIndoor;
  const coolingCsvRows = readCoolingCsvRows();
  const csvCoolingWaterPoints = coolingCsvRows.length
    ? normalizeCoolingWaterPoints(coolingCsvRows, timestamp)
    : previousCoolingWaterPoints;
  const mergedIndoorCoolspots = coolingCsvRows.length
    ? mergeIndoorCsvRows(indoorCoolspots, coolingCsvRows, timestamp)
    : indoorCoolspots;

  const nextData = {
    ...treeData,
    generated: timestamp,
    totals: updateTotals(treeData.totals, mergedIndoorCoolspots, csvCoolingWaterPoints),
    coolingWaterPoints: csvCoolingWaterPoints,
    indoorCoolspots: mergedIndoorCoolspots
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(nextData));

  console.log(`Updated ${path.basename(DATA_FILE)}`);
  console.log(`Indoor coolspots: ${mergedIndoorCoolspots.length}`);
  console.log(`Cooling water points: ${csvCoolingWaterPoints.length}`);
  console.log(`Libraries: ${nextData.totals.libraries || 0}`);
  console.log(`Pools: ${nextData.totals.pools || 0}`);
  console.log(`Malls: ${nextData.totals.malls || 0}`);
  console.log(`Museums: ${nextData.totals.museums || 0}`);
  console.log(`Public buildings: ${nextData.totals.publicBuildings || 0}`);
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
