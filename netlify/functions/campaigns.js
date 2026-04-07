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

    const adsRes = await fetch(
      'https://googleads.googleapis.com/v18/customers/1535382254/googleAds:search',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
          'login-customer-id': '1535382254',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `
            SELECT
              campaign.name,
              campaign.status,
              campaign.advertising_channel_type,
              campaign_budget.amount_micros,
              metrics.impressions,
              metrics.clicks,
              metrics.cost_micros,
              metrics.conversions,
              metrics.ctr,
              metrics.average_cpc
            FROM campaign
            WHERE segments.date DURING LAST_30_DAYS
            ORDER BY metrics.cost_micros DESC
          `
        })
      }
    );

    const rawText = await adsRes.text();
    
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: adsRes.status, raw: rawText.substring(0, 2000) })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
