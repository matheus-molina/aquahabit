import React, { useState } from 'react';
import { 
  Droplet, 
  Calendar as CalendarIcon, 
  BarChart3
} from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WaterProvider, useWater } from './contexts/WaterContext';
import { Navbar } from './components/Navbar';
import { WaterRingProgress } from './components/WaterRingProgress';
import { QuickAddButtons } from './components/QuickAddButtons';
import { DailyPlanner } from './components/DailyPlanner';
import { CalendarView } from './components/CalendarView';
import { StatsDashboard } from './components/StatsDashboard';
import { OnboardingModal } from './components/OnboardingModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { PwaInstallPrompt } from './components/PwaInstallPrompt';
import { getLocalDateString } from './utils/healthCalculations';

type ActiveTab = 'planner' | 'calendar' | 'stats';

const MainAppContent: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const { 
    selectedDate, 
    setSelectedDate, 
    currentDateLog, 
    allLogs, 
    entries, 
    addWaterEntry, 
    deleteWaterEntry,
    isLoading 
  } = useWater();

  const [activeTab, setActiveTab] = useState<ActiveTab>('planner');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSupabaseConfig, setShowSupabaseConfig] = useState(false);

  const todayStr = getLocalDateString(new Date());
  const isSelectedDateToday = selectedDate === todayStr;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-ocean-500 selection:text-white pb-24">
      {/* Top Navbar */}
      <Navbar
        onOpenOnboarding={() => setShowOnboarding(true)}
        onOpenSupabaseConfig={() => setShowSupabaseConfig(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-5 space-y-6">
        {/* TAB 1: DIÁRIO & PLANNER */}
        {activeTab === 'planner' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Hero Progress Ring */}
            <div className="bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800 rounded-3xl p-4 shadow-xl">
              <WaterRingProgress
                intakeMl={currentDateLog.intake_ml}
                targetMl={currentDateLog.target_ml}
                isToday={isSelectedDateToday}
              />
            </div>

            {/* Quick Add Buttons */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Registrar Água
                </h3>
                <span className="text-[11px] text-ocean-400 font-semibold">
                  Meta: {currentDateLog.target_ml} ml
                </span>
              </div>
              <QuickAddButtons
                onAdd={(amount, type) => addWaterEntry(amount, type)}
                isLoading={isLoading}
              />
            </div>

            {/* Daily Planner & Timeline */}
            <DailyPlanner
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              entries={entries}
              onDeleteEntry={deleteWaterEntry}
              onOpenCalendar={() => setActiveTab('calendar')}
            />
          </div>
        )}

        {/* TAB 2: CALENDÁRIO MENSAL */}
        {activeTab === 'calendar' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <CalendarView
              selectedDate={selectedDate}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setActiveTab('planner');
              }}
              logs={allLogs}
            />
          </div>
        )}

        {/* TAB 3: ESTATÍSTICAS & IMC */}
        {activeTab === 'stats' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <StatsDashboard
              logs={allLogs}
              profile={profile}
              onEditProfile={() => setShowOnboarding(true)}
            />
          </div>
        )}
      </main>

      {/* Bottom Navigation Bar (Floating Native TabBar with Safe Bottom) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 safe-bottom">
        <div className="max-w-2xl mx-auto flex items-center justify-around py-2 px-3">
          <button
            type="button"
            onClick={() => setActiveTab('planner')}
            className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-2xl transition-all duration-200 ${
              activeTab === 'planner'
                ? 'text-ocean-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Droplet className={`w-5 h-5 ${activeTab === 'planner' ? 'fill-ocean-400' : ''}`} />
            <span className="text-[11px]">Diário</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-2xl transition-all duration-200 ${
              activeTab === 'calendar'
                ? 'text-ocean-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarIcon className="w-5 h-5" />
            <span className="text-[11px]">Calendário</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-2xl transition-all duration-200 ${
              activeTab === 'stats'
                ? 'text-ocean-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[11px]">Estatísticas</span>
          </button>
        </div>
      </nav>

      {/* Modals & Prompts */}
      <OnboardingModal
        initialProfile={profile}
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onSave={updateProfile}
      />

      <SupabaseConfigModal
        isOpen={showSupabaseConfig}
        onClose={() => setShowSupabaseConfig(false)}
      />

      <PwaInstallPrompt />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <WaterProvider>
        <MainAppContent />
      </WaterProvider>
    </AuthProvider>
  );
}
