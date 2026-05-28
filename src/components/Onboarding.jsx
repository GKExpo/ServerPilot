import { useState } from 'react';
import { Activity, Archive, ChevronLeft, ChevronRight, FileCode2, FolderOpen, Play, Rocket, Server, TerminalSquare, Users, Zap } from 'lucide-react';
import clsx from 'clsx';
import { api } from '../services/api';

const steps = [
  'Welcome',
  'Features',
  'Server Setup',
  'Playit.gg',
  'Ready'
];

export function Onboarding({ onComplete, onSkip, settings }) {
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [form, setForm] = useState({
    name: 'My Minecraft Server',
    folderPath: '',
    jarName: '',
    javaPath: settings?.defaultJavaPath || 'java',
    ramMin: settings?.defaultRamMin || '2G',
    ramMax: settings?.defaultRamMax || '4G',
    jvmArgs: '',
    serverType: 'Vanilla',
    autoStartPlayit: settings?.autoStartPlayit ?? true,
    playitPath: settings?.playitPath || ''
  });

  const update = (key, value) => setForm((c) => ({ ...c, [key]: value }));

  async function pickFolder() {
    const folder = await api.invoke('dialog:select-folder');
    if (!folder) return;
    update('folderPath', folder);
    const detected = await api.invoke('server:detect', folder);
    setForm((current) => ({
      ...current,
      folderPath: folder,
      jarName: current.jarName || detected.jarName,
      serverType: detected.serverType,
      name: current.name === 'My Minecraft Server' ? folder.split(/[\\/]/).pop() : current.name
    }));
  }

  async function pickExecutable(key) {
    const file = await api.invoke('dialog:select-file');
    if (file) update(key, file);
  }

  const next = () => setStep((s) => Math.min(5, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  async function finalize() {
    setBusy(true);
    if (!form.folderPath || !form.jarName) {
      await onComplete(null);
    } else {
      await onComplete(form);
    }
  }

  return (
    <div className="flex h-screen w-full flex-col bg-void text-zinc-100 overflow-hidden relative">
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neon/10 via-void to-void" />

      <header className="relative z-10 flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-neon/10 border border-neon/30 shadow-[0_0_15px_rgba(52,241,123,0.15)]">
            <Server className="h-5 w-5 text-neon" />
          </div>
          <span className="text-xl font-bold tracking-tight">ServerPilot V2</span>
        </div>
        <button onClick={onSkip} className="text-sm font-medium text-zinc-400 hover:text-white transition">Skip Setup</button>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-3xl">
          
          <div className="mb-8">
            <div className="flex justify-between text-xs font-semibold text-zinc-500 mb-2 px-1">
              <span>STEP {step} OF 5</span>
              <span>{steps[step - 1]}</span>
            </div>
            <div className="h-1.5 w-full bg-panel2 rounded-full overflow-hidden flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className={clsx('h-full flex-1 rounded-full transition-all duration-500', s <= step ? 'bg-neon shadow-[0_0_10px_rgba(52,241,123,0.5)]' : 'bg-white/5')} />
              ))}
            </div>
          </div>

          <div className="min-h-[420px] rounded-2xl border border-white/5 bg-panel2/40 p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden animate-page-enter">
            {step === 1 && (
              <div className="flex flex-col items-center text-center py-10 animate-page-enter">
                <div className="mb-6 rounded-3xl bg-neon/10 p-5 border border-neon/20 shadow-[0_0_30px_rgba(52,241,123,0.2)]">
                  <Rocket className="h-12 w-12 text-neon" />
                </div>
                <h1 className="mb-4 text-4xl font-extrabold text-white">Welcome to ServerPilot V2</h1>
                <p className="max-w-md text-lg text-zinc-400">The ultimate desktop control deck for managing your local Minecraft servers with ease.</p>
              </div>
            )}

            {step === 2 && (
              <div className="animate-page-enter">
                <h2 className="text-2xl font-bold mb-6 text-white">Everything you need</h2>
                <div className="grid grid-cols-2 gap-4">
                  <FeatureCard icon={Play} title="One-Click Start" desc="No more messy batch files. Start and stop securely." />
                  <FeatureCard icon={TerminalSquare} title="Integrated Console" desc="Live logs, error tracking, and direct command input." />
                  <FeatureCard icon={Users} title="Player Tracking" desc="Monitor who joins, chats, and unlocks advancements." />
                  <FeatureCard icon={Activity} title="Live Metrics" desc="Keep an eye on RAM, CPU, and TPS in real time." />
                  <FeatureCard icon={FileCode2} title="File Editor" desc="Tweak properties and whitelists directly in the app." />
                  <FeatureCard icon={Archive} title="Instant Backups" desc="Zip your entire server folder with one button." />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-page-enter flex flex-col h-full">
                <h2 className="text-2xl font-bold mb-2 text-white">Let's find your server</h2>
                <p className="text-sm text-zinc-400 mb-6">Select your Minecraft server folder to get started. Don't worry, we won't modify your files.</p>
                
                <div className="space-y-4">
                  <div className="rounded-xl bg-black/20 p-4 border border-white/5 transition-all hover:border-white/10">
                    <label className="field mb-3 text-white">Server Folder</label>
                    <div className="flex gap-2">
                      <input value={form.folderPath} readOnly placeholder="e.g. D:\Minecraft\MyServer" className="bg-panel2 border-line text-zinc-300" />
                      <button onClick={pickFolder} className="btn ghost whitespace-nowrap"><FolderOpen className="h-4 w-4" /> Browse</button>
                    </div>
                  </div>
                  
                  {form.folderPath && (
                    <div className="grid grid-cols-2 gap-4 animate-page-enter">
                      <div className="rounded-xl bg-black/20 p-4 border border-white/5">
                        <label className="field mb-2 text-white">Detected Server JAR</label>
                        <input value={form.jarName} onChange={(e) => update('jarName', e.target.value)} placeholder="paper.jar" />
                      </div>
                      <div className="rounded-xl bg-black/20 p-4 border border-white/5">
                        <label className="field mb-2 text-white flex justify-between">Java Path <span className="text-zinc-500 font-normal">Requires 17+</span></label>
                        <div className="flex gap-2">
                          <input value={form.javaPath} onChange={(e) => update('javaPath', e.target.value)} />
                          <button onClick={() => pickExecutable('javaPath')} className="btn ghost px-3"><FolderOpen className="h-4 w-4" /></button>
                        </div>
                      </div>
                      <div className="rounded-xl bg-black/20 p-4 border border-white/5">
                        <label className="field mb-2 text-white flex justify-between">RAM Allocation <span className="text-zinc-500 font-normal">Min / Max</span></label>
                        <div className="flex gap-2">
                          <input value={form.ramMin} onChange={(e) => update('ramMin', e.target.value)} title="Minimum RAM" />
                          <input value={form.ramMax} onChange={(e) => update('ramMax', e.target.value)} title="Maximum RAM" />
                        </div>
                      </div>
                      <div className="rounded-xl bg-black/20 p-4 border border-white/5 flex flex-col justify-center">
                        <label className="field mb-1 text-white">Detected Server Type</label>
                        <span className="text-neon font-bold">{form.serverType}</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-xs font-semibold text-neon hover:text-emerald-400 transition">
                      {showAdvanced ? '− Hide Advanced Options' : '+ Show Advanced Options'}
                    </button>
                    {showAdvanced && (
                      <div className="mt-3 rounded-xl bg-black/20 p-4 border border-white/5 animate-page-enter">
                        <label className="field mb-2 text-white">JVM Arguments</label>
                        <input value={form.jvmArgs} onChange={(e) => update('jvmArgs', e.target.value)} placeholder="e.g. -XX:+UseG1GC" />
                        <p className="text-xs text-zinc-500 mt-2">Extra launch flags for performance tuning. (Optional)</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="animate-page-enter">
                <h2 className="text-2xl font-bold mb-2 text-white">Multiplayer with Playit.gg</h2>
                <p className="text-sm text-zinc-400 mb-6">Want friends to join without complicated router port forwarding? Playit.gg creates a public IP for your local server automatically.</p>
                
                <div className="rounded-xl bg-black/20 p-5 border border-neon/20 shadow-[inset_0_0_20px_rgba(52,241,123,0.05)]">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className={clsx("mt-0.5 flex h-5 w-5 items-center justify-center rounded border transition", form.autoStartPlayit ? "bg-neon border-neon text-black" : "border-zinc-500 bg-transparent group-hover:border-neon")}>
                      {form.autoStartPlayit && <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <input type="checkbox" checked={form.autoStartPlayit} onChange={(e) => update('autoStartPlayit', e.target.checked)} className="hidden" />
                    <div>
                      <div className="font-semibold text-white">Enable Playit.gg Integration</div>
                      <div className="text-sm text-zinc-400 mt-1 leading-relaxed">ServerPilot will start and stop the secure tunnel alongside your Minecraft server automatically, keeping your connection safe.</div>
                    </div>
                  </label>

                  {form.autoStartPlayit && (
                    <div className="mt-5 pt-5 border-t border-line animate-page-enter">
                      <label className="field mb-2 text-white">Playit Executable (playit.exe)</label>
                      <div className="flex gap-2">
                        <input value={form.playitPath} onChange={(e) => update('playitPath', e.target.value)} placeholder="Path to playit.exe" />
                        <button onClick={() => pickExecutable('playitPath')} className="btn ghost whitespace-nowrap"><FolderOpen className="h-4 w-4" /> Browse</button>
                      </div>
                      <p className="text-xs text-zinc-500 mt-2">Download from playit.gg, extract it anywhere, and select it here.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="flex flex-col items-center text-center py-8 animate-page-enter">
                <div className="mb-6 rounded-3xl bg-neon/10 p-5 border border-neon/20 shadow-[0_0_30px_rgba(52,241,123,0.2)]">
                  <Zap className="h-12 w-12 text-neon" />
                </div>
                <h1 className="mb-4 text-3xl font-extrabold text-white">You're All Set!</h1>
                <p className="max-w-md text-sm text-zinc-400 mb-8">Your dashboard is configured and ready. Click launch below to enter the control panel and start your server.</p>
                
                <div className="w-full max-w-sm rounded-xl bg-black/20 p-5 border border-white/5 text-left shadow-lg">
                  <div className="text-xs font-bold text-neon mb-3 uppercase tracking-wider">Quick Beginner Tips</div>
                  <ul className="text-sm text-zinc-300 space-y-3">
                    <li className="flex gap-3"><div className="w-1.5 h-1.5 rounded-full bg-neon mt-1.5 shrink-0 shadow-[0_0_8px_rgba(52,241,123,0.8)]" /> <span><strong>EULA error?</strong> Open the Files tab and edit eula.txt to true.</span></li>
                    <li className="flex gap-3"><div className="w-1.5 h-1.5 rounded-full bg-neon mt-1.5 shrink-0 shadow-[0_0_8px_rgba(52,241,123,0.8)]" /> <span><strong>Need admin?</strong> Type "op yourname" in the Console.</span></li>
                    <li className="flex gap-3"><div className="w-1.5 h-1.5 rounded-full bg-neon mt-1.5 shrink-0 shadow-[0_0_8px_rgba(52,241,123,0.8)]" /> <span><strong>Server crashed?</strong> Check the console tab for missing Java versions or broken plugins.</span></li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between">
            {step > 1 ? (
              <button onClick={prev} className="btn ghost px-5"><ChevronLeft className="h-4 w-4" /> Back</button>
            ) : <div />}
            
            {step < 5 ? (
              <button onClick={next} className="btn primary px-8 shadow-[0_0_20px_rgba(52,241,123,0.2)] hover:-translate-y-1">Continue <ChevronRight className="h-4 w-4 ml-1" /></button>
            ) : (
              <button onClick={finalize} disabled={busy} className="btn primary px-8 bg-gradient-to-r from-neon to-emerald-400 text-black shadow-[0_0_20px_rgba(52,241,123,0.3)] hover:-translate-y-1 transition-all">Launch Dashboard <Rocket className="h-4 w-4 ml-2" /></button>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 p-4 transition-all hover:bg-white/5 hover:border-white/10 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center gap-3 mb-2">
        <div className="rounded-lg bg-neon/10 p-2 border border-neon/20 shadow-[0_0_10px_rgba(52,241,123,0.1)]"><Icon className="h-4 w-4 text-neon" /></div>
        <div className="font-semibold text-white text-sm">{title}</div>
      </div>
      <p className="text-xs text-zinc-400 leading-relaxed">{desc}</p>
    </div>
  );
}
