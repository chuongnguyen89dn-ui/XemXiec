const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'ket_qua_1500_phim.json');
const raw = fs.readFileSync(filePath, 'utf8');
const movies = JSON.parse(raw);

if (!Array.isArray(movies)) {
  throw new Error('Dataset root must be an array');
}

const countBy = (key) => {
  const map = new Map();
  for (const item of movies) {
    const value = item?.[key];
    if (!value) continue;
    map.set(value, (map.get(value) || 0) + 1);
  }
  return [...map.entries()].filter(([, count]) => count > 1);
};

const duplicateIds = countBy('id');
const duplicatePages = countBy('page_url');
const duplicateManifests = countBy('manifest_url');

const missing = {
  id: movies.filter((m) => !m?.id).length,
  title: movies.filter((m) => !m?.title).length,
  poster: movies.filter((m) => !m?.poster).length,
  page_url: movies.filter((m) => !m?.page_url).length,
  manifest_url: movies.filter((m) => !m?.manifest_url).length,
};

console.log('=== XIEC DATA AUDIT ===');
console.log(`TOTAL=${movies.length}`);
console.log(`DUPLICATE_ID_VALUES=${duplicateIds.length}`);
console.log(`DUPLICATE_PAGE_URL_VALUES=${duplicatePages.length}`);
console.log(`DUPLICATE_MANIFEST_URL_VALUES=${duplicateManifests.length}`);
console.log(`MISSING_ID=${missing.id}`);
console.log(`MISSING_TITLE=${missing.title}`);
console.log(`MISSING_POSTER=${missing.poster}`);
console.log(`MISSING_PAGE_URL=${missing.page_url}`);
console.log(`MISSING_MANIFEST_URL=${missing.manifest_url}`);

for (const n of [1, 1500, 1501, 2000, 3000, 3221]) {
  const item = movies[n - 1];
  console.log(`\n#${n}:`);
  if (!item) {
    console.log('NOT_FOUND');
    continue;
  }
  console.log(JSON.stringify({
    id: item.id,
    title: item.title,
    page_url: item.page_url,
    manifest_url: item.manifest_url,
    status: item.status,
  }, null, 2));
}

if (duplicateIds.length) {
  console.log('\nDuplicate IDs (first 20):');
  console.log(duplicateIds.slice(0, 20));
}
if (duplicatePages.length) {
  console.log('\nDuplicate page_url values (first 20):');
  console.log(duplicatePages.slice(0, 20));
}
