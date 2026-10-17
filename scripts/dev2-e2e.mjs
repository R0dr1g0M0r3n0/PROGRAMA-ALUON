const base = process.env.DEV2_API_BASE ?? 'http://127.0.0.1:8080';
const username = process.env.DEV2_STAFF_USER ?? 'cctvmoreno';
const password = process.env.DEV2_STAFF_PASSWORD ?? 'portainerpantoja';
const jsonHeaders = { 'content-type': 'application/json' };

const request = async (url, options = {}, expected = 200) => {
  const response = await fetch(`${base}${url}`, options);
  if (response.status !== expected) throw new Error(`${url}: esperado ${expected}, recibido ${response.status}: ${await response.text()}`);
  return response;
};

const login = await request('/api/staff-auth/login', {
  method: 'POST', headers: jsonHeaders, body: JSON.stringify({ username, password }),
});
const { token } = await login.json();
const headers = { ...jsonHeaders, authorization: `Bearer ${token}` };
const reference = `DEV2-E2E-${Date.now()}`;
const pdfBytes = Buffer.from('%PDF-1.7\nALUON DEV2 E2E\n%%EOF').toString('base64');
const configurations = {
  PUERTA_PEATONAL: { hingeSide: 'LEFT', heightMm: 2000, widthMm: 900, clearOpeningWidthMm: 800, clearOpeningHeightMm: 1950, freePassageWidthMm: 800, freePassageHeightMm: 1950, groundClearanceOption: '1', groundClearanceMm: 1 },
  ABATIBLE_UNA: { hingeSide: 'RIGHT', heightMm: 2100, widthMm: 1000, groundClearanceOption: '1', motorIncluded: false, useMode: 'PREPARED' },
  ABATIBLE_DOS: { activeLeaf: 'LEFT', heightMm: 2100, widthMm: 1800, groundClearanceOption: '2', motorIncluded: false, useMode: 'PREPARED' },
  CORREDERA: { openingSide: 'RIGHT', railType: 'CARRIL_20', mountingType: 'B', guideSystem: 'INTERIOR_ROLLERS_U', heightMm: 2100, widthMm: 3000, sideCollectionMm: 100, mountingDistanceMm: 100, selectedSketch: 'MONTAJE_B_U' },
  VALLA: { model: 'SERIE_CLASSIC', color: 'RAL_7016', finish: 'LACADO_MATE', sections: [{ widthMm: 2000, heightMm: 1200, verticalDimensionLabel: 'ALTO' }] },
};

for (const [productType, configuration] of Object.entries(configurations)) {
  const validation = await (await request('/api/catalog/rules/validate', { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ productType, configuration }) })).json();
  if (!validation.valid) throw new Error(`${productType}: caso válido rechazado: ${validation.errors.join('; ')}`);
}

const payload = { ...configurations.PUERTA_PEATONAL, productType: 'PUERTA_PEATONAL', model: 'SERIE_CLASSIC', color: 'RAL_7016', finish: 'LACADO_MATE', generatedDocuments: [{ name: `${reference}.pdf`, type: 'ORDER_CONFIGURATION_PDF', mimeType: 'application/pdf', contentBase64: pdfBytes }] };
const saved = await (await request('/api/order-configurations', { method: 'POST', headers, body: JSON.stringify({ customerName: 'E2E DEV2', reference, productType: 'PUERTA_PEATONAL', status: 'DRAFT', payload, documents: payload.generatedDocuments }) })).json();
const loaded = await (await request(`/api/order-configurations/${saved.id}`, { headers })).json();
if (loaded.status !== 'DRAFT' || loaded.version !== 1 || !loaded.documents?.[0]?.storageKey) throw new Error('El borrador/documento no se ha persistido correctamente.');
const document = await request(`/api/order-configurations/${saved.id}/documents/${loaded.documents[0].id}`, { headers });
if ((await document.arrayBuffer()).byteLength !== Buffer.from(pdfBytes, 'base64').byteLength) throw new Error('El PDF persistido no se puede recuperar íntegramente.');
const updated = await (await request(`/api/order-configurations/${saved.id}`, { method: 'PUT', headers, body: JSON.stringify({ customerName: 'E2E DEV2', reference, productType: 'PUERTA_PEATONAL', status: 'PENDING_REVIEW', payload: { ...payload, notes: 'E2E versión 2' }, changeReason: 'E2E DEV2' }) })).json();
if (updated.version !== 2 || updated.status !== 'PENDING_REVIEW') throw new Error('El versionado o estado de revisión no se ha persistido.');
const history = await (await request(`/api/order-configurations/${saved.id}/history`, { headers })).json();
if (history.length < 2) throw new Error('El historial de auditoría no contiene las dos versiones.');
const duplicate = await (await request(`/api/admin/order-configurations/${saved.id}/duplicate`, { method: 'POST', headers })).json();
if (duplicate.status !== 'DRAFT' || duplicate.version !== 1) throw new Error('La duplicación no genera un borrador independiente.');
const confirmed = await (await request(`/api/admin/order-configurations/${saved.id}/status?value=CONFIRMED&reason=E2E`, { method: 'PATCH', headers })).json();
if (confirmed.status !== 'CONFIRMED') throw new Error('La confirmación no ha cambiado el estado.');
const unauthorised = await request('/api/admin/order-configurations', {}, 403);
if (unauthorised.status !== 403) throw new Error('El bloqueo administrativo sin sesión no funciona.');

console.log(JSON.stringify({ ok: true, templates: Object.keys(configurations), id: saved.id, version: updated.version, history: history.length, duplicateId: duplicate.id, documentId: loaded.documents[0].id, status: confirmed.status }, null, 2));
