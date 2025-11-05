import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface IncomingEmail {
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  text: string;
  html?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const incomingEmail: IncomingEmail = await req.json();
    const { from, to, cc, subject, text, html } = incomingEmail;

    const threadId = crypto.randomUUID();
    const sentAt = new Date().toISOString();
    const emailsToInsert = [];

    for (const recipientEmail of to) {
      const { data: recipientAccount } = await supabase
        .from('email_accounts')
        .select('id')
        .eq('email_address', recipientEmail.trim())
        .maybeSingle();

      if (recipientAccount) {
        emailsToInsert.push({
          account_id: recipientAccount.id,
          from_address: from,
          to_addresses: to,
          cc_addresses: cc || [],
          subject: subject || '(Sans objet)',
          body_text: text,
          body_html: html,
          folder: 'inbox',
          is_draft: false,
          is_read: false,
          thread_id: threadId,
          sent_at: sentAt,
        });
      }
    }

    if (emailsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('emails')
        .insert(emailsToInsert);

      if (insertError) {
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email received successfully',
        processed: emailsToInsert.length,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Receive email error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});