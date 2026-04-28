'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Loader2, Eye, EyeOff, Sparkles, ShieldCheck, Globe, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#050a15]">
      {/* ── Background Elements ── */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#050a15] via-[#0a1128] to-[#050a15]" />
        
        {/* Animated Glow Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full animate-float" style={{ animationDelay: '-2s' }} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-600/10 blur-[100px] rounded-full animate-float" style={{ animationDelay: '-4s' }} />
        
        {/* Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150" />
        <div className="absolute inset-0 opacity-[0.1]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
      </div>

      {/* ── Main Content Container ── */}
      <div className="relative z-10 w-full max-w-6xl px-4 flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
        
        {/* ── Branding Side (Desktop Only) ── */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden lg:flex flex-col flex-1 space-y-8"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/20 backdrop-blur-xl border border-primary/30 shadow-2xl shadow-primary/20">
              <GraduationCap className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white">
              EDU<span className="text-primary">SPHERE</span>
            </h1>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-6xl font-black text-white leading-[1.1]">
              The Future of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                Institutional Intellect
              </span>
            </h2>
            <p className="text-xl text-slate-400 max-w-md font-medium leading-relaxed">
              Experience the next generation of school management. Secure, intuitive, and intelligently automated.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4">
            {[
              { icon: ShieldCheck, label: "Enterprise Security", desc: "Military-grade encryption" },
              { icon: Globe, label: "Global Access", desc: "Anywhere, anytime control" },
              { icon: Zap, label: "Real-time Sync", desc: "Instant data propagation" },
              { icon: Sparkles, label: "AI Insights", desc: "Data-driven decisions" },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + (i * 0.1) }}
                className="flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-white/5 border border-white/10 mt-1">
                  <feature.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{feature.label}</p>
                  <p className="text-xs text-slate-500">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Login Card ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-[480px]"
        >
          <div className="glass-card rounded-[2.5rem] p-8 lg:p-12 overflow-hidden relative group">
            {/* Glossy overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50 pointer-events-none" />
            
            <div className="relative z-10 space-y-8">
              <div className="text-center lg:text-left space-y-2">
                <div className="lg:hidden flex justify-center mb-6">
                  <div className="p-3 rounded-2xl bg-primary/20 backdrop-blur-xl border border-primary/30">
                    <GraduationCap className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-3xl font-black text-white tracking-tight">Access Console</h3>
                <p className="text-slate-400 font-medium">Please authenticate to continue to the matrix.</p>
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-bold flex items-center gap-3"
                  >
                    <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-black uppercase tracking-[0.15em] text-slate-500 ml-1">Identity (Email)</Label>
                    <div className="relative group">
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@edusphere.io"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-14 bg-white/5 border-white/10 rounded-2xl px-5 text-white placeholder:text-slate-600 focus:bg-white/10 focus:border-primary/50 transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs font-black uppercase tracking-[0.15em] text-slate-500 ml-1">Access Key (Password)</Label>
                    <div className="relative group">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        className="h-14 bg-white/5 border-white/10 rounded-2xl px-5 pr-12 text-white placeholder:text-slate-600 focus:bg-white/10 focus:border-primary/50 transition-all duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between px-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="w-5 h-5 rounded-md border border-white/20 bg-white/5 flex items-center justify-center group-hover:border-primary transition-colors">
                      <div className="w-2 h-2 rounded-sm bg-primary opacity-0 group-hover:opacity-20 transition-opacity" />
                    </div>
                    <span className="text-xs font-bold text-slate-500 group-hover:text-slate-300 transition-colors">Keep me signed in</span>
                  </label>
                  <Link href="#" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">Recover Access?</Link>
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full h-14 rounded-2xl premium-gradient text-white font-black text-lg shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 overflow-hidden relative group"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5 fill-current" />
                        Initialize Session
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </Button>
              </form>

              <div className="pt-4 text-center">
                <p className="text-xs font-medium text-slate-500">
                  By signing in, you agree to our <br />
                  <Link href="#" className="text-slate-300 hover:text-primary underline underline-offset-4">Security Protocols</Link> and <Link href="#" className="text-slate-300 hover:text-primary underline underline-offset-4">Terms of Governance</Link>
                </p>
              </div>
            </div>
          </div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center mt-8 text-xs font-black uppercase tracking-[0.3em] text-slate-600"
          >
            © 2024 EDUSPHERE TECHNOLOGIES
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
