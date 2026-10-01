// Função de diagnóstico: se /api/ping responder {"pong":true}, as funções estão subindo.
export default function handler(req, res) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({ pong: true }));
}
