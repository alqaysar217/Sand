"use client"

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Shield, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { MOCK_USERS } from '@/lib/mock-data';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, user } = useAuth();
  const router = useRouter();

  if (user) {
    router.push('/dashboard');
    return null;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(email);
  };

  return (
    <div className="min-h-screen bg-[#F6F9FA] flex flex-col">
      <nav className="p-6">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <span className="font-headline font-bold text-2xl text-primary tracking-tight">ConnectResolve</span>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl w-full items-center">
          <div className="hidden lg:block space-y-8">
            <h1 className="text-5xl font-bold text-primary leading-tight">
              Banking <span className="text-secondary">Resolution</span> Intelligence.
            </h1>
            <p className="text-xl text-muted-foreground">
              Empower your support teams with automated routing, AI-assisted responses, and real-time analytics.
            </p>
            <div className="space-y-4">
              {[
                "Role-based access & permissions",
                "Automated department routing",
                "AI-powered response assistant",
                "Advanced operational analytics"
              ].map((text) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="bg-green-100 p-1 rounded-full">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="font-medium text-slate-700">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <Card className="w-full max-w-md mx-auto shadow-xl border-t-4 border-t-primary">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold">Employee Login</CardTitle>
              <CardDescription>Enter your corporate credentials to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="name@bank.com" 
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password">Password</Label>
                    <a href="#" className="text-xs text-secondary hover:underline">Forgot password?</a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="••••••••" 
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-primary text-white font-bold h-12">
                  Sign In <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t">
                <p className="text-xs font-bold text-muted-foreground uppercase mb-3">Quick Switch (Demo):</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" className="text-[10px] px-1" onClick={() => setEmail('ahmed@bank.com')}>Agent</Button>
                  <Button variant="outline" size="sm" className="text-[10px] px-1" onClick={() => setEmail('sarah@bank.com')}>Specialist</Button>
                  <Button variant="outline" size="sm" className="text-[10px] px-1" onClick={() => setEmail('khalid@bank.com')}>Admin</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="p-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} ConnectResolve Banking Systems. All rights reserved.
      </footer>
    </div>
  );
}