"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, ArrowRight, ArrowLeft, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';

// ============================================================================
// CUESTIONARIO INICIAL (basado en PHQ-9, GAD-7 y screenings auxiliares)
// ============================================================================
const QUESTIONS = [
  // Sección 1: Estado emocional
  { id: 1,  text: 'Poco interés o placer en hacer cosas' },
  { id: 2,  text: 'Sentirte triste, vacío o sin esperanza' },
  { id: 3,  text: 'Sentirte nervioso/a, ansioso/a o al límite' },
  { id: 4,  text: 'No poder dejar de preocuparte' },
  { id: 5,  text: 'Cansancio o falta de energía' },
  { id: 6,  text: 'Dificultad para concentrarte' },
  // Sección 2: Sueño y hábitos
  { id: 7,  text: 'Dificultad para dormir o dormir demasiado' },
  { id: 8,  text: 'Sentirte agotado/a incluso después de descansar' },
  { id: 9,  text: 'Cambios en tu apetito (comer mucho o muy poco)' },
  // Sección 3: Conducta y control
  { id: 10, text: 'Dificultad para organizar tareas o actividades' },
  { id: 11, text: 'Postergar cosas importantes, aunque sepas que debes hacerlas' },
  { id: 12, text: 'Distracción constante o dificultad para mantener la atención' },
  // Sección 4: Pensamientos repetitivos
  { id: 13, text: 'Pensamientos repetitivos que no puedes controlar' },
  { id: 14, text: 'Necesidad de hacer cosas una y otra vez (rituales, revisiones, etc.)' },
  // Sección 5: Trauma y estrés
  { id: 15, text: 'Recuerdos o pensamientos intrusivos sobre una experiencia difícil' },
  { id: 16, text: 'Evitar situaciones o lugares que te recuerdan algo doloroso' },
  { id: 17, text: 'Sentirte constantemente en alerta o con miedo' },
  // Sección 6: Estado emocional extremo
  { id: 18, text: 'Momentos donde te sientes con demasiada energía o euforia' },
  { id: 19, text: 'Cambios bruscos de ánimo (muy arriba → muy abajo)' },
  // Sección 7: Relación con comida
  { id: 20, text: 'Preocupación excesiva por tu peso o cuerpo' },
  { id: 21, text: 'Episodios de comer en exceso o dejar de comer' },
  // Sección 8: Duelo
  { id: 22, text: 'Dificultad para aceptar una pérdida importante' },
  { id: 23, text: 'Sentimientos persistentes de tristeza por alguien o algo que perdiste' },
  // Sección 9: Riesgo (CRÍTICO)
  { id: 24, text: 'Pensamientos de que estarías mejor muerto/a o de hacerte daño' },
];

const OPTIONS = [
  { value: 0, label: 'Nunca',                       hint: '0 días' },
  { value: 1, label: 'Algunos días',                hint: '1-6 días' },
  { value: 2, label: 'Más de la mitad de los días', hint: '7-11 días' },
  { value: 3, label: 'Casi todos los días',         hint: '12-14 días' },
];

// Agrupaciones por área (según el PDF)
const CATEGORIES: Record<string, number[]> = {
  depresion:    [1, 2, 5, 7, 9],
  ansiedad:     [3, 4, 6, 15, 17],
  tdah:         [10, 11, 12],
  toc:          [13, 14],
  tept:         [15, 16, 17],
  bipolaridad:  [18, 19],
  tca:          [20, 21],
  duelo:        [22, 23],
  sueno:        [7, 8],
};

// Mapeo área dominante → ruta clínica del onboarding
const AREA_TO_ROUTE: Record<string, string> = {
  depresion:   'Depresión',
  ansiedad:    'Ansiedad',
  tdah:        'TDAH',
  toc:         'TOC',
  tept:        'TEPT',
  bipolaridad: 'Trastorno Bipolar',
  tca:         'TCA',
  duelo:       'Duelo',
  sueno:       'Insomnio',
};

const AREA_LABEL: Record<string, string> = {
  depresion:   'Depresión',
  ansiedad:    'Ansiedad',
  tdah:        'TDAH / Procrastinación',
  toc:         'Pensamientos repetitivos (TOC)',
  tept:        'Estrés postraumático',
  bipolaridad: 'Cambios de ánimo',
  tca:         'Relación con la comida',
  duelo:       'Duelo / pérdida',
  sueno:       'Sueño',
};

