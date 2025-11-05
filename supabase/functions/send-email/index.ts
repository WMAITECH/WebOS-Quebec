import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface EmailRequest {
  to: string | string[];
  cc?: string[];
  subject: string;
  body: string;
  threadId?: string;
  inReplyTo?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const emailRequest: EmailRequest = await req.json();
    const { to, cc, subject, body, threadId, inReplyTo } = emailRequest;

    const { data: account } = await supabase
      .from('email_accounts')
      .select('id, email_address, signature')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!account) {
      throw new Error('Email account not found');
    }

    const bodyWithSignature = body + (account.signature || '');
    const toAddresses = Array.isArray(to) ? to : [to];
    const ccAddresses = cc || [];
    const allRecipients = [...toAddresses, ...ccAddresses];
    const finalThreadId = threadId || crypto.randomUUID();
    const sentAt = new Date().toISOString();

    const emailsToInsert = [];

    emailsToInsert.push({
      account_id: account.id,
      from_address: account.email_address,
      to_addresses: toAddresses,
      cc_addresses: ccAddresses,
      subject: subject,
      body_text: bodyWithSignature,
      folder: 'sent',
      is_draft: false,
      thread_id: finalThreadId,
      in_reply_to: inReplyTo,
      sent_at: sentAt,
    });

    for (const recipientEmail of allRecipients) {
      const { data: recipientAccount } = await supabase
        .from('email_accounts')
        .select('id')
        .eq('email_address', recipientEmail.trim())
        .maybeSingle();

      if (recipientAccount) {
        emailsToInsert.push({
          account_id: recipientAccount.id,
          from_address: account.email_address,
          to_addresses: toAddresses,
          cc_addresses: ccAddresses,
          subject: subject,
          body_text: bodyWithSignature,
          folder: 'inbox',
          is_draft: false,
          is_read: false,
          thread_id: finalThreadId,
          in_reply_to: inReplyTo,
          sent_at: sentAt,
        });
      }
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey) {
      try {
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: `${account.email_address.split('@')[0]} <onboarding@resend.dev>`,
            to: toAddresses,
            cc: ccAddresses.length > 0 ? ccAddresses : undefined,
            subject: subject,
            text: bodyWithSignature,
            reply_to: account.email_address,
          }),
        });

        if (!resendResponse.ok) {
          console.error('Resend API error:', await resendResponse.text());
        }
      } catch (resendError) {
        console.error('Failed to send via Resend:', resendError);
      }
    }

    const { error: insertError } = await supabase
      .from('emails')
      .insert(emailsToInsert);

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        threadId: finalThreadId,
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
    console.error('Send email error:', error);
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