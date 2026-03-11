/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  Terminal, 
  Cpu, 
  Layout, 
  Zap,
  RefreshCw,
  Code2,
  ArrowRight,
  Layers,
  MousePointer2,
  Github,
  Twitter,
  Search,
  Box,
  Shield,
  Rocket,
  X,
  History,
  Trash2,
  Save,
  Clock,
  User,
  Users,
  LogOut,
  UserCircle,
  BookOpen,
  Play,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Markdown from 'react-markdown';
import { generateOptimizedPrompt } from './services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Toaster, toast } from 'sonner';
import { SavedPrompt, User as UserType } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const QUICK_STARTS = [
  { label: "SaaS de Facturation", icon: <Layers className="w-4 h-4" /> },
  { label: "App de Fitness avec IA", icon: <Zap className="w-4 h-4" /> },
  { label: "Marketplace de NFT", icon: <Layout className="w-4 h-4" /> },
  { label: "Dashboard Analytics", icon: <Cpu className="w-4 h-4" /> },
];

const LOADING_STEPS = [
  "Analyse de votre concept...",
  "Définition de l'architecture logicielle...",
  "Sélection de la stack technologique...",
  "Conception de l'expérience utilisateur...",
  "Optimisation du prompt pour l'IA...",
  "Finalisation du blueprint technique..."
];

