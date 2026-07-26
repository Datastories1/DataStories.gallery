'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyUserPage() {
  const router = useRouter();
  const [enteredCode, setEnteredCode] = useState('');
  const [error, setError] = useState('');

  const handleVerify = (e) => {
    e.preventDefault();

    if (enteredCode === "1234") { // replace with actual check
      router.push('/reset-password');
    } else {
      setError("Incorrect code");
    }
  };

  return (
    <div className="container" style={{ maxWidth: '400px', margin: '80px auto' }}>
      <h2>Verify Code</h2>
      <form onSubmit={handleVerify} className="form" style={{ marginTop: '20px' }}>
        <input
          type="text"
          className="input"
          placeholder="Enter 4-digit code"
          value={enteredCode}
          onChange={(e) => setEnteredCode(e.target.value)}
        />
        {error && <p style={{ color: 'red', fontSize: '14px', marginBottom: '10px' }}>{error}</p>}
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
          Verify
        </button>
      </form>
    </div>
  );
}