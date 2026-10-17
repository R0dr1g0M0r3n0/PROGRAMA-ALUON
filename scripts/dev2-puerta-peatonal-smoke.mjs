const base = process.env.DEV2_API_BASE ?? 'http://localhost:8080';
const username = process.env.DEV2_STAFF_USER;
const password = process.env.DEV2_STAFF_PASSWORD;

if (!username || !password) {
  console.error('Define DEV2_STAFF_USER y DEV2_STAFF_PASSWORD para ejecutar el smoke autenticado.');
  process.exit(2);
}

const loginResponse = await fetch(`${base}/api/staff-auth/login`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ username, password }),
});
if (!loginResponse.ok) throw new Error(`Login DEV2 fallido: ${loginResponse.status}`);
const { token } = await loginResponse.json();
const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };

const reference = `DEV2-PEATONAL-SMOKE-${Date.now()}`;
const payload = {
  customerName: 'Smoke puerta peatonal',
  reference,
  productType: 'PUERTA_PEATONAL',
  status: 'DRAFT',
  payload: {
    productType: 'PUERTA_PEATONAL',
    openingSide: 'LEFT',
    hingeSide: 'LEFT',
    openingDirection: 'INTERIOR',
    exteriorPullWidthMm: 30,
    exteriorPullHeightMm: 550,
    interiorHandleMaterial: 'INOX',
    lockConfiguration: 'LATCH_PALLET_ONE_TURN',
    automaticDoorPhone: false,
    widthMm: 900,
    heightMm: 2000,
    groundClearanceOption: 'OTHER',
    groundClearanceMm: 2.5,
    installerName: 'Instalador Smoke',
    notes: 'Validación completa DEV2',
    generatedDocuments: [{ name: `${reference}.pdf`, type: 'ORDER_CONFIGURATION_PDF', generatedAt: new Date().toISOString() }],
  },
};

const saveResponse = await fetch(`${base}/api/order-configurations`, { method: 'POST', headers, body: JSON.stringify(payload) });
if (!saveResponse.ok) throw new Error(`Guardado fallido: ${saveResponse.status} ${await saveResponse.text()}`);
const saved = await saveResponse.json();
const loadedResponse = await fetch(`${base}/api/order-configurations/${saved.id}`, { headers });
if (!loadedResponse.ok) throw new Error(`Recuperación fallida: ${loadedResponse.status}`);
const loaded = await loadedResponse.json();
const checks = {
  status: saved.status === 'DRAFT',
  version: saved.version === 1,
  creator: typeof saved.createdBy === 'string' && saved.createdBy.length > 0,
  dimensions: loaded.payload.widthMm === 900 && loaded.payload.heightMm === 2000,
  hinge: loaded.payload.hingeSide === 'LEFT',
  interiorOpening: loaded.payload.openingDirection === 'INTERIOR',
  fixedHardware: loaded.payload.exteriorPullWidthMm === 30 && loaded.payload.exteriorPullHeightMm === 550 && loaded.payload.interiorHandleMaterial === 'INOX' && loaded.payload.lockConfiguration === 'LATCH_PALLET_ONE_TURN',
  customClearance: loaded.payload.groundClearanceOption === 'OTHER' && loaded.payload.groundClearanceMm === 2.5,
  installer: loaded.payload.installerName === 'Instalador Smoke',
  document: loaded.payload.generatedDocuments?.[0]?.type === 'ORDER_CONFIGURATION_PDF',
};

const ok = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ ok, id: saved.id, reference, checks }, null, 2));
process.exit(ok ? 0 : 1);
