import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      alert('Erro: ' + error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-blue-900 mb-6">ClinIQ Tech</h1>
        
        {sent ? (
          <div className="text-center p-4 bg-green-50 text-green-700 rounded-lg">
            <h3 className="font-bold">Verifique seu E-mail!</h3>
            <p>Enviamos um link para <strong>{email}</strong></p>
            <button onClick={() => setSent(false)} className="mt-4 text-blue-600 underline">Voltar</button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">E-mail Corporativo</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded border-slate-300"
                placeholder="seu@email.com"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700"
            >
              {loading ? 'Enviando...' : 'Entrar no Sistema'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}