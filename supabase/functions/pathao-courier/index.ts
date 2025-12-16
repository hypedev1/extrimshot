import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Pathao API Configuration
const PATHAO_BASE_URL = 'https://api-hermes.pathao.com';
const PATHAO_SANDBOX_URL = 'https://hermes-api.p-stageenv.xyz';

interface PathaoTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

interface OrderData {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  total_amount: number;
  package_type: string;
}

// Get Pathao access token
async function getPathaoToken(sandbox: boolean = false): Promise<string> {
  const baseUrl = sandbox ? PATHAO_SANDBOX_URL : PATHAO_BASE_URL;
  
  console.log('Getting Pathao access token...');
  
  const response = await fetch(`${baseUrl}/aladdin/api/v1/issue-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: Deno.env.get('PATHAO_CLIENT_ID'),
      client_secret: Deno.env.get('PATHAO_CLIENT_SECRET'),
      username: Deno.env.get('PATHAO_USERNAME'),
      password: Deno.env.get('PATHAO_PASSWORD'),
      grant_type: 'password',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Pathao token error:', errorText);
    throw new Error(`Failed to get Pathao token: ${errorText}`);
  }

  const data: PathaoTokenResponse = await response.json();
  console.log('Pathao token obtained successfully');
  return data.access_token;
}

// Create order in Pathao
async function createPathaoOrder(token: string, order: OrderData, sandbox: boolean = false) {
  const baseUrl = sandbox ? PATHAO_SANDBOX_URL : PATHAO_BASE_URL;
  const storeId = Deno.env.get('PATHAO_STORE_ID');

  console.log('Creating Pathao order for:', order.id);

  // Calculate weight based on package type
  const weight = order.package_type === 'permanent' ? 0.2 : 0.1; // 180g or 90g
  
  const response = await fetch(`${baseUrl}/aladdin/api/v1/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      store_id: storeId,
      merchant_order_id: order.id,
      recipient_name: order.customer_name,
      recipient_phone: order.phone,
      recipient_address: order.address,
      recipient_city: 1, // Default to Dhaka, can be updated based on address parsing
      recipient_zone: 1, // Default zone
      delivery_type: 48, // Normal delivery
      item_type: 2, // Parcel
      special_instruction: `Package: ${order.package_type === 'permanent' ? 'পার্মানেন্ট (১৮০গ্রাম)' : 'রেগুলার (৯০গ্রাম)'}`,
      item_quantity: 1,
      item_weight: weight,
      amount_to_collect: order.total_amount,
      item_description: `Nobosokti - ${order.package_type === 'permanent' ? 'Permanent Course (180g)' : 'Regular Course (90g)'}`,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Pathao order creation error:', errorText);
    throw new Error(`Failed to create Pathao order: ${errorText}`);
  }

  const data = await response.json();
  console.log('Pathao order created:', data);
  return data;
}

// Get order status from Pathao
async function getPathaoOrderStatus(token: string, consignmentId: string, sandbox: boolean = false) {
  const baseUrl = sandbox ? PATHAO_SANDBOX_URL : PATHAO_BASE_URL;
  
  const response = await fetch(`${baseUrl}/aladdin/api/v1/orders/${consignmentId}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Pathao status check error:', errorText);
    throw new Error(`Failed to get Pathao order status: ${errorText}`);
  }

  return await response.json();
}

// Map Pathao status to our order status
function mapPathaoStatus(pathaoStatus: string): string {
  const statusMap: Record<string, string> = {
    'Pending': 'pending',
    'Pickup Pending': 'confirmed',
    'Assigned for Pickup': 'confirmed',
    'Picked': 'confirmed',
    'At Sorting Hub': 'confirmed',
    'In Transit': 'confirmed',
    'Received at last mile hub': 'confirmed',
    'Out for Delivery': 'confirmed',
    'Delivered': 'delivered',
    'Partial Delivery': 'delivered',
    'Return': 'cancelled',
    'Cancelled': 'cancelled',
    'Hold': 'pending',
  };
  
  return statusMap[pathaoStatus] || 'pending';
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, orderId, consignmentId } = await req.json();
    const sandbox = Deno.env.get('PATHAO_SANDBOX') === 'true';

    console.log(`Pathao action: ${action}, orderId: ${orderId}, sandbox: ${sandbox}`);

    // Get Pathao token
    const token = await getPathaoToken(sandbox);

    if (action === 'create_order') {
      // Fetch order from database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        throw new Error(`Order not found: ${orderError?.message}`);
      }

      // Create order in Pathao
      const pathaoResponse = await createPathaoOrder(token, order, sandbox);

      // Store Pathao consignment_id in order (we'll add this column later if needed)
      console.log('Pathao consignment_id:', pathaoResponse.data?.consignment_id);

      return new Response(JSON.stringify({
        success: true,
        consignment_id: pathaoResponse.data?.consignment_id,
        message: 'Order created in Pathao successfully',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'check_status') {
      if (!consignmentId) {
        throw new Error('Consignment ID is required for status check');
      }

      const statusResponse = await getPathaoOrderStatus(token, consignmentId, sandbox);
      const mappedStatus = mapPathaoStatus(statusResponse.data?.order_status);

      // Update order status in database if orderId provided
      if (orderId) {
        await supabase
          .from('orders')
          .update({ status: mappedStatus })
          .eq('id', orderId);
        
        console.log(`Order ${orderId} status updated to: ${mappedStatus}`);
      }

      return new Response(JSON.stringify({
        success: true,
        pathao_status: statusResponse.data?.order_status,
        mapped_status: mappedStatus,
        details: statusResponse.data,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'get_cities') {
      const response = await fetch(`${sandbox ? PATHAO_SANDBOX_URL : PATHAO_BASE_URL}/aladdin/api/v1/city-list`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'get_zones') {
      const { cityId } = await req.json();
      const response = await fetch(`${sandbox ? PATHAO_SANDBOX_URL : PATHAO_BASE_URL}/aladdin/api/v1/city/${cityId}/zone-list`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      throw new Error(`Unknown action: ${action}`);
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Pathao courier error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
