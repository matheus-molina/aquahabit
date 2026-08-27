import React, { useState, useEffect } from 'react';
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
import { NotificationSetupModal } from './components/NotificationSetupModal';
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
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Sugerir ativação de notificações na primeira visita
  useEffect(() => {
    const hasPrompted = localStorage.getItem('aquahabit_notification_prompted');
    if (!hasPrompted) {
      const timer = setTimeout(() => {
        setShowNotificationModal(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const todayStr = getLocalDateString(new Date());
  const isSelectedDateToday = selectedDate === todayStr;

  return (
    <div className="min-h-screen w-full bg-slate-900/95 text-slate-100 flex flex-col items-center justify-start overflow-x-hidden selection:bg-ocean-500 selection:text-white">
      {/* Top Navbar (Fixed) */}
      <Navbar
        onOpenOnboarding={() => setShowOnboarding(true)}
        onOpenNotifications={() => setShowNotificationModal(true)}
      />

      {/* Main App Container */}
      <main className="w-full max-w-md mx-auto pt-20 pb-28 px-4 space-y-4 overflow-x-hidden">
        {/* TAB 1: DIÁRIO & PLANNER */}
        {activeTab === 'planner' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Card do Anel de Progresso */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-3.5 shadow-xl shadow-slate-950/20">
              <WaterRingProgress
                intakeMl={currentDateLog.intake_ml}
                targetMl={currentDateLog.target_ml}
                isToday={isSelectedDateToday}
              />
            </div>

            {/* Card de Registro Rápido */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-3xl p-4 shadow-xl shadow-slate-950/20">
              <div className="flex items-center justify-between mb-2.5 px-0.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Registrar Água
                </h3>
                <span className="text-[11px] text-ocean-400 font-bold">
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
              onOpenNotifications={() => setShowNotificationModal(true)}
            />
          </div>
        )}

        {/* TAB 2: CALENDÁRIO MENSAL */}
        {activeTab === 'calendar' && (
          <div className="space-y-4 animate-in fade-in duration-200">
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
          <div className="space-y-4 animate-in fade-in duration-200">
            <StatsDashboard
              logs={allLogs}
              profile={profile}
              onEditProfile={() => setShowOnboarding(true)}
            />
          </div>
        )}
      </main>

      {/* Bottom Navigation Bar (Fixed Native TabBar) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/80 safe-bottom">
        <div className="max-w-md mx-auto flex items-center justify-around py-1.5 px-2">
          <button
            type="button"
            onClick={() => setActiveTab('planner')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 rounded-2xl transition-all ${
              activeTab === 'planner'
                ? 'text-ocean-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Droplet className={`w-5 h-5 ${activeTab === 'planner' ? 'fill-ocean-400' : ''}`} />
            <span className="text-[10px]">Diário</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 rounded-2xl transition-all ${
              activeTab === 'calendar'
                ? 'text-ocean-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarIcon className="w-5 h-5" />
            <span className="text-[10px]">Calendário</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1 rounded-2xl transition-all ${
              activeTab === 'stats'
                ? 'text-ocean-400 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px]">Estatísticas</span>
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

      <NotificationSetupModal
        isOpen={showNotificationModal}
        onClose={() => {
          localStorage.setItem('aquahabit_notification_prompted', 'true');
          setShowNotificationModal(false);
        }}
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
