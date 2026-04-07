exports.handler = async function(event, context) {
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_ADS_CLIENT_ID,
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
        refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
        grant_type: 'refresh_token'
      })
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ debug: 'token_failed', tokenData })
      };
    }

    const results = {};
    for (const version of ['v19', 'v18', 'v17', 'v16']) {
      const res = await fetch(
        `https://googleads.googleapis.com/${version}/customers/1535382254/googleAds:search`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
            'login-customer-id': '1535382254',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: `SELECT campaign.name FROM campaign LIMIT 1` })
        }
      );
      results[version] = { status: res.status, body: (await res.text()).substring(0, 300) };
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify(results)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
