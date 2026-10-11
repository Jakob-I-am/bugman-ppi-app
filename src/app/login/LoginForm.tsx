'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [passkeyError, setPasskeyError] = useState('');

  // Passkey autofill: browsers that support it offer the saved passkey when the email field is focused.
  useEffect(() => {
    if (
      typeof PublicKeyCredential === 'undefined' ||
      !PublicKeyCredential.isConditionalMediationAvailable
    )
      return;
    let cancelled = false;
    PublicKeyCredential.isConditionalMediationAvailable().then((ok) => {
      if (!ok || cancelled) return;
      authClient.signIn.passkey({ autoFill: true }).then((res) => {
        if (!cancelled && !res?.error) {
          router.push('/admin');
          router.refresh();
        }
      });
    });
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function signInWithPasskey() {
    setPasskeyError('');
    setPasskeyBusy(true);
    const res = await authClient.signIn.passkey();
    setPasskeyBusy(false);
    if (res?.error) {
      setPasskeyError(
        "That didn't work. Try again, or use the email link below.",
      );
      return;
    }
    // The admin area sends anyone who isn't the admin to their reports.
    router.push('/admin');
    router.refresh();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('sending');
    await authClient.signIn.magicLink({
      email: email.trim().toLowerCase(),
      callbackURL: '/portal',
      errorCallbackURL: '/login?error=link',
    });
    // Same message whether or not the email has an account, so nobody can probe for clients.
    setState('sent');
  }

  if (state === 'sent') {
    return (
      <div role='status'>
        <p className='font-semibold'>Check your inbox.</p>
        <p className='mt-1 text-stone'>
          If {email} has a report with us, a sign-in link is on its way. It
          expires in 15 minutes.
        </p>
        <button
          className='mt-4 text-sm font-semibold text-pine underline'
          onClick={() => setState('idle')}
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className='grid gap-6'>
      <form
        onSubmit={onSubmit}
        className='grid gap-4'
      >
        <div>
          <label
            className='label'
            htmlFor='email'
          >
            Email address
          </label>
          <input
            className='input'
            id='email'
            type='email'
            autoComplete='email webauthn'
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button
          className='btn-primary'
          disabled={state === 'sending'}
        >
          {state === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
        </button>
      </form>

      <div className='border-t border-line pt-5'>
        <p className='text-sm text-stone'>Bugman Employee?</p>
        <button
          type='button'
          className='btn-quiet mt-2 w-full'
          onClick={signInWithPasskey}
          disabled={passkeyBusy}
        >
          {passkeyBusy ? 'Waiting for your device…' : 'Sign in with a passkey'}
        </button>
        {passkeyError && (
          <p
            role='alert'
            className='mt-2 text-sm text-red-800'
          >
            {passkeyError}
          </p>
        )}
      </div>
    </div>
  );
}
