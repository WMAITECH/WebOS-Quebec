import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const AI_ACCOUNTS = [
  { id: '00000000-0000-0000-0000-000000000001', email: 'ai.support@quebec.gouv.qc.ca', name: 'Assistant IA - Support' },
  { id: '00000000-0000-0000-0000-000000000002', email: 'ai.info@quebec.gouv.qc.ca', name: 'Assistant IA - Info' },
  { id: '00000000-0000-0000-0000-000000000003', email: 'ai.conseiller@quebec.gouv.qc.ca', name: 'Assistant IA - Conseiller' },
];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { aiAccountId, message } = await req.json();

    if (!aiAccountId || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing aiAccountId or message' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const isValidAI = AI_ACCOUNTS.some(acc => acc.id === aiAccountId);
    if (!isValidAI) {
      return new Response(
        JSON.stringify({ error: 'Invalid AI account ID' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: existingConvs } = await supabaseClient
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', aiAccountId);

    let conversationId = null;

    if (existingConvs && existingConvs.length > 0) {
      for (const conv of existingConvs) {
        const { data: otherParticipant } = await supabaseClient
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conv.conversation_id)
          .neq('user_id', aiAccountId)
          .maybeSingle();

        if (otherParticipant && otherParticipant.user_id === user.id) {
          conversationId = conv.conversation_id;
          break;
        }
      }
    }

    if (!conversationId) {
      const aiAccount = AI_ACCOUNTS.find(acc => acc.id === aiAccountId);
      
      const { data: newConv, error: convError } = await supabaseClient
        .from('conversations')
        .insert({
          name: `Conversation avec ${aiAccount?.name}`,
          type: 'direct',
          created_by: user.id,
        })
        .select('id')
        .single();

      if (convError) throw convError;
      conversationId = newConv.id;

      await supabaseClient
        .from('conversation_participants')
        .insert([
          { conversation_id: conversationId, user_id: aiAccountId },
          { conversation_id: conversationId, user_id: user.id },
        ]);
    }

    const { error: msgError } = await supabaseClient
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: aiAccountId,
        content: message,
        is_read: false,
      });

    if (msgError) throw msgError;

    return new Response(
      JSON.stringify({ success: true, conversationId }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
