import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const AI_ACCOUNTS = [
  { id: '00000000-0000-0000-0000-000000000001', email: 'ai.support@quebec.gouv.qc.ca', name: 'Assistant IA - Support', personality: 'helpful' },
  { id: '00000000-0000-0000-0000-000000000002', email: 'ai.info@quebec.gouv.qc.ca', name: 'Assistant IA - Info', personality: 'informative' },
  { id: '00000000-0000-0000-0000-000000000003', email: 'ai.conseiller@quebec.gouv.qc.ca', name: 'Assistant IA - Conseiller', personality: 'advisory' },
];

function generateResponse(personality: string, subject: string, body: string): string {
  const responses = {
    helpful: [
      `Merci pour votre message concernant "${subject}". Je suis là pour vous aider. Voici ce que je peux vous proposer :\n\n1. Vérifier les informations dans notre base de données\n2. Vous orienter vers le bon service\n3. Répondre à vos questions spécifiques\n\nPouvez-vous me fournir plus de détails sur votre demande?\n\nCordialement,\nAssistant IA - Support`,
      `Bonjour! J'ai bien reçu votre demande sur "${subject}". Je vais examiner cela attentivement. En attendant, voici quelques informations qui pourraient vous être utiles :\n\n• Nos services sont disponibles 24/7\n• Temps de réponse moyen : 2 heures\n• Pour une urgence, utilisez le canal prioritaire\n\nJe reviens vers vous rapidement.\n\nBien à vous,\nAssistant IA - Support`,
    ],
    informative: [
      `Bonjour,\n\nConcernant votre question sur "${subject}", voici les informations pertinentes :\n\n📋 Documentation disponible : www.quebec.gouv.qc.ca/docs\n📞 Ligne d'information : 1-800-QUEBEC\n🕐 Heures d'ouverture : 8h-20h du lundi au vendredi\n\nVotre message a été enregistré sous la référence #${Date.now().toString().slice(-6)}.\n\nCordialement,\nAssistant IA - Info`,
      `Merci de votre intérêt pour "${subject}". Voici un résumé des informations importantes :\n\n✓ Processus en ligne disponible\n✓ Délai de traitement : 5-10 jours ouvrables\n✓ Documents requis : pièce d'identité, preuve de résidence\n\nConsultez notre guide complet sur notre portail web.\n\nBien cordialement,\nAssistant IA - Info`,
    ],
    advisory: [
      `Bonjour,\n\nJ'ai analysé votre demande concernant "${subject}". En tant que conseiller, je vous recommande les étapes suivantes :\n\n1️⃣ Vérifiez votre éligibilité en ligne\n2️⃣ Rassemblez les documents nécessaires\n3️⃣ Soumettez votre demande via le portail sécurisé\n4️⃣ Suivez l'évolution avec votre numéro de dossier\n\nJe reste à votre disposition pour tout complément d'information.\n\nProfessionnellement,\nAssistant IA - Conseiller`,
      `Merci de faire appel à mes services pour "${subject}". Après examen de votre situation, je vous propose cette approche :\n\n💡 Recommandation : Procédure accélérée disponible\n⚠️ Attention : Date limite le 30 du mois\n📝 Action requise : Compléter le formulaire en ligne\n\nN'hésitez pas si vous avez besoin de clarifications.\n\nCordialement,\nAssistant IA - Conseiller`,
    ],
  };

  const options = responses[personality as keyof typeof responses] || responses.helpful;
  return options[Math.floor(Math.random() * options.length)];
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

    const { emailId } = await req.json();

    if (!emailId) {
      throw new Error('Missing emailId');
    }

    const { data: email, error: emailError } = await supabase
      .from('emails')
      .select('*, email_accounts!inner(*)')
      .eq('id', emailId)
      .single();

    if (emailError) throw emailError;
    if (!email) throw new Error('Email not found');

    const isAIAccount = AI_ACCOUNTS.some(ai => ai.email === email.email_accounts.email_address);
    if (!isAIAccount) {
      return new Response(
        JSON.stringify({ success: false, message: 'Not an AI account' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const aiAccount = AI_ACCOUNTS.find(ai => ai.email === email.email_accounts.email_address);
    if (!aiAccount) throw new Error('AI account not found');

    const responseBody = generateResponse(aiAccount.personality, email.subject, email.body_text);

    const threadId = email.thread_id || crypto.randomUUID();
    const sentAt = new Date().toISOString();

    const emailsToInsert = [];

    emailsToInsert.push({
      account_id: email.account_id,
      from_address: aiAccount.email,
      to_addresses: [email.from_address],
      subject: `Re: ${email.subject}`,
      body_text: responseBody,
      folder: 'sent',
      is_draft: false,
      thread_id: threadId,
      in_reply_to: email.id,
      sent_at: sentAt,
    });

    const { data: senderAccount } = await supabase
      .from('email_accounts')
      .select('id')
      .eq('email_address', email.from_address)
      .maybeSingle();

    if (senderAccount) {
      emailsToInsert.push({
        account_id: senderAccount.id,
        from_address: aiAccount.email,
        to_addresses: [email.from_address],
        subject: `Re: ${email.subject}`,
        body_text: responseBody,
        folder: 'inbox',
        is_draft: false,
        is_read: false,
        thread_id: threadId,
        in_reply_to: email.id,
        sent_at: sentAt,
      });
    }

    const { error: insertError } = await supabase
      .from('emails')
      .insert(emailsToInsert);

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'AI response sent',
        threadId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('AI Email Responder error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});