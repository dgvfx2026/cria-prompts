// api/webhook.js — Recebe aviso do Kiwify quando alguém compra
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;

    // Log completo para facilitar debug (visível no Vercel Functions logs)
    console.log('Webhook recebido:', JSON.stringify(body));

    // Kiwify envia "Customer" com C maiúsculo no payload de compra aprovada
    // Referência: https://kiwify.com.br/documentacao-webhook
    const email =
      body?.Customer?.email ||       // ✅ formato real da Kiwify
      body?.customer?.email ||       // fallback minúsculo
      body?.data?.Customer?.email || // formato aninhado maiúsculo
      body?.data?.customer?.email || // formato aninhado minúsculo
      body?.buyer?.email ||
      body?.email;

    if (!email) {
      console.log('Webhook sem email. Payload completo:', JSON.stringify(body));
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
