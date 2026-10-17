const checks = [];

const check = async (name, request, expected) => {
  const response = await fetch(request);
  const ok = response.status === expected;
  checks.push({ name, status: response.status, expected, ok });
  if (!ok) throw new Error(`${name}: esperado ${expected}, recibido ${response.status}`);
  return response;
};

await check('frontend local', 'http://127.0.0.1:5173/', 200);
await check('reglas públicas', 'http://127.0.0.1:8080/api/catalog/rules', 200);
const options = await check('opciones públicas', 'http://127.0.0.1:8080/api/catalog/options?kind=COLOR', 200);
const colors = await options.json();
if (!Array.isArray(colors) || colors.length === 0) throw new Error('opciones públicas: no hay colores activos');
await check('catálogo admin sin sesión bloqueado', 'http://127.0.0.1:8080/api/admin/catalog/options', 403);
await check('reglas admin sin sesión bloqueadas', 'http://127.0.0.1:8080/api/admin/catalog/rules', 403);
await check('distribuidores admin sin sesión bloqueados', 'http://127.0.0.1:8080/api/admin/distributors', 403);
await check('pedidos admin sin sesión bloqueados', 'http://127.0.0.1:8080/api/admin/order-configurations', 403);
await check('usuarios admin sin sesión bloqueados', 'http://127.0.0.1:8080/api/admin/users', 403);

console.log(JSON.stringify({ ok: true, checks, activeColors: colors.length }, null, 2));
