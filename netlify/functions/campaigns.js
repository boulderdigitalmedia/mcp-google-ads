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

    const res = await fetch(
      'https://googleads.googleapis.com/v23/customers/4185420382/googleAds:search',
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
              campaign.id,
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

    const data = await res.json();

    const campaigns = (data.results || []).map(r => ({
      id: r.campaign.id,
      name: r.campaign.name,
      status: r.campaign.status,
      type: r.campaign.advertisingChannelType,
      budget: r.campaignBudget ? (r.campaignBudget.amountMicros / 1000000).toFixed(2) : 0,
      impressions: r.metrics.impressions || 0,
      clicks: r.metrics.clicks || 0,
      cost: r.metrics.costMicros ? (r.metrics.costMicros / 1000000).toFixed(2) : 0,
      conversions: r.metrics.conversions || 0,
      ctr: r.metrics.ctr ? (r.metrics.ctr * 100).toFixed(2) : 0,
      avgCpc: r.metrics.averageCpc ? (r.metrics.averageCpc / 1000000).toFixed(2) : 0
    }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ campaigns })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
