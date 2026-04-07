exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const { messages, campaignData } = JSON.parse(event.body);

    const systemPrompt = `You are an expert Google Ads analyst for Pacific Discovery, a gap year and semester abroad program company targeting high school graduates.

You have access to their live campaign data and provide specific, actionable recommendations.

Current account: Pacific Discovery (Customer ID: 4185420382)
MCC: Boulder Digital Media (153-538-2254)

When analysing data:
- Be specific with numbers and percentages
- Prioritise conversion efficiency over volume
- Consider their $1,500 NZD/month budget constraint
- Focus on gap year and semester abroad keywords
- Always recommend concrete next steps

${campaignData ? `Current campaign data:\n${JSON.stringify(campaignData, null, 2)}` : ''}`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages
      })
    });

    const data = await res.json();

    if (!data.content) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No content in response', raw: data })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ response: data.content[0].text })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