// Calcula nivel según número de preguntas de cada categoría
function levelFor(score: number, count: number): 'bajo' | 'leve' | 'moderado' | 'alto' {
  if (count >= 5) {
    if (score <= 4)  return 'bajo';
    if (score <= 9)  return 'leve';
    if (score <= 12) return 'moderado';
    return 'alto';
  }
  if (count === 3) {
    if (score <= 2) return 'bajo';
    if (score <= 5) return 'leve';
    if (score <= 7) return 'moderado';
    return 'alto';
  }
  // 2 preguntas
  if (score <= 1) return 'bajo';
  if (score <= 3) return 'leve';
  if (score <= 5) return 'moderado';
  return 'alto';
}

const LEVEL_COLOR: Record<string, string> = {
  bajo:     'bg-[#E5F7F4] text-[#0F766E] border-[#A7F3D0]',
  leve:     'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
  moderado: 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]',
  alto:     'bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]',
};

export default function InitialTestPage() {
  const router = useRouter();
  const [step, setStep] = useState<'intro' | 'quiz' | 'results'>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role, assessment_completed, selected_route')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'psicologo') { router.push('/psicologo/dashboard'); return; }
      if (profile?.full_name) setUserName(profile.full_name.split(' ')[0]);

      // Si ya completó el test y tiene ruta, no debería estar aquí
      if (profile?.assessment_completed && profile?.selected_route) {
        router.push('/dashboard');
      }
    };
    fetchUser();
  }, [router]);

  // ===========================================================================
  // CÁLCULO DE RESULTADOS (memoizado)
  // ===========================================================================
  const results = useMemo(() => {
    const scores: Record<string, number> = {};
    const levels: Record<string, string> = {};

    Object.entries(CATEGORIES).forEach(([area, qs]) => {
      const sum = qs.reduce((acc, q) => acc + (answers[q] ?? 0), 0);
      scores[area] = sum;
      levels[area] = levelFor(sum, qs.length);
    });

    // Normalizamos por máximo posible para encontrar el dominante
    const normalized = Object.entries(scores).map(([area, sum]) => {
      const max = CATEGORIES[area].length * 3;
      return { area, sum, ratio: max > 0 ? sum / max : 0 };
    });
    normalized.sort((a, b) => b.ratio - a.ratio);
    const dominant = normalized[0];

    const moderateOrHigh = Object.entries(levels).filter(
      ([, lvl]) => lvl === 'moderado' || lvl === 'alto'
    );

    let profile = 'Perfil emocional';
    if (dominant && dominant.ratio > 0) {
      if (dominant.area === 'ansiedad')      profile = 'Perfil ansioso';
      else if (dominant.area === 'depresion') profile = 'Perfil emocional';
      else if (dominant.area === 'tdah')      profile = 'Perfil de distracción';
      else if (dominant.area === 'duelo')     profile = 'Perfil de duelo';
      else if (dominant.area === 'tept')      profile = 'Perfil en alerta';
      else if (dominant.area === 'tca')       profile = 'Perfil de autoimagen';
      else if (dominant.area === 'sueno')     profile = 'Perfil de descanso';
      else if (dominant.area === 'toc')       profile = 'Perfil de pensamientos repetitivos';
      else if (dominant.area === 'bipolaridad') profile = 'Perfil de cambios de ánimo';
    }

    const risk = (answers[24] ?? 0) >= 1;
    const suggestedRoute = dominant && dominant.ratio > 0
      ? AREA_TO_ROUTE[dominant.area]
      : null;

    return {
      scores, levels, dominant, profile, risk, suggestedRoute, moderateOrHigh,
    };
  }, [answers]);

  // ===========================================================================
  // NAVEGACIÓN
  // ===========================================================================
  const totalQuestions = QUESTIONS.length;
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / totalQuestions) * 100;
  const currentQ = QUESTIONS[currentIndex];

  const handleSelect = (value: number) => {
    setAnswers(prev => ({ ...prev, [currentQ.id]: value }));
    if (currentIndex < totalQuestions - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 180);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleFinishQuiz = () => {
    if (answeredCount < totalQuestions) {
      setErrorMsg('Por favor responde todas las preguntas antes de continuar.');
      const firstUnanswered = QUESTIONS.findIndex(q => answers[q.id] === undefined);
      if (firstUnanswered !== -1) setCurrentIndex(firstUnanswered);
      return;
    }
    setErrorMsg('');
    setStep('results');
  };

  // ===========================================================================
  // GUARDAR RESULTADO Y CONTINUAR
  // ===========================================================================
  const handleSaveAndContinue = async () => {
    if (!userId) return;
    setSaving(true);
    setErrorMsg('');

    try {
      const payload = {
        patient_id: userId,
        answers: answers,
        score_depresion:    results.scores.depresion,
        score_ansiedad:     results.scores.ansiedad,
        score_tdah:         results.scores.tdah,
        score_toc:          results.scores.toc,
        score_tept:         results.scores.tept,
        score_bipolaridad:  results.scores.bipolaridad,
        score_tca:          results.scores.tca,
        score_duelo:        results.scores.duelo,
        score_sueno:        results.scores.sueno,
        level_depresion:    results.levels.depresion,
        level_ansiedad:     results.levels.ansiedad,
        level_tdah:         results.levels.tdah,
        level_toc:          results.levels.toc,
        level_tept:         results.levels.tept,
        level_bipolaridad:  results.levels.bipolaridad,
        level_tca:          results.levels.tca,
        level_duelo:        results.levels.duelo,
        level_sueno:        results.levels.sueno,
        dominant_area:      results.dominant?.area || null,
        user_profile:       results.profile,
        risk_flag:          results.risk,
      };

      const { error: assessmentError } = await supabase
        .from('initial_assessments')
        .upsert(payload, { onConflict: 'patient_id' });

      if (assessmentError) throw assessmentError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          assessment_completed: true,
          suggested_route: results.suggestedRoute,
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      router.push('/onboarding');
    } catch (err: any) {
      console.error('Error guardando el test:', err);
      setErrorMsg(err.message || 'No pudimos guardar tu test. Intenta de nuevo.');
      setSaving(false);
    }
  };

  // ===========================================================================
  // RENDER
  // ===========================================================================

  // ---------- INTRO ----------
  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F3E7FC] via-[#E2F4EE] to-[#FDF3E9] flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-2xl w-full bg-white/80 backdrop-blur-xl rounded-[40px] p-8 md:p-12 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white animate-in fade-in zoom-in-95 duration-500">

          <div className="w-16 h-16 bg-[#EEF0FF] rounded-[24px] shadow-sm flex items-center justify-center mx-auto mb-6 border border-white">
            <Sparkles className="w-8 h-8 text-[#6C72F1]" strokeWidth={2.5} />
          </div>

          <h1 className="text-[28px] md:text-[34px] font-extrabold text-[#0F172A] tracking-tight text-center mb-3 leading-tight">
            Hola{userName ? `, ${userName}` : ''} 👋
          </h1>
          <p className="text-[#475569] text-center text-[15px] md:text-[16px] leading-relaxed font-medium mb-8">
            Antes de comenzar, te haremos <b>24 preguntas breves</b> sobre cómo te has sentido en las últimas 2 semanas. Esto nos ayudará a sugerirte la ruta clínica que mejor se adapta a ti.
          </p>

          <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-[20px] p-5 mb-8 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#D97706] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
            <p className="text-[12px] text-[#92400E] leading-relaxed font-medium">
              <b>Este test no constituye un diagnóstico clínico.</b> Está basado en herramientas psicológicas validadas (PHQ-9 y GAD-7) y su objetivo es <b>orientar y sugerir apoyo profesional</b> si lo necesitas.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8 text-center">
            <div className="bg-white/60 rounded-[20px] p-4 border border-white">
              <p className="text-[24px] font-black text-[#6C72F1] leading-none">24</p>
              <p className="text-[10px] font-extrabold text-[#8A95A5] uppercase tracking-wider mt-1">Preguntas</p>
            </div>
            <div className="bg-white/60 rounded-[20px] p-4 border border-white">
              <p className="text-[24px] font-black text-[#3EAFA8] leading-none">~5</p>
              <p className="text-[10px] font-extrabold text-[#8A95A5] uppercase tracking-wider mt-1">Minutos</p>
            </div>
            <div className="bg-white/60 rounded-[20px] p-4 border border-white">
              <p className="text-[24px] font-black text-[#D97706] leading-none">9</p>
              <p className="text-[10px] font-extrabold text-[#8A95A5] uppercase tracking-wider mt-1">Áreas</p>
            </div>
          </div>

          <button
            onClick={() => setStep('quiz')}
            className="w-full py-4 bg-[#6C72F1] hover:bg-[#5C61E1] text-white rounded-[24px] font-extrabold text-[14px] uppercase tracking-wider transition-all shadow-[0_4px_15px_rgba(108,114,241,0.3)] hover:shadow-lg hover:-translate-y-0.5 flex justify-center items-center gap-2"
          >
            Comenzar test <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    );
  }

  // ---------- QUIZ ----------
  if (step === 'quiz') {
    const selected = answers[currentQ.id];

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F3E7FC] via-[#E2F4EE] to-[#FDF3E9] flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-2xl w-full">

          {/* Barra de progreso */}
          <div className="mb-6 px-2">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[11px] font-black text-[#6C72F1] uppercase tracking-[0.15em]">
                Pregunta {currentIndex + 1} de {totalQuestions}
              </p>
              <p className="text-[11px] font-bold text-[#8A95A5]">
                {Math.round(progress)}% completado
              </p>
            </div>
            <div className="w-full bg-white/60 rounded-full h-2.5 overflow-hidden shadow-inner border border-white">
              <div
                className="bg-gradient-to-r from-[#6C72F1] to-[#8AD8CB] h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Tarjeta de pregunta */}
          <div key={currentQ.id} className="bg-white/80 backdrop-blur-xl rounded-[40px] p-8 md:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white animate-in fade-in slide-in-from-right-4 duration-300">

            <p className="text-[11px] font-black text-[#8A95A5] uppercase tracking-[0.15em] mb-3">
              En las últimas 2 semanas...
            </p>
            <h2 className="text-[22px] md:text-[26px] font-extrabold text-[#0F172A] tracking-tight leading-tight mb-8">
              {currentQ.text}
            </h2>

            <div className="space-y-3">
              {OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full text-left p-4 md:p-5 rounded-[20px] border-2 transition-all flex items-center justify-between group ${
                    selected === opt.value
                      ? 'border-[#6C72F1] bg-[#EEF0FF] shadow-md'
                      : 'border-white bg-white/60 hover:border-[#6C72F1]/30 hover:bg-white'
                  }`}
                >
                  <div>
                    <p className={`font-extrabold text-[15px] ${selected === opt.value ? 'text-[#5C61E1]' : 'text-[#1E293B]'}`}>
                      {opt.label}
                    </p>
                    <p className="text-[11px] text-[#8A95A5] font-medium mt-0.5">{opt.hint}</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    selected === opt.value ? 'border-[#6C72F1] bg-[#6C72F1]' : 'border-[#CBD5E1] bg-white'
                  }`}>
                    {selected === opt.value && <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />}
                  </div>
                </button>
              ))}
            </div>

            {errorMsg && (
              <p className="mt-4 text-[12px] text-[#B91C1C] font-bold">{errorMsg}</p>
            )}

            {/* Navegación */}
            <div className="mt-8 flex justify-between items-center">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-wider text-[#8A95A5] hover:text-[#6C72F1] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={2.5} /> Anterior
              </button>

              {currentIndex === totalQuestions - 1 ? (
                <button
                  onClick={handleFinishQuiz}
                  className="px-6 py-3 bg-[#3EAFA8] hover:bg-[#0F766E] text-white rounded-[20px] font-extrabold text-[12px] uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  Ver resultado <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                </button>
              ) : (
                <button
                  onClick={() => selected !== undefined && setCurrentIndex(currentIndex + 1)}
                  disabled={selected === undefined}
                  className="px-6 py-3 bg-[#6C72F1] hover:bg-[#5C61E1] text-white rounded-[20px] font-extrabold text-[12px] uppercase tracking-wider transition-all shadow-md hover:shadow-lg disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Siguiente <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- RESULTADOS ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3E7FC] via-[#E2F4EE] to-[#FDF3E9] p-6 py-12 font-sans">
      <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* HEADER */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[40px] p-8 md:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white text-center mb-6">
          <div className="w-16 h-16 bg-[#EEF0FF] rounded-[24px] shadow-sm flex items-center justify-center mx-auto mb-5 border border-white">
            <Sparkles className="w-8 h-8 text-[#6C72F1]" strokeWidth={2.5} />
          </div>
          <h1 className="text-[28px] md:text-[32px] font-extrabold text-[#0F172A] tracking-tight mb-2">
            Tu estado emocional actual
          </h1>
          <p className="text-[#64748B] text-[14px] md:text-[15px] font-medium leading-relaxed max-w-xl mx-auto">
            Esto es lo que detectamos a partir de tus respuestas. Recuerda: no es un diagnóstico, es una orientación.
          </p>

          <div className="mt-6 inline-flex items-center gap-2 bg-[#EEF0FF] text-[#5C61E1] px-5 py-2.5 rounded-full border border-white shadow-sm">
            <Sparkles className="w-4 h-4" strokeWidth={2.5} />
            <span className="text-[12px] font-black uppercase tracking-[0.15em]">{results.profile}</span>
          </div>
        </div>

        {/* ALERTA RIESGO */}
        {results.risk && (
          <div className="bg-[#FEF2F2] border-l-[6px] border-[#EF4444] rounded-[24px] p-6 mb-6 flex items-start gap-4 shadow-sm">
            <AlertTriangle className="w-6 h-6 text-[#EF4444] flex-shrink-0 mt-1" strokeWidth={2.5} />
            <div>
              <h3 className="text-[16px] font-extrabold text-[#B91C1C] mb-1.5">Queremos cuidarte</h3>
              <p className="text-[13px] text-[#7F1D1D] font-medium leading-relaxed">
                Podrías estar pasando por un momento difícil. Te recomendamos hablar con un profesional o con alguien de confianza. Si estás en crisis, en México puedes llamar a la <b>Línea de la Vida: 800 290 0024</b> (24/7, gratuita).
              </p>
            </div>
          </div>
        )}

        {/* TARJETAS POR ÁREA */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[40px] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white mb-6">
          <h2 className="text-[18px] font-extrabold text-[#1E293B] mb-5 px-2">Resultado por área</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(results.levels).map(([area, lvl]) => (
              <div key={area} className="bg-white/60 rounded-[20px] p-4 border border-white flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-extrabold text-[#1E293B] leading-tight">{AREA_LABEL[area]}</p>
                  <p className="text-[10px] font-bold text-[#8A95A5] mt-0.5">
                    Puntaje {results.scores[area]} / {CATEGORIES[area].length * 3}
                  </p>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border ${LEVEL_COLOR[lvl as string]}`}>
                  {lvl}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RECOMENDACIÓN */}
        <div className="bg-gradient-to-br from-[#EEF0FF] to-white rounded-[40px] p-6 md:p-8 border border-white shadow-sm mb-6">
          <h3 className="text-[14px] font-black text-[#6C72F1] uppercase tracking-[0.15em] mb-3">
            Recomendación personalizada
          </h3>
          {results.suggestedRoute ? (
            <p className="text-[15px] text-[#1E293B] font-medium leading-relaxed">
              Detectamos que tu área predominante se relaciona con <b className="text-[#5C61E1]">{AREA_LABEL[results.dominant!.area]}</b>. Te sugerimos comenzar tu camino con la ruta clínica de <b className="text-[#5C61E1]">{results.suggestedRoute}</b>. Podrás cambiarla más adelante.
            </p>
          ) : (
            <p className="text-[15px] text-[#1E293B] font-medium leading-relaxed">
              Tus resultados están en niveles bajos. Aun así, puedes empezar con cualquier ruta clínica para construir hábitos saludables.
            </p>
          )}

          {results.moderateOrHigh.length > 1 && (
            <p className="mt-3 text-[13px] text-[#475569] font-medium leading-relaxed bg-white/60 p-3 rounded-[16px] border border-white">
              ⚠️ Se detectan <b>múltiples áreas que podrían necesitar atención</b>. Considera apoyarte con un profesional si los síntomas persisten.
            </p>
          )}
        </div>

        {/* DISCLAIMER FINAL */}
        <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-[20px] p-5 mb-6 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#D97706] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
          <p className="text-[12px] text-[#92400E] leading-relaxed font-medium">
            <b>Este test no constituye un diagnóstico clínico.</b> Está basado en herramientas psicológicas validadas y su objetivo es orientar y sugerir apoyo profesional.
          </p>
        </div>

        {errorMsg && (
          <p className="mb-4 text-center text-[13px] text-[#B91C1C] font-bold">{errorMsg}</p>
        )}

        <button
          onClick={handleSaveAndContinue}
          disabled={saving}
          className="w-full py-4 bg-[#6C72F1] hover:bg-[#5C61E1] text-white rounded-[24px] font-extrabold text-[14px] uppercase tracking-wider transition-all shadow-[0_4px_15px_rgba(108,114,241,0.3)] hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 flex justify-center items-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Guardando...
            </>
          ) : (
            <>Continuar a mi ruta clínica <ArrowRight className="w-4 h-4" strokeWidth={2.5} /></>
          )}
        </button>
      </div>
    </div>
  );
}