export default function App() {
  const [description, setDescription] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [showProModal, setShowProModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showGenericModal, setShowGenericModal] = useState<{show: boolean, title: string, content: React.ReactNode}>({
    show: false,
    title: '',
    content: null
  });
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [user, setUser] = useState<UserType | null>(null);
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    name: '',
    company: '',
    job_title: ''
  });
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        checkAuth();
        setShowAuthModal(false);
        toast.success("Connexion réussie !");
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    // Check if user is logged in
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (showAdminModal && user?.role === 'admin') {
      fetch('/api/admin/users')
        .then(res => res.json())
        .then(data => {
          if (data.users) setAllUsers(data.users);
        });
    }
  }, [showAdminModal, user]);

  useEffect(() => {
    const saved = localStorage.getItem('saved_prompts');
    if (saved) {
      try {
        setSavedPrompts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved prompts", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('saved_prompts', JSON.stringify(savedPrompts));
  }, [savedPrompts]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 2500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // Validation
    if (description.trim().length < 10) {
      setValidationError("La description doit faire au moins 10 caractères.");
      toast.error("Description trop courte");
      return;
    }
    
    if (description.length > 2000) {
      setValidationError("La description ne doit pas dépasser 2000 caractères.");
      toast.error("Description trop longue");
      return;
    }

    setValidationError(null);
    if (isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedPrompt(null);
    setIsMobileMenuOpen(false);

    try {
      const result = await generateOptimizedPrompt(description);
      setGeneratedPrompt(result || "Désolé, aucune réponse n'a été générée.");
      toast.success("Architecture générée avec succès !");
      
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setError("Une erreur est survenue lors de la génération. Veuillez réessayer.");
      toast.error("Échec de la génération.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedPrompt) {
      navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      toast.success("Prompt copié dans le presse-papier");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleComingSoon = (feature: string) => {
    toast.info(`${feature} arrive bientôt !`);
  };

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Erreur d\'authentification');
      }
      
      setUser(data.user);
      setShowAuthModal(false);
      toast.success(authMode === 'login' ? 'Connexion réussie !' : 'Inscription réussie !');
      setAuthForm({ email: '', password: '', name: '', company: '', job_title: '' });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleOAuth = async (provider: 'github' | 'twitter') => {
    try {
      const res = await fetch(`/api/auth/${provider}/url`);
      const { url } = await res.json();
      window.open(url, 'oauth_popup', 'width=600,height=700');
    } catch (err) {
      toast.error(`Erreur de connexion avec ${provider}`);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    toast.success('Déconnexion réussie');
  };

  const savePrompt = () => {
    if (!generatedPrompt || !description) return;
    
    const newSaved: SavedPrompt = {
      id: crypto.randomUUID(),
      title: description.slice(0, 40) + (description.length > 40 ? '...' : ''),
      description,
      prompt: generatedPrompt,
      timestamp: Date.now()
    };

    setSavedPrompts(prev => [newSaved, ...prev]);
    toast.success("Architecture sauvegardée dans l'historique !");
  };

  const deletePrompt = (id: string) => {
    setSavedPrompts(prev => prev.filter(p => p.id !== id));
    toast.success("Entrée supprimée");
  };

  const loadPrompt = (saved: SavedPrompt) => {
    setDescription(saved.description);
    setGeneratedPrompt(saved.prompt);
    setShowHistoryModal(false);
    toast.success("Architecture chargée !");
    
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <div className="min-h-screen flex flex-col mesh-gradient overflow-x-hidden">
      <Toaster position="bottom-right" theme="dark" />
      
      {/* Generic Modal */}
      <AnimatePresence>
        {showGenericModal.show && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-panel max-w-md w-full p-6 md:p-8 bg-brand-card relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setShowGenericModal({ ...showGenericModal, show: false })}
                className="absolute top-4 right-4 text-gray-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black mb-4">{showGenericModal.title}</h2>
              <div className="text-gray-400 text-sm leading-relaxed">
                {showGenericModal.content}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Documentation Modal */}
      <AnimatePresence>
        {showDocModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-panel max-w-2xl w-full p-6 md:p-8 bg-brand-card relative max-h-[90vh] flex flex-col"
            >
              <button 
                onClick={() => setShowDocModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-brand-primary/20 rounded-xl flex items-center justify-center">
                  <BookOpen className="text-brand-primary w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black">Documentation</h2>
                  <p className="text-gray-400 text-sm">Guide d'utilisation de PromptArchitect</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6 text-gray-300">
                <section>
                  <h3 className="text-white font-bold mb-2">1. Introduction</h3>
                  <p className="text-sm leading-relaxed">PromptArchitect est une plateforme d'IA conçue pour transformer vos idées de logiciels en architectures techniques détaillées. Nous utilisons Gemini 3.1 Pro pour garantir une précision maximale.</p>
                </section>
                <section>
                  <h3 className="text-white font-bold mb-2">2. Comment générer une architecture ?</h3>
                  <ul className="text-sm space-y-2 list-disc pl-4">
                    <li>Saisissez une description claire de votre projet dans la zone de texte principale.</li>
                    <li>Cliquez sur "Générer" pour lancer le processus.</li>
                    <li>L'IA analysera votre concept et produira un blueprint complet (stack, UI, backend, etc.).</li>
                  </ul>
                </section>
                <section>
                  <h3 className="text-white font-bold mb-2">3. Sauvegarde et Historique</h3>
                  <p className="text-sm leading-relaxed">Une fois connecté, vous pouvez sauvegarder vos architectures. Elles seront accessibles dans votre onglet "Historique" pour une consultation ultérieure.</p>
                </section>
                <section>
                  <h3 className="text-white font-bold mb-2">4. Rôles Utilisateurs</h3>
                  <p className="text-sm leading-relaxed">Les administrateurs ont accès au panneau de gestion des utilisateurs, tandis que les utilisateurs standards peuvent gérer leurs propres projets.</p>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-panel max-w-md w-full p-6 md:p-8 bg-brand-card relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-brand-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UserCircle className="text-brand-primary w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black">{authMode === 'login' ? 'Connexion' : 'Inscription'}</h2>
                <p className="text-gray-400 text-sm mt-2">
                  {authMode === 'login' ? 'Accédez à vos architectures sauvegardées' : 'Créez un compte pour sauvegarder vos projets'}
                </p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                {authMode === 'register' && (
                  <>
                    <input 
                      type="text" 
                      placeholder="Nom complet"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-primary outline-none transition-all"
                      value={authForm.name}
                      onChange={e => setAuthForm({...authForm, name: e.target.value})}
                      required
                    />
                    <input 
                      type="text" 
                      placeholder="Entreprise"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-primary outline-none transition-all"
                      value={authForm.company}
                      onChange={e => setAuthForm({...authForm, company: e.target.value})}
                    />
                    <input 
                      type="text" 
                      placeholder="Poste / Titre"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-primary outline-none transition-all"
                      value={authForm.job_title}
                      onChange={e => setAuthForm({...authForm, job_title: e.target.value})}
                    />
                  </>
                )}
                <input 
                  type="email" 
                  placeholder="Email"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-primary outline-none transition-all"
                  value={authForm.email}
                  onChange={e => setAuthForm({...authForm, email: e.target.value})}
                  required
                />
                <input 
                  type="password" 
                  placeholder="Mot de passe"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-brand-primary outline-none transition-all"
                  value={authForm.password}
                  onChange={e => setAuthForm({...authForm, password: e.target.value})}
                  required
                />
                <button 
                  type="submit"
                  className="w-full bg-brand-primary text-black py-4 rounded-xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {authMode === 'login' ? 'Se connecter' : 'S\'inscrire'}
                </button>
              </form>

              <div className="mt-6 space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-brand-card px-2 text-gray-500">Ou continuer avec</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleOAuth('github')}
                    className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-xl py-3 hover:bg-white/10 transition-all text-sm font-bold"
                  >
                    <Github className="w-5 h-5" />
                    GitHub
                  </button>
                  <button 
                    onClick={() => handleOAuth('twitter')}
                    className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-xl py-3 hover:bg-white/10 transition-all text-sm font-bold"
                  >
                    <Twitter className="w-5 h-5" />
                    Twitter
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button 
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                  className="text-sm text-gray-400 hover:text-brand-primary transition-colors"
                >
                  {authMode === 'login' ? 'Pas encore de compte ? S\'inscrire' : 'Déjà un compte ? Se connecter'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Modal */}
      <AnimatePresence>
        {showAdminModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-panel max-w-4xl w-full p-6 md:p-8 bg-brand-card relative max-h-[90vh] flex flex-col"
            >
              <button 
                onClick={() => setShowAdminModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-brand-primary/20 rounded-xl flex items-center justify-center">
                  <Shield className="text-brand-primary w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black">Administration</h2>
                  <p className="text-gray-400 text-sm">Gestion des utilisateurs de la plateforme</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px] md:min-w-0">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/5">
                        <th className="pb-4 font-bold">Utilisateur</th>
                        <th className="pb-4 font-bold">Rôle</th>
                        <th className="pb-4 font-bold">Entreprise</th>
                        <th className="pb-4 font-bold">Date</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {allUsers.map(u => (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="py-4">
                            <div className="font-bold text-white whitespace-nowrap">{u.name || 'Sans nom'}</div>
                            <div className="text-xs text-gray-500">{u.email}</div>
                          </td>
                          <td className="py-4">
                            <span className={cn(
                              "px-2 py-1 rounded-md text-[10px] font-bold uppercase",
                              u.role === 'admin' ? "bg-brand-primary/20 text-brand-primary" : "bg-white/10 text-gray-400"
                            )}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-4">
                            <div className="text-gray-400 whitespace-nowrap">{u.company || '-'}</div>
                            <div className="text-[10px] text-gray-600 whitespace-nowrap">{u.job_title}</div>
                          </td>
                          <td className="py-4 text-gray-500 text-xs whitespace-nowrap">
                            {/* @ts-ignore */}
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Modal */}
      <AnimatePresence>
        {showHistoryModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-panel max-w-2xl w-full p-6 md:p-8 bg-brand-card relative max-h-[90vh] flex flex-col"
            >
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-brand-primary/20 rounded-xl flex items-center justify-center">
                  <History className="text-brand-primary w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black">Historique</h2>
                  <p className="text-gray-400 text-sm">Vos architectures sauvegardées localement</p>
                </div>
              </div>

              {savedPrompts.length > 0 && (
                <div className="flex justify-end mb-4">
                  <button 
                    onClick={() => {
                      if (confirm("Voulez-vous vraiment supprimer tout l'historique ?")) {
                        setSavedPrompts([]);
                        toast.success("Historique vidé");
                      }
                    }}
                    className="text-[10px] font-bold text-red-500/60 hover:text-red-500 uppercase tracking-widest flex items-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Tout supprimer
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                {savedPrompts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="text-gray-600 w-8 h-8" />
                    </div>
                    <p className="text-gray-500 font-bold">Aucune sauvegarde pour le moment</p>
                  </div>
                ) : (
                  savedPrompts.map((saved) => (
                    <div 
                      key={saved.id}
                      className="group p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-brand-primary/30 transition-all flex items-center justify-between gap-4"
                    >
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => loadPrompt(saved)}
                      >
                        <h4 className="font-bold text-white group-hover:text-brand-primary transition-colors line-clamp-1">{saved.title}</h4>
                        <p className="text-[10px] text-gray-500 font-mono mt-1">
                          {new Date(saved.timestamp).toLocaleDateString('fr-FR', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => loadPrompt(saved)}
                          className="p-2 text-gray-400 hover:text-brand-primary transition-colors"
                          title="Charger"
                        >
                          <ArrowRight className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => deletePrompt(saved.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pro Modal */}
      <AnimatePresence>
        {showProModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-panel max-w-md w-full p-6 md:p-8 bg-brand-card relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setShowProModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Rocket className="text-brand-primary w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black mb-2">Passez au Niveau Pro</h2>
                <p className="text-gray-400 mb-8">Débloquez des modèles plus puissants, des templates illimités et une API dédiée.</p>
                <div className="space-y-4 mb-8">
                  {[
                    { icon: <Zap className="w-4 h-4" />, text: "Accès à Gemini 3.1 Ultra" },
                    { icon: <Shield className="w-4 h-4" />, text: "Générations illimitées" },
                    { icon: <Box className="w-4 h-4" />, text: "Export direct vers GitHub" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-left bg-white/5 p-3 rounded-xl">
                      <div className="text-brand-primary">{item.icon}</div>
                      <span className="text-sm font-bold">{item.text}</span>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => handleComingSoon("Paiement Pro")}
                  className="w-full bg-brand-primary text-black py-4 rounded-2xl font-black text-lg hover:scale-105 transition-transform"
                >
                  S'abonner - 19€/mois
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b",
        scrolled ? "bg-brand-bg/90 backdrop-blur-xl border-brand-border py-3" : "bg-transparent border-transparent py-5 md:py-6"
      )}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 group cursor-pointer shrink-0" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-brand-primary rounded-lg md:rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(0,255,0,0.3)] group-hover:scale-110 transition-transform">
              <Code2 className="text-black w-5 h-5 md:w-6 md:h-6" />
            </div>
            <span className="font-extrabold text-lg md:text-2xl tracking-tighter">
              Prompt<span className="text-brand-primary hidden xs:inline">Architect</span>
              <span className="text-brand-primary xs:hidden">A</span>
            </span>
          </div>
          
          <div className="hidden lg:flex items-center gap-8 text-sm font-semibold text-gray-400">
            <button onClick={() => setShowDocModal(true)} className="hover:text-white transition-colors">Fonctionnement</button>
            <button onClick={() => setShowHistoryModal(true)} className="hover:text-white transition-colors flex items-center gap-2">
              <History className="w-4 h-4" />
              Historique
            </button>
            <button onClick={() => {
              const el = document.getElementById('showcase');
              el?.scrollIntoView({ behavior: 'smooth' });
            }} className="hover:text-white transition-colors">Showcase</button>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                {user.role === 'admin' && (
                  <button 
                    onClick={() => setShowAdminModal(true)}
                    className="hidden lg:flex items-center gap-2 text-brand-primary hover:text-white transition-colors font-bold text-xs uppercase tracking-widest"
                  >
                    <Users className="w-4 h-4" />
                    Admin
                  </button>
                )}
                <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                  <div className="w-6 h-6 bg-brand-primary/20 rounded-full flex items-center justify-center">
                    <User className="text-brand-primary w-3 h-3" />
                  </div>
                  <span className="text-xs font-bold text-gray-300 hidden sm:block">{user.name || user.email.split('@')[0]}</span>
                  <button 
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setAuthMode('login');
                  setShowAuthModal(true);
                }} 
                className="hidden sm:flex items-center gap-2 text-gray-400 hover:text-white transition-colors font-medium text-sm px-4"
              >
                Connexion
              </button>
            )}
            <button 
              onClick={() => setShowProModal(true)}
              className="bg-white text-black px-4 md:px-6 py-2 md:py-2.5 rounded-full text-xs md:text-sm font-bold hover:bg-brand-primary hover:scale-105 transition-all shadow-lg active:scale-95"
            >
              {user?.role === 'admin' ? 'Dashboard Pro' : 'Essayer Pro'}
            </button>
            <button 
              className="lg:hidden p-2 text-gray-400 hover:text-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-brand-bg border-b border-brand-border overflow-hidden"
            >
              <div className="px-4 py-6 flex flex-col gap-4">
                <button onClick={() => { setShowDocModal(true); setIsMobileMenuOpen(false); }} className="text-left text-lg font-bold text-gray-400 hover:text-white py-2">Fonctionnement</button>
                <button onClick={() => setShowHistoryModal(true)} className="text-left text-lg font-bold text-gray-400 hover:text-white py-2 flex items-center gap-3">
                  <History className="w-5 h-5" />
                  Historique
                </button>
                {user?.role === 'admin' && (
                  <button onClick={() => setShowAdminModal(true)} className="text-left text-lg font-bold text-brand-primary hover:text-white py-2 flex items-center gap-3">
                    <Users className="w-5 h-5" />
                    Administration
                  </button>
                )}
                <button onClick={() => {
                  const el = document.getElementById('showcase');
                  el?.scrollIntoView({ behavior: 'smooth' });
                  setIsMobileMenuOpen(false);
                }} className="text-left text-lg font-bold text-gray-400 hover:text-white py-2">Showcase</button>
                <hr className="border-brand-border" />
                {user ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 py-2">
                      <div className="w-10 h-10 bg-brand-primary/20 rounded-full flex items-center justify-center">
                        <User className="text-brand-primary w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white font-bold">{user.name || user.email}</span>
                        <span className="text-xs text-gray-500 uppercase tracking-widest">{user.role}</span>
                      </div>
                    </div>
                    <button onClick={handleLogout} className="w-full bg-white/5 text-red-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-2">
                      <LogOut className="w-5 h-5" />
                      Déconnexion
                    </button>
                  </div>
                ) : (
                  <button onClick={() => { setShowAuthModal(true); setIsMobileMenuOpen(false); }} className="w-full bg-white text-black py-4 rounded-2xl font-bold">Connexion / Inscription</button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto px-4 md:px-6 pt-24 md:pt-32 pb-16 md:pb-24 w-full relative">
        {/* Decorative Elements */}
        <div className="hidden md:block absolute top-40 left-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-[120px] -z-10" />
        <div className="hidden md:block absolute bottom-40 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[150px] -z-10" />

        {/* Hero Section */}
        <section className="text-center mb-12 md:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1 md:py-1.5 rounded-full bg-white/5 border border-white/10 text-brand-primary text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] mb-6 md:mb-8 animate-float">
              <Sparkles className="w-3 md:w-3.5 h-3 md:h-3.5" />
              Gemini 3.1 Pro Powered
            </div>
            <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-extrabold mb-6 md:mb-8 tracking-tight leading-[1.1] md:leading-[0.9] max-w-4xl mx-auto px-2">
              L'architecture de vos <span className="text-brand-primary">idées</span> commence ici.
            </h1>
            <p className="text-gray-400 text-base md:text-xl max-w-2xl mx-auto leading-relaxed mb-8 md:mb-12 px-4">
              Transformez une simple pensée en une architecture logicielle complète. Générez des prompts optimisés en quelques secondes.
            </p>
          </motion.div>
        </section>

        {/* Main Interface */}
        <section className="max-w-4xl mx-auto mb-16 md:mb-24">
          <motion.div 
            className="glass-panel p-1 md:p-1.5 shadow-2xl relative"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-brand-bg/40 rounded-[20px] md:rounded-[22px] p-5 md:p-10">
              <form onSubmit={handleGenerate} className="space-y-6 md:space-y-8">
                <div className="relative group input-glow">
                  <div className="flex items-center justify-between mb-4 md:mb-6">
                    <div className="flex items-center gap-2 md:gap-3 text-brand-primary/40">
                      <Terminal className="w-4 h-4 md:w-5 h-5" />
                      <span className="font-mono text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-bold">Blueprint Specification</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 text-[9px] font-bold text-gray-500 uppercase tracking-widest border border-white/5">
                      <MousePointer2 className="w-3 h-3" />
                      Interactive Editor
                    </div>
                  </div>

                  <textarea
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="Décrivez votre vision..."
                    className="w-full bg-transparent border-none focus:ring-0 text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white placeholder:text-white/5 min-h-[120px] md:min-h-[220px] resize-none font-bold leading-[1.2] custom-scrollbar transition-all duration-500"
                    disabled={isGenerating}
                  />
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      {validationError && (
                        <span className="text-red-500 text-xs font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {validationError}
                        </span>
                      )}
                    </div>
                    <div className={cn(
                      "text-[10px] font-mono font-bold tracking-widest uppercase transition-colors",
                      description.length >= 2000 ? "text-red-500" : 
                      description.length >= 10 ? "text-brand-primary/40" : "text-gray-500"
                    )}>
                      {description.length} / 2000
                    </div>
                  </div>
                  
                  <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-700" />
                </div>

                {/* Quick Starts */}
                <div className="flex flex-wrap gap-2 pt-4 md:pt-8">
                  <span className="text-[9px] md:text-[10px] text-gray-600 uppercase font-bold tracking-widest w-full mb-1 md:mb-2">Suggestions rapides</span>
                  {QUICK_STARTS.map((item, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setDescription(item.label)}
                      className="flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-full bg-white/[0.03] border border-white/5 hover:border-brand-primary/40 hover:bg-brand-primary/5 transition-all text-xs md:text-sm font-semibold text-gray-400 hover:text-white group"
                    >
                      <span className="opacity-50 group-hover:opacity-100 transition-opacity">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 md:pt-8 border-t border-white/5">
                  <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto justify-center md:justify-start">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-gray-600 uppercase font-bold tracking-widest mb-1">Model</span>
                      <div className="flex items-center gap-2 text-[10px] md:text-xs font-semibold text-gray-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
                        Gemini 3.1 Pro
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] text-gray-600 uppercase font-bold tracking-widest mb-1">Latency</span>
                      <div className="flex items-center gap-2 text-[10px] md:text-xs font-semibold text-gray-400">
                        Ultra Low
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!description.trim() || isGenerating}
                    className={cn(
                      "w-full md:w-auto px-6 md:px-10 py-4 md:py-5 rounded-xl md:rounded-2xl font-bold flex items-center justify-center gap-3 md:gap-4 transition-all text-base md:text-lg shadow-xl",
                      description.trim() && !isGenerating 
                        ? "bg-brand-primary text-black hover:scale-105 active:scale-95 cursor-pointer hover:shadow-[0_0_30px_rgba(0,255,0,0.4)]" 
                        : "bg-white/5 text-gray-600 cursor-not-allowed"
                    )}
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-5 md:w-6 h-5 md:h-6 animate-spin" />
                        Architecturation...
                      </>
                    ) : (
                      <>
                        Générer
                        <ArrowRight className="w-5 md:w-6 h-5 md:h-6" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </section>

        {/* Loading State Animation */}
        <AnimatePresence>
          {isGenerating && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto mb-24 text-center"
            >
              <div className="relative w-32 h-32 mx-auto mb-8">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-4 border-dashed border-brand-primary/30 rounded-full"
                />
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-4 border-4 border-dashed border-brand-primary/20 rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Cpu className="w-12 h-12 text-brand-primary" />
                  </motion.div>
                </div>
              </div>
              
              <div className="space-y-4">
                <motion.h3 
                  key={loadingStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-2xl font-black text-white"
                >
                  {LOADING_STEPS[loadingStep]}
                </motion.h3>
                <div className="w-64 h-1.5 bg-white/5 rounded-full mx-auto overflow-hidden">
                  <motion.div 
                    className="h-full bg-brand-primary"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 15, ease: "linear" }}
                  />
                </div>
                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Calcul de l'architecture optimale</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto bg-red-500/10 border border-red-500/20 text-red-500 p-4 md:p-5 rounded-xl md:rounded-2xl mb-8 md:mb-12 flex items-center gap-3 md:gap-4"
            >
              <div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="font-medium text-sm md:text-base">{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Section */}
        <AnimatePresence mode="wait">
          {generatedPrompt && (
            <motion.section
              key="result"
              ref={resultRef}
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 60 }}
              transition={{ type: "spring", damping: 20 }}
              className="max-w-4xl mx-auto space-y-6 md:space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shrink-0">
                    <Layout className="text-brand-primary w-5 h-5 md:w-7 md:h-7" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-lg md:text-2xl tracking-tight">Architecture Générée</h2>
                    <p className="text-[9px] md:text-xs text-gray-500 uppercase tracking-[0.2em] font-bold">Prêt pour le déploiement</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <button
                    onClick={savePrompt}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/5 transition-all font-bold text-xs md:text-sm min-h-[44px]"
                  >
                    <Save className="w-4 md:w-5 h-4 md:h-5" />
                    <span className="hidden sm:inline">Sauvegarder</span>
                    <span className="sm:hidden">Save</span>
                  </button>
                  <button
                    onClick={copyToClipboard}
                    className={cn(
                      "flex-1 md:flex-none flex items-center justify-center gap-2 md:gap-3 px-4 md:px-6 py-3 rounded-xl transition-all font-bold text-xs md:text-sm min-h-[44px]",
                      copied ? "bg-brand-primary text-black" : "bg-white/5 hover:bg-white/10 text-white border border-white/5"
                    )}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 md:w-5 h-4 md:h-5" />
                        Copié
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 md:w-5 h-4 md:h-5" />
                        <span className="hidden sm:inline">Copier</span>
                        <span className="sm:hidden">Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="glass-panel p-5 md:p-10 bg-brand-card/40 relative group">
                <div className="markdown-body text-sm md:text-base">
                  <Markdown>{generatedPrompt}</Markdown>
                </div>
              </div>

              <div className="flex justify-center pt-8 md:pt-12">
                <button 
                  onClick={() => {
                    setDescription('');
                    setGeneratedPrompt(null);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group flex items-center gap-3 text-gray-500 hover:text-white transition-all font-bold text-xs md:text-sm"
                >
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:rotate-180 transition-transform duration-500">
                    <RefreshCw className="w-3 md:w-4 h-3 md:h-4" />
                  </div>
                  Nouvelle Architecture
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Showcase Section */}
        {!generatedPrompt && !isGenerating && (
          <section id="showcase" className="mt-32 border-t border-white/5 pt-24">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black mb-4">Showcase</h2>
              <p className="text-gray-400 max-w-xl mx-auto">Découvrez ce que nos utilisateurs ont construit avec PromptArchitect.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "Fintech Dashboard",
                  desc: "Une interface complexe de gestion de portefeuilles crypto avec graphiques temps réel.",
                  image: "https://picsum.photos/seed/fintech/800/450"
                },
                {
                  title: "E-learning Platform",
                  desc: "Architecture complète pour une plateforme de cours en ligne avec système de quiz.",
                  image: "https://picsum.photos/seed/learning/800/450"
                }
              ].map((item, i) => (
                <div key={i} className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02]">
                  <img src={item.image} alt={item.title} className="w-full aspect-video object-cover opacity-50 group-hover:opacity-80 transition-opacity" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-8 flex flex-col justify-end">
                    <h4 className="text-2xl font-bold mb-2">{item.title}</h4>
                    <p className="text-sm text-gray-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Features Grid */}
        {!generatedPrompt && !isGenerating && (
          <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 mt-8 md:mt-12">
            {[
              {
                icon: <Code2 className="w-6 h-6 md:w-8 md:h-8" />,
                title: "Engineering de Précision",
                desc: "Des prompts structurés pour minimiser les hallucinations et maximiser la qualité."
              },
              {
                icon: <Layout className="w-6 h-6 md:w-8 md:h-8" />,
                title: "Design System Ready",
                desc: "Incorpore des directives UI/UX modernes basées sur les meilleures pratiques."
              },
              {
                icon: <Layers className="w-6 h-6 md:w-8 md:h-8" />,
                title: "Full-Stack Blueprint",
                desc: "Définit la stack complète, de la base de données aux composants frontend."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + (i * 0.1) }}
                className="p-6 md:p-8 rounded-2xl md:rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group"
              >
                <div className="text-brand-primary mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                <h3 className="font-extrabold text-lg md:text-xl mb-2 md:mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-xs md:text-sm text-gray-500 leading-relaxed font-medium">{feature.desc}</p>
              </motion.div>
            ))}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-2">
              <Code2 className="text-brand-primary w-5 h-5" />
              <span className="font-bold text-lg tracking-tight">PromptArchitect</span>
            </div>
            <p className="text-gray-600 text-[10px] md:text-xs font-medium max-w-xs text-center md:text-left">
              L'outil ultime pour les développeurs et créateurs d'applications modernes.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">
            <button onClick={() => setShowDocModal(true)} className="hover:text-white transition-colors">Documentation</button>
            <button onClick={() => setShowGenericModal({
              show: true,
              title: 'API Reference',
              content: <p>L'API de PromptArchitect sera bientôt disponible pour les développeurs. Elle vous permettra d'intégrer notre moteur de génération directement dans vos outils.</p>
            })} className="hover:text-white transition-colors">API Reference</button>
            <button onClick={() => setShowGenericModal({
              show: true,
              title: 'Changelog',
              content: <div className="space-y-4">
                <div>
                  <h4 className="text-white font-bold">v1.2.0 (Mars 2026)</h4>
                  <p>• Ajout du système d'authentification complet.</p>
                  <p>• Nouveau panneau d'administration pour les admins.</p>
                </div>
                <div>
                  <h4 className="text-white font-bold">v1.1.0 (Février 2026)</h4>
                  <p>• Implémentation de l'historique local.</p>
                  <p>• Amélioration des performances de génération.</p>
                </div>
              </div>
            })} className="hover:text-white transition-colors">Changelog</button>
          </div>

          <div className="flex items-center gap-4">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
              <Github className="w-4 md:w-5 h-4 md:h-5" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
              <Twitter className="w-4 md:w-5 h-4 md:h-5" />
            </a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-8 md:pt-12 text-center">
          <p className="text-[9px] md:text-[10px] text-gray-700 font-bold uppercase tracking-[0.3em]">
            © 2026 Prompt Architect AI • All Rights Reserved
          </p>
        </div>
      </footer>
    </div>
  );
}
