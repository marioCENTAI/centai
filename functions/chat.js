exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const body = JSON.parse(event.body);

    const requestBody = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: body.system || 'You are CentAI, a helpful finance advisor.',
      messages: body.messages
    };

    const anthropicHeaders = {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    };

    // Add web search if requested
    if (body.tools && body.tools.length > 0) {
      requestBody.tools = body.tools;
      anthropicHeaders['anthropic-beta'] = 'web-search-2025-03-05';
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: anthropicHeaders,
      body: JSON.stringify(requestBody)
    });

    const responseText = await response.text();

    return {
      statusCode: response.status,
      headers,
      body: responseText
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
