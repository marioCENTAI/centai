export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const { messages, system, tools } = req.body;

    const cleanMessages = messages.map(m => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content :
               Array.isArray(m.content) ? m.content.filter(b => b.type === 'text').map(b => b.text).join(' ') :
               String(m.content)
    })).filter(m => m.content && m.content.trim());

    const requestBody = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: system || 'You are CentAI, a helpful AI finance advisor.',
      messages: cleanMessages
    };

    const anthropicHeaders = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    };

    if (tools && tools.length > 0) {
      requestBody.tools = tools;
      anthropicHeaders['anthropic-beta'] = 'web-search-2025-03-05';
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: anthropicHeaders,
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
