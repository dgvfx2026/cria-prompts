// api/verify.js — Verifica se email é de um comprador e emite token de acesso
const crypto = require('crypto');

module.exports = async (req, res) => {
  // CORS headers (para funcionar com fetch do frontend)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email obrigatorio' });
    }

    const emailLower = email.toLowerCase().trim();

    // Buscar email no Supabase
    const supaUrl = `${process.env.SUPABASE_URL}/rest/v1/buyers?email=eq.${encodeURIComponent(emailLower)}&select=email&limit=1`;

    const response = await fetch(supaUrl, {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) {
      return res.status(500).json({ error: 'Erro ao consultar banco de dados' });
    }

    const data = await response.json();

    // Email nao encontrado na lista de compradores
    if (!data || data.length === 0) {
      return res.status(403).json({
        error: 'Email nao encontrado. Verifique se usou o mesmo email da compra no Kiwify.'
      });
    }

    // Gerar token assinado (valido por 30 dias)
    const payload = {
      email: emailLower,
      iat: Date.now(),
      exp: Date.now() + 30 * 24 * 60 * 60 * 1000
    };

    const token = signToken(payload, process.env.JWT_SECRET);

    console.log('Acesso liberado para:', emailLower);
    return res.status(200).json({ ok: true, token });

  } catch (err) {
    console.error('Erro na verificacao:', err.message);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Assina o token com HMAC SHA-256 (sem dependencias externas)
function signToken(payload, secret) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64url');
  return `${data}.${sig}`;
}
