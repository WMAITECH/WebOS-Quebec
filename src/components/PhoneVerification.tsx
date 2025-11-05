import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Phone, Shield, Check, AlertCircle } from 'lucide-react';

interface PhoneVerificationProps {
  userId: string;
  onVerified?: () => void;
}

export function PhoneVerification({ userId, onVerified }: PhoneVerificationProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationId, setVerificationId] = useState('');

  async function sendVerificationCode() {
    setError('');
    setLoading(true);

    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      const { data, error: insertError } = await supabase
        .from('sms_verifications')
        .insert({
          user_id: userId,
          phone_number: phoneNumber,
          code,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setVerificationId(data.id);
      setStep('verify');

      console.log('Code de vérification (simulation SMS):', code);
      alert(`Code de vérification (simulation): ${code}`);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi du code');
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    setError('');
    setLoading(true);

    try {
      const { data: verification } = await supabase
        .from('sms_verifications')
        .select('*')
        .eq('id', verificationId)
        .maybeSingle();

      if (!verification) {
        throw new Error('Code de vérification introuvable');
      }

      if (new Date(verification.expires_at) < new Date()) {
        throw new Error('Code de vérification expiré');
      }

      if (verification.attempts >= 5) {
        throw new Error('Trop de tentatives. Demandez un nouveau code.');
      }

      if (verification.code !== verificationCode) {
        await supabase
          .from('sms_verifications')
          .update({ attempts: verification.attempts + 1 })
          .eq('id', verificationId);

        throw new Error('Code incorrect');
      }

      await supabase
        .from('sms_verifications')
        .update({ verified: true })
        .eq('id', verificationId);

      await supabase
        .from('users')
        .update({
          phone_number: phoneNumber,
          phone_verified: true,
          phone_verified_at: new Date().toISOString(),
        })
        .eq('id', userId);

      onVerified?.();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la vérification');
    } finally {
      setLoading(false);
    }
  }

  function formatPhoneNumber(value: string) {
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.startsWith('1')) {
      const match = cleaned.match(/^1(\d{0,3})(\d{0,3})(\d{0,4})$/);
      if (match) {
        return `+1 ${match[1]}${match[2] ? '-' + match[2] : ''}${match[3] ? '-' + match[3] : ''}`;
      }
    }

    return value;
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-zinc-900 rounded-xl border border-zinc-800">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-500/10 rounded-lg">
          <Shield className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">Vérification du téléphone</h2>
          <p className="text-sm text-zinc-400">Ajoutez votre numéro pour la 2FA</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {step === 'input' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Numéro de téléphone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                placeholder="+1 514-555-0123"
                className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-100"
              />
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Format: +1 XXX-XXX-XXXX (Québec/Canada)
            </p>
          </div>

          <button
            onClick={sendVerificationCode}
            disabled={!phoneNumber || loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors text-white"
          >
            {loading ? 'Envoi en cours...' : 'Envoyer le code'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Code de vérification
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-zinc-100 text-center text-2xl tracking-widest font-mono"
            />
            <p className="mt-2 text-xs text-zinc-500">
              Entrez le code à 6 chiffres envoyé à {phoneNumber}
            </p>
          </div>

          <button
            onClick={verifyCode}
            disabled={verificationCode.length !== 6 || loading}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors text-white flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            {loading ? 'Vérification...' : 'Vérifier'}
          </button>

          <button
            onClick={() => {
              setStep('input');
              setVerificationCode('');
              setError('');
            }}
            className="w-full py-2 text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            Changer de numéro
          </button>
        </div>
      )}

      <div className="mt-6 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
        <h3 className="text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Authentification à deux facteurs
        </h3>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Une fois votre numéro vérifié, vous pourrez activer la 2FA pour sécuriser votre compte.
          Un code sera envoyé à ce numéro à chaque connexion.
        </p>
      </div>
    </div>
  );
}
