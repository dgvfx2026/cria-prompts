// api/webhook.js — Recebe aviso do Kiwify quando alguém compra
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;

    // Kiwify pode enviar o email em formatos diferentes
    const email =
      body?.customer?.email ||
      body?.data?.customer?.email ||
      body?.buyer?.email ||
      body?.email;

    if (!email) {
      console.log('Webhook sem email. Payload:', JSON.stringify(body));
      return res.status(400).json({ error: 'Email nao encontrado no payload' });
    }

    const emailLower = email.toLowerCase().trim();
    console.log('Novo comprador registrado:', emailLower);

    // Salvar no Supabase
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/buyers`,
      {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({ email: emailLower })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Erro Supabase:', errText);
      return res.status(500).json({ error: 'Erro ao salvar no banco de dados' });
    }

    return res.status(200).json({ ok: true, email: emailLower });

  } catch (err) {
    console.error('Erro no webhook:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
