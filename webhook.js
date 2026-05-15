module.exports = async function(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const event = req.body;

    // Handle successful payment events
    if (event.type === 'checkout.session.completed' || 
        event.type === 'customer.subscription.created' ||
        event.type === 'invoice.payment_succeeded') {
      
      const session = event.data.object;
      const customerEmail = session.customer_email || 
                           session.customer_details?.email ||
                           session.metadata?.email;

      // Determine plan based on amount (in cents)
      const amount = session.amount_total || session.plan?.amount;
      let plan = 'pro';
      if (amount >= 4900) plan = 'business';

      if (customerEmail) {
        const supabaseUrl = 'https://utcruwpakpwkwcpnyvwt.supabase.co';
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

        // Get all users to find the one with matching email
        const response = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=1&per_page=1000`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        });

        const data = await response.json();
        const user = data.users?.find(u => u.email === customerEmail);

        if (user) {
          // Update user plan in Supabase
          await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
            method: 'PUT',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              user_metadata: { ...user.user_metadata, plan: plan }
            })
          });
          console.log(`Upgraded ${customerEmail} to ${plan}`);
        }
      }
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
};
