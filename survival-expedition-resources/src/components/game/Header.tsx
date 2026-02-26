import React, { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import {
  Skull, RotateCcw, AlertTriangle, X, Cloud, CloudOff,
  LogIn, LogOut, User, Loader2, Check, Download
} from 'lucide-react';

const Header: React.FC = () => {
  const {
    resetGame, state, user, authLoading, signIn, signUp, signOut,
    cloudSave, cloudLoad, cloudSaving, lastCloudSave,
  } = useGame();
  const [showReset, setShowReset] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const activeExps = state.expeditions.filter(e => !e.completed).length;
  const totalSurvivors = state.survivors.length;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);
    const fn = authMode === 'login' ? signIn : signUp;
    const err = await fn(email, password);
    setAuthSubmitting(false);
    if (err) {
      setAuthError(err);
    } else {
      if (authMode === 'signup') {
        setAuthError(null);
        setAuthMode('login');
        setShowAuth(false);
        setSaveMsg('Compte créé ! Connectez-vous.');
        setTimeout(() => setSaveMsg(null), 4000);
      } else {
        setShowAuth(false);
        setEmail('');
        setPassword('');
        setSaveMsg('Connecté ! Progression chargée.');
        setTimeout(() => setSaveMsg(null), 3000);
      }
    }
  };

  const handleCloudSave = async () => {
    const err = await cloudSave();
    if (err) {
      setSaveMsg(`Erreur: ${err}`);
    } else {
      setSaveMsg('Sauvegardé en ligne !');
    }
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const handleCloudLoad = async () => {
    const err = await cloudLoad();
    if (err) {
      setSaveMsg(`Erreur: ${err}`);
    } else {
      setSaveMsg('Progression chargée depuis le cloud !');
    }
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  return (
    <>
      <header className="bg-zinc-950/80 border-b border-zinc-800 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-600 to-red-700 flex items-center justify-center shadow-lg shadow-amber-900/30">
                <Skull className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black text-zinc-100 font-mono tracking-tight leading-none">
                  WASTELAND<span className="text-amber-500">CMD</span>
                </h1>
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Centre de Commandement</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden md:flex items-center gap-3 text-xs font-mono text-zinc-500 mr-2">
              <span>{totalSurvivors} survivant{totalSurvivors > 1 ? 's' : ''}</span>
              <span className="text-zinc-700">|</span>
              <span className={activeExps > 0 ? 'text-blue-400' : ''}>{activeExps} expédition{activeExps > 1 ? 's' : ''}</span>
            </div>

            {/* Cloud save/load buttons */}
            {user && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCloudSave}
                  disabled={cloudSaving}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-emerald-700/30 border border-emerald-600/40 text-emerald-400 text-xs font-mono hover:bg-emerald-700/50 transition-colors disabled:opacity-50"
                  title="Sauvegarder en ligne"
                >
                  {cloudSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">Sauvegarder</span>
                </button>
                <button
                  onClick={handleCloudLoad}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-blue-700/30 border border-blue-600/40 text-blue-400 text-xs font-mono hover:bg-blue-700/50 transition-colors"
                  title="Charger depuis le cloud"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Charger</span>
                </button>
              </div>
            )}

            {/* Auth button */}
            {authLoading ? (
              <Loader2 className="w-4 h-4 text-zinc-600 animate-spin" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex items-center gap-1.5 text-xs font-mono text-zinc-500" title={user.email || ''}>
                  <User className="w-3.5 h-3.5 text-amber-500" />
                  <span className="max-w-[120px] truncate">{user.email}</span>
                  {lastCloudSave && (
                    <span className="text-zinc-600 text-[10px]">({formatDate(lastCloudSave)})</span>
                  )}
                </div>
                <button
                  onClick={signOut}
                  className="text-zinc-600 hover:text-red-400 transition-colors p-1.5 rounded hover:bg-zinc-800"
                  title="Déconnexion"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setShowAuth(true); setAuthError(null); }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-amber-700/30 border border-amber-600/40 text-amber-400 text-xs font-mono hover:bg-amber-700/50 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Connexion</span>
              </button>
            )}

            <button
              onClick={() => setShowReset(true)}
              className="text-zinc-600 hover:text-red-400 transition-colors p-1.5 rounded hover:bg-zinc-800"
              title="Réinitialiser la partie"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Save message toast */}
        {saveMsg && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50">
            <div className={`px-4 py-2 rounded-lg text-xs font-mono shadow-xl border ${
              saveMsg.startsWith('Erreur')
                ? 'bg-red-900/90 border-red-700 text-red-300'
                : 'bg-emerald-900/90 border-emerald-700 text-emerald-300'
            }`}>
              {saveMsg.startsWith('Erreur') ? <CloudOff className="w-3 h-3 inline mr-1.5" /> : <Check className="w-3 h-3 inline mr-1.5" />}
              {saveMsg}
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h3 className="font-bold text-zinc-200 font-mono">
                {authMode === 'login' ? 'Connexion' : 'Créer un Compte'}
              </h3>
              <button onClick={() => setShowAuth(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAuth} className="p-4 space-y-3">
              <p className="text-xs text-zinc-400 font-mono">
                {authMode === 'login'
                  ? 'Connectez-vous pour synchroniser votre progression entre appareils.'
                  : 'Créez un compte pour sauvegarder votre progression en ligne.'}
              </p>
              <div>
                <label className="text-xs text-zinc-500 font-mono block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="commandant@wasteland.com"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 font-mono block mb-1">Mot de passe</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="Min. 6 caractères"
                />
              </div>
              {authError && (
                <div className="text-xs text-red-400 font-mono bg-red-900/20 border border-red-800/30 rounded px-3 py-2">
                  {authError}
                </div>
              )}
              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded bg-amber-600 hover:bg-amber-500 text-black font-bold font-mono text-sm transition-colors disabled:opacity-50"
              >
                {authSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                {authMode === 'login' ? 'Se Connecter' : 'Créer le Compte'}
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError(null); }}
                className="w-full text-xs text-zinc-500 hover:text-amber-400 font-mono transition-colors py-1"
              >
                {authMode === 'login' ? 'Pas de compte ? Créer un compte' : 'Déjà un compte ? Se connecter'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Reset confirmation modal */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-red-800/50 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-900/30">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-zinc-200">Réinitialiser la partie ?</h3>
                <p className="text-xs text-zinc-500">Cette action est irréversible.</p>
              </div>
            </div>
            <p className="text-sm text-zinc-400 mb-4">
              Toute votre progression sera perdue : survivants, bâtiments, ressources et équipement.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowReset(false)}
                className="flex-1 py-2 rounded bg-zinc-800 text-zinc-300 text-sm font-mono hover:bg-zinc-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => { resetGame(); setShowReset(false); }}
                className="flex-1 py-2 rounded bg-red-700 text-white text-sm font-mono font-bold hover:bg-red-600 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
