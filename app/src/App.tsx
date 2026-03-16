/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Printer, 
  RotateCcw,
  AlertTriangle,
  Info,
  ChevronLeft,
  ClipboardList,
  ShieldAlert,
  ArrowLeftRight,
  ArrowRight
} from 'lucide-react';
import clinicLogo from './assets/ingorokva-clinic-logo.svg';

// --- Types ---

type View = 'dashboard' | 'morse' | 'braden' | 'handover';
type RiskLevel = 'low' | 'medium' | 'high' | 'none';

interface Criterion {
  id: string;
  label: string;
  options: { label: string; value: number }[];
}

// --- Constants (Morse Fall Scale) ---

const MORSE_CRITERIA: Criterion[] = [
  {
    id: 'falls',
    label: 'დაცემის ანამნეზი ბოლო 3 თვის განმავლობაში',
    options: [
      { label: 'არა', value: 0 },
      { label: 'კი', value: 25 },
    ],
  },
  {
    id: 'como',
    label: 'კომორბიდობები ანუ ერთზე მეტი დაავადება',
    options: [
      { label: 'არა', value: 0 },
      { label: 'კი', value: 15 },
    ],
  },
  {
    id: 'mob',
    label: 'გადაადგილების დამხმარე საშუალებები',
    options: [
      { label: 'არ იყენებს / წოლითი რეჟიმი / ექთნის დახმარება', value: 0 },
      { label: 'იყენებს ყავარჯნებს, ხელჯოხს ან ორთოპედიული სამარჯვს, ჭოჭინის სახით', value: 15 },
      { label: 'ეჭიდება ავეჯს, ან გადაადგილდება კედელ-კედელ', value: 30 },
    ],
  },
  {
    id: 'iv',
    label: 'ინტრავენური სისტემის ან ჰეპარინის ლოკის არსებობა',
    options: [
      { label: 'არა', value: 0 },
      { label: 'კი', value: 20 },
    ],
  },
  {
    id: 'gait',
    label: 'სიარული / გადაადგილება',
    options: [
      { label: 'ნორმალური / წოლითი რეჟიმი / უმოძრაო', value: 0 },
      { label: 'სიარული მოკლე ნაბიჯებით, შეჩერებებით და დაყოვნებით', value: 10 },
      { label: 'არ შეუძლია ადგომა, დადის მხოლოდ თუ ეყდნობა რაღაცას და დაბლა იყურება', value: 20 },
    ],
  },
  {
    id: 'mental',
    label: 'ფსიქიკური მდგომარეობა',
    options: [
      { label: 'იცის საკუთარი შესაძლებლობები', value: 0 },
      { label: 'პაციენტი რეალურად ვერ აცნობიერებს საკუთარ შეზღუდვებს და არარეალური წარმოდგენები აქვს საკუთარ შესაძლებლობებზე', value: 15 },
    ],
  },
];

const MORSE_INTERVENTIONS = {
  low: [
    'დაცემის დაბალი რისკის (MFS=0-24) შემთხვევაში:',
    '• პაციენტისთვის მორზეს დაცემის კალკულატორის მონაცემების შედეგების შეტყობინება;',
    '• პაციენტისთვის გამოძახების ღილაკის და საექთო პოსტის ლოკალიზაციის/ადგილმდებარეობის გაცნობა;',
    '• პაციენტისთვის დაცემის პრევენციული ზომების გაცნობა (შესაბამისი ინფორმაციის განთავსება ყველა პალატაში);',
    '• პაციენტის დაცემის შემთხვევევაში, პირველადი დახმარების გაწევა, ექიმის ინფორმირება, დაცემის ინციდენტის ფორმის შევებსა და გადაცემა უფროსი ექთნისთვის;',
    '• პაციენტის დაცემის რისკის განმეორებითი შეფასება'
  ],
  medium: [
    'დაცემის საშუალო რისკის (MFS=25-50) შემთვევაში:',
    '• დაბალი რისკის რუბრიკაში აღწერილ ღონისძიებებს პლუს დაცემის პრევენციის ღონისძიებების დეტალური გაცნობა:',
    '• საწოლიდან ან სავარძლიდან წამოდგომამდე რამდენიმე წუთი დაყოვნება მჯდომარე მდგომარეობაში და შემდგომ ნელი წამოდგომა',
    '• თავბრუს/თავბრუხვევის შემთხვევაში არ შეიძლება წამოდგომა და გამოძახებულ უნდა იქნას ექთანი შესაბამისი ღილაკის მეშვეობით',
    '• დაცემის შემთხვევაში ექთნის გამოძახება შესაბამისი ღილაკის მეშვეობით',
    '• უქუსლო, კარგი მოჭიდების მქონე ფეხსაცმლის ტარება',
    '• პაციენტის გადაადგილების გზაზე არ უნდა იყოს დაბრკოლებები და იატაკი უნდა იყოს მშრალი (ყურადღება მიექცეს სველ წერტილებს)',
    '• პალატაში ღამის განათების უზრუნველყოფა'
  ],
  high: [
    'დაცემის მაღალი რისკის (MFS >= 51) შემთხვევაში:',
    '• საშუალო რისკის რუბრიკაში აღწერილ ღონისძიებებს პლუს:',
    '• პაციენტის განთავსება საექთო პოსტთან მაქსიმალურად ახლოს',
    '• პაციენტის მუდმივი მეთვალყურეობა (საჭიროების შემთხვევაში ახლობლის ჩართულობა)',
    '• დამხმარე საშუალებების (ჭოჭინა, ხელჯოხი) გამოყენების მკაცრი კონტროლი',
    '• საჭიროების შემთხვევაში პაციენტის ფიქსაცია (მხოლოდ ექიმის დანიშნულებით და შესაბამისი პროტოკოლით)',
    '• დაცემის რისკის შესახებ საინფორმაციო ნიშნის განთავსება პაციენტის საწოლთან'
  ]
};

// --- Constants (Braden Scale) ---

const BRADEN_CRITERIA: Criterion[] = [
  {
    id: 'sensory',
    label: 'მგრძნობელობა (Sensory Perception)',
    options: [
      { label: '1. სრულად შეზღუდული', value: 1 },
      { label: '2. ძალიან შეზღუდული', value: 2 },
      { label: '3. ოდნავ შეზღუდული', value: 3 },
      { label: '4. არ არის დარღვევა', value: 4 },
    ],
  },
  {
    id: 'moisture',
    label: 'ტენიანობა (Moisture)',
    options: [
      { label: '1. მუდმივად ტენიანი', value: 1 },
      { label: '2. ძალიან ტენიანი', value: 2 },
      { label: '3. ხანდახან ტენიანი', value: 3 },
      { label: '4. იშვიათად ტენიანი', value: 4 },
    ],
  },
  {
    id: 'activity',
    label: 'აქტივობა (Activity)',
    options: [
      { label: '1. წოლითი რეჟიმი', value: 1 },
      { label: '2. მჯდომარე რეჟიმი', value: 2 },
      { label: '3. იშვიათად დადის', value: 3 },
      { label: '4. ხშირად დადის', value: 4 },
    ],
  },
  {
    id: 'mobility',
    label: 'მობილობა (Mobility)',
    options: [
      { label: '1. სრულიად უმოძრაო', value: 1 },
      { label: '2. ძალიან შეზღუდული', value: 2 },
      { label: '3. ოდნავ შეზღუდული', value: 3 },
      { label: '4. არ არის შეზღუდვა', value: 4 },
    ],
  },
  {
    id: 'nutrition',
    label: 'კვება (Nutrition)',
    options: [
      { label: '1. ძალიან ცუდი', value: 1 },
      { label: '2. სავარაუდოდ არაადეკვატური', value: 2 },
      { label: '3. ადეკვატური', value: 3 },
      { label: '4. შესანიშნავი', value: 4 },
    ],
  },
  {
    id: 'friction',
    label: 'ხახუნი და დაწოლა (Friction and Shear)',
    options: [
      { label: '1. პრობლემა', value: 1 },
      { label: '2. პოტენციური პრობლემა', value: 2 },
      { label: '3. არ არის აშკარა პრობლემა', value: 3 },
    ],
  },
];

const BRADEN_INTERVENTIONS = {
  veryHigh: [
    'ძალიან მაღალი რისკი (Score <= 9):',
    '• პაციენტის მობრუნება ყოველ 2 საათში ერთხელ მკაცრი გრაფიკით',
    '• სპეციალური ანტი-დეკუბიტალური ლეიბის გამოყენება',
    '• კანის დატენიანება და დაცვა ტენიანობისგან',
    '• კვების სტატუსის ოპტიმიზაცია (დიეტოლოგის კონსულტაცია)',
    '• ხახუნის და დაწოლის შემცირება დამხმარე საშუალებებით'
  ],
  high: [
    'მაღალი რისკი (Score 10-12):',
    '• პაციენტის მობრუნების გრაფიკის დაცვა',
    '• კანის ყოველდღიური ინსპექცია',
    '• ტენიანობის კონტროლი',
    '• დამხმარე ბალიშების გამოყენება ძვლოვანი პროექციების დასაცავად'
  ],
  moderate: [
    'საშუალო რისკი (Score 13-14):',
    '• პაციენტის მობილიზაციის წახალისება',
    '• კანის მოვლის საშუალებების გამოყენება',
    '• კვების გაუმჯობესება'
  ],
  low: [
    'დაბალი რისკი (Score 15-18):',
    '• პერიოდული მეთვალყურეობა',
    '• კანის სისუფთავის და სიმშრალის შენარჩუნება',
    '• აქტიური მოძრაობის წახალისება'
  ],
  none: [
    'რისკი არ არის (Score > 18):',
    '• სტანდარტული მოვლა'
  ]
};

const formatDisplayDate = (value: string) => {
  if (!value) return '________________';

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString('ka-GE');
};

const getMorseSelectionMeta = (criterion: Criterion, value: number | null) => {
  const option = criterion.options.find((entry) => entry.value === value);

  if (value === null || !option) {
    return {
      label: '',
      full: '',
      score: '—',
    };
  }

  return {
    label: option.label,
    full: option.label,
    score: String(value),
  };
};

const cleanInterventionItem = (value: string) => value.replace(/^•\s*/, '');

// --- Components ---

const ClinicLogo = ({ compact = false }: { compact?: boolean }) => (
  <img
    src={clinicLogo}
    alt="ინგოროყვას საუნივერსიტეტო კლინიკა HM Center"
    className={`clinic-logo ${compact ? 'clinic-logo--compact' : 'clinic-logo--default'}`}
  />
);

const Dashboard = ({ setView }: { setView: (v: View) => void }) => {
  const documents = [
    { 
      id: 'morse' as View, 
      title: 'დაცემის მორზეს შკალა', 
      description: 'პაციენტის დაცემის რისკის შეფასების ინსტრუმენტი',
      icon: <ShieldAlert className="text-red-500" size={24} />,
      color: 'hover:border-red-200 hover:bg-red-50/30'
    },
    { 
      id: 'braden' as View, 
      title: 'ბრადენის შკალა-ნაწოლები', 
      description: 'ნაწოლების განვითარების რისკის შეფასება',
      icon: <ClipboardList className="text-blue-500" size={24} />,
      color: 'hover:border-blue-200 hover:bg-blue-50/30'
    },
    { 
      id: 'handover' as View, 
      title: 'ექთნის გადაბარების ჩექლისთი', 
      description: 'პაციენტის ინფორმაციის გადაცემის სტანდარტული ფორმა',
      icon: <ArrowLeftRight className="text-emerald-500" size={24} />,
      color: 'hover:border-emerald-200 hover:bg-emerald-50/30'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 screen-only">
      <div className="text-center mb-16">
        <div className="flex justify-end mb-4">
          <ClinicLogo />
        </div>
        <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight mb-4">საექთნო დოკუმენტები</h1>
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Nursing Documentation Portal</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {documents.map((doc) => (
          <button
            key={doc.id}
            onClick={() => setView(doc.id)}
            className={`group text-left p-8 bg-white border border-slate-200 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 ${doc.color}`}
          >
            <div className="flex items-start justify-between mb-6">
              <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-white transition-colors">
                {doc.icon}
              </div>
              <ArrowRight className="text-slate-200 group-hover:text-slate-400 transition-colors" size={20} />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">{doc.title}</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">{doc.description}</p>
          </button>
        ))}
        
        <div className="md:col-span-2 p-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mb-4">
            <Info size={24} />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">დამატებითი ფორმები მალე დაემატება</p>
        </div>
      </div>
    </div>
  );
};

const MorseFallScale = ({ onBack }: { onBack: () => void }) => {
  const [scores, setScores] = useState<Record<string, number | null>>(
    Object.fromEntries(MORSE_CRITERIA.map(c => [c.id, null]))
  );

  const [patientInfo, setPatientInfo] = useState({
    name: '',
    age: '',
    id: '',
    historyNum: '',
    gender: '',
    assessor: '',
    date: new Date().toISOString().split('T')[0]
  });

  const totalScore = useMemo(() => {
    return Object.keys(scores).reduce((acc, key) => acc + (scores[key] || 0), 0);
  }, [scores]);

  const riskLevel: RiskLevel = useMemo(() => {
    if (Object.values(scores).some(v => v === null)) return 'none';
    if (totalScore >= 51) return 'high';
    if (totalScore >= 25) return 'medium';
    return 'low';
  }, [totalScore, scores]);

  const isComplete = useMemo(() => {
    return Object.values(scores).every(v => v !== null);
  }, [scores]);

  const getRiskColor = () => {
    if (riskLevel === 'high') return 'text-red-600 bg-red-50 border-red-200';
    if (riskLevel === 'medium') return 'text-amber-600 bg-amber-50 border-amber-200';
    if (riskLevel === 'low') return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    return 'text-slate-400 bg-slate-50 border-slate-200';
  };

  const getRiskLabel = () => {
    if (riskLevel === 'high') return 'მაღალი';
    if (riskLevel === 'medium') return 'საშუალო';
    if (riskLevel === 'low') return 'დაბალი';
    return '—';
  };

  const getInterventionType = () => {
    if (riskLevel === 'high') return 'მაღალი რისკის ინტერვენციების სია';
    if (riskLevel === 'medium') return 'საშუალო რისკის ინტერვენციების სია';
    if (riskLevel === 'low') return 'დაბალი რისკის ინტერვენციების სია';
    return 'ინტერვენციების სია';
  };

  const handleReset = () => {
    setScores(Object.fromEntries(MORSE_CRITERIA.map(c => [c.id, null])));
    setPatientInfo({
      name: '',
      age: '',
      id: '',
      historyNum: '',
      gender: '',
      assessor: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="print-sheet max-w-[210mm] mx-auto bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden print:max-w-none print:shadow-none print:border-0 print:rounded-none print:overflow-visible">
      <div className="screen-only">
        {/* Header Section */}
        <div className="bg-white border-b border-slate-100 p-8 sm:p-10 text-center">
        <div className="flex justify-between items-start mb-6 no-print">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-all font-bold text-[10px] uppercase tracking-wider"
          >
            <ChevronLeft size={14} /> უკან დაბრუნება
          </button>
          <div className="flex gap-3">
            <button 
              onClick={handleReset} 
              className="flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md transition-all font-bold text-[10px] uppercase tracking-wider"
            >
              <RotateCcw size={14} /> გასუფთავება
            </button>
            <button 
              onClick={() => window.print()} 
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-1.5 rounded-md font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm active:scale-95"
            >
              <Printer size={14} /> ბეჭდვა
            </button>
          </div>
        </div>

        <div className="flex justify-end mb-4">
          <ClinicLogo compact />
        </div>
        
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">დაცემის რისკის შეფასების მორზეს შკალა</h1>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Morse Fall Scale Assessment Tool</p>
        <div className="mt-4 inline-block px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">განახლებულია 2024 წლის 28 მაისს</p>
        </div>
        </div>

        <div className="p-8 sm:p-12">
        {/* Patient Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-x-10 gap-y-8 mb-16">
          <div className="sm:col-span-8 group">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-focus-within:text-slate-900 transition-colors">პაციენტის სახელი, გვარი</label>
            <input 
              type="text" 
              value={patientInfo.name} 
              onChange={e => setPatientInfo({...patientInfo, name: e.target.value})}
              className="w-full bg-transparent border-b border-slate-200 focus:border-slate-900 outline-none py-1.5 font-bold text-slate-800 transition-all placeholder:text-slate-200" 
              placeholder="შეიყვანეთ სახელი..."
            />
          </div>
          <div className="sm:col-span-4 group">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-focus-within:text-slate-900 transition-colors">ასაკი</label>
            <div className="flex items-end gap-2 border-b border-slate-200 focus-within:border-slate-900 transition-all">
              <input 
                type="text" 
                value={patientInfo.age} 
                onChange={e => setPatientInfo({...patientInfo, age: e.target.value})}
                className="w-full bg-transparent outline-none py-1.5 font-bold text-slate-800" 
              />
              <span className="pb-1.5 text-[10px] font-bold text-slate-300 uppercase">წელი</span>
            </div>
          </div>

          <div className="sm:col-span-6 group">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-focus-within:text-slate-900 transition-colors">პირადი ნომერი</label>
            <input 
              type="text" 
              value={patientInfo.id} 
              onChange={e => setPatientInfo({...patientInfo, id: e.target.value})}
              className="w-full bg-transparent border-b border-slate-200 focus:border-slate-900 outline-none py-1.5 font-bold text-slate-800 transition-all" 
            />
          </div>
          <div className="sm:col-span-6 group">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-focus-within:text-slate-900 transition-colors">ისტორიის ნომერი</label>
            <input 
              type="text" 
              value={patientInfo.historyNum} 
              onChange={e => setPatientInfo({...patientInfo, historyNum: e.target.value})}
              className="w-full bg-transparent border-b border-slate-200 focus:border-slate-900 outline-none py-1.5 font-bold text-slate-800 transition-all" 
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">სქესი</label>
            <div className="flex gap-2">
              {['კაცი', 'ქალი'].map((g) => (
                <button
                  key={g}
                  onClick={() => setPatientInfo({...patientInfo, gender: g})}
                  className={`flex-1 py-1.5 rounded border font-bold text-[10px] uppercase tracking-wider transition-all ${
                    patientInfo.gender === g 
                    ? 'bg-slate-900 border-slate-900 text-white' 
                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-4 group">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-focus-within:text-slate-900 transition-colors">შემფასებელი</label>
            <input 
              type="text" 
              value={patientInfo.assessor} 
              onChange={e => setPatientInfo({...patientInfo, assessor: e.target.value})}
              className="w-full bg-transparent border-b border-slate-200 focus:border-slate-900 outline-none py-1.5 font-bold text-slate-800 transition-all" 
            />
          </div>
          <div className="sm:col-span-4 group">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-focus-within:text-slate-900 transition-colors">შეფასების თარიღი</label>
            <input 
              type="date" 
              value={patientInfo.date} 
              onChange={e => setPatientInfo({...patientInfo, date: e.target.value})}
              className="w-full bg-transparent border-b border-slate-200 focus:border-slate-900 outline-none py-1.5 font-bold text-slate-800 transition-all" 
            />
          </div>
        </div>

        {/* Criteria Section */}
        <div className="space-y-6 mb-16">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">შეფასების კრიტერიუმები</h2>
            <div className="h-[1px] flex-1 bg-slate-100"></div>
          </div>

          {MORSE_CRITERIA.map((criterion, cIdx) => {
            const selected = getMorseSelectionMeta(criterion, scores[criterion.id]);

            return (
              <div key={criterion.id} className="group rounded-[1.75rem] border border-slate-200 bg-gradient-to-r from-white via-white to-slate-50/70 p-5 shadow-sm">
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-900 text-[11px] font-black text-white shadow-sm">
                      {String(cIdx + 1).padStart(2, '0')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-start">
                        <div className="flex min-w-0 flex-1 items-start gap-2">
                          <p className="text-sm font-black text-slate-900 leading-snug">{criterion.label}</p>
                          <div className="morse-leader mt-3 hidden xl:block text-slate-200"></div>
                        </div>
                        <div className="flex items-start gap-2 xl:w-[24rem] xl:max-w-[24rem] xl:justify-end">
                          <div className={`min-w-0 flex-1 rounded-2xl border px-4 py-3 text-[11px] font-semibold leading-snug ${
                            scores[criterion.id] !== null
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-200 bg-white text-slate-400'
                          }`}>
                            {selected.label || 'აირჩიეთ პასუხი ქვემოთ'}
                          </div>
                          <span className={`inline-flex min-w-[48px] items-center justify-center rounded-xl border px-3 py-1.5 text-[10px] font-black ${
                            scores[criterion.id] !== null
                              ? 'border-slate-900 bg-slate-50 text-slate-900'
                              : 'border-slate-200 bg-white text-slate-300'
                          }`}>
                            {selected.score}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pl-0 sm:pl-12">
                    <div className={`grid grid-cols-1 gap-2 ${criterion.options.length === 2 ? 'md:grid-cols-2' : 'xl:grid-cols-3'}`}>
                      {criterion.options.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setScores({...scores, [criterion.id]: opt.value})}
                          className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                            scores[criterion.id] === opt.value
                              ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-[11px] font-bold leading-snug">
                              {opt.label}
                            </span>
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                              scores[criterion.id] === opt.value
                                ? 'bg-white/15 text-white'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {opt.value}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Results Summary */}
        <div className="mt-20 pt-10 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-10 items-start">
            <div className="sm:col-span-4">
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm">
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">საბოლოო ქულა</span>
                <span className="text-6xl font-black text-slate-900 block mb-3">{totalScore}</span>
                <div className={`inline-block px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest border transition-all ${getRiskColor()}`}>
                  {getRiskLabel()} რისკი
                </div>
              </div>
            </div>

            <div className="sm:col-span-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-wider">პრევენციული ინტერვენცია</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{getInterventionType()}</p>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                {isComplete ? (
                  <div className="space-y-3">
                    {MORSE_INTERVENTIONS[riskLevel === 'none' ? 'low' : riskLevel].map((item, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="w-1 h-1 rounded-full bg-slate-300 mt-1.5 shrink-0"></div>
                        <p className="text-[11px] leading-relaxed text-slate-600 font-medium">
                          {cleanInterventionItem(item)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <Info className="mx-auto text-slate-200 mb-2" size={20} />
                    <p className="text-[10px] font-bold text-slate-300 italic">გთხოვთ შეავსოთ ყველა პუნქტი რეკომენდაციების სანახავად</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6 no-print">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center text-white font-black text-[8px]">HT</div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">HTMC Medical Center • Morse Fall Scale</p>
          </div>
          <div className="flex gap-8 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            <div className="flex flex-col gap-1">
              <span className="opacity-50">შემფასებელი</span>
              <span className="text-slate-900 border-b border-slate-200 min-w-[120px] pb-0.5"></span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="opacity-50">თარიღი</span>
              <span className="text-slate-900">{formatDisplayDate(patientInfo.date)}</span>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Print Version */}
      <div className="print-only bg-white text-black p-0 font-sans">
        <div className="print-break-avoid border border-black p-6 mb-8 text-center">
          <div className="flex justify-end mb-3">
            <ClinicLogo compact />
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight">დაცემის რისკის შეფასების მორზეს შკალა</h1>
          <p className="text-xs font-bold uppercase tracking-widest mt-1">Morse Fall Scale Assessment Tool</p>
          <p className="text-[8px] mt-2 font-semibold">განახლებულია 2024 წლის 28 მაისს</p>
        </div>

        <div className="print-break-avoid grid grid-cols-2 gap-3 mb-8">
          <div className="border border-black px-3 py-2">
            <p className="text-[8px] font-black uppercase tracking-widest mb-1">პაციენტი</p>
            <p className="text-[10px] font-semibold">{patientInfo.name || '________________'}</p>
          </div>
          <div className="border border-black px-3 py-2">
            <p className="text-[8px] font-black uppercase tracking-widest mb-1">ასაკი</p>
            <p className="text-[10px] font-semibold">{patientInfo.age || '____'} წელი</p>
          </div>
          <div className="border border-black px-3 py-2">
            <p className="text-[8px] font-black uppercase tracking-widest mb-1">პირადი №</p>
            <p className="text-[10px] font-semibold">{patientInfo.id || '________________'}</p>
          </div>
          <div className="border border-black px-3 py-2">
            <p className="text-[8px] font-black uppercase tracking-widest mb-1">ისტორია №</p>
            <p className="text-[10px] font-semibold">{patientInfo.historyNum || '________________'}</p>
          </div>
          <div className="border border-black px-3 py-2">
            <p className="text-[8px] font-black uppercase tracking-widest mb-1">სქესი</p>
            <p className="text-[10px] font-semibold">{patientInfo.gender || '____'}</p>
          </div>
          <div className="border border-black px-3 py-2">
            <p className="text-[8px] font-black uppercase tracking-widest mb-1">თარიღი</p>
            <p className="text-[10px] font-semibold">{formatDisplayDate(patientInfo.date)}</p>
          </div>
        </div>

        <div className="print-break-avoid mb-8">
          <div className="flex items-center gap-3 mb-4 border-b border-black pb-2">
            <p className="text-[10px] font-black uppercase tracking-[0.18em]">შეფასების კრიტერიუმები</p>
            <div className="morse-leader text-black/60"></div>
          </div>

          <div className="space-y-3">
            {MORSE_CRITERIA.map((criterion, index) => {
              const selected = getMorseSelectionMeta(criterion, scores[criterion.id]);

              return (
                <div key={criterion.id} className="print-break-avoid grid grid-cols-[8mm,minmax(0,1fr),58mm,14mm] gap-2 items-start">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-black text-[8px] font-black">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <p className="text-[10px] font-semibold leading-snug">{criterion.label}</p>
                    <div className="morse-leader text-black/60"></div>
                  </div>
                  <div className="min-h-[12mm] rounded-md border border-black px-2 py-1.5 text-[8px] leading-[1.3] font-semibold">
                    {selected.label || ' '}
                  </div>
                  <div className="flex min-h-[12mm] items-center justify-center rounded-md border border-black px-1 py-1 text-[10px] font-black">
                    {selected.score}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="print-break-avoid border border-black p-6 mb-10">
          <div className="flex justify-between items-center mb-4 border-b border-black pb-2">
            <p className="text-[10px] font-black uppercase tracking-widest">რისკის დონე: {getRiskLabel()}</p>
            <p className="text-[10px] font-black uppercase tracking-widest">ინტერვენცია: {getInterventionType()}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="border border-black px-3 py-2">
              <p className="text-[8px] font-black uppercase tracking-widest mb-1">საბოლოო ქულა</p>
              <p className="text-base font-black">{totalScore}</p>
            </div>
            <div className="border border-black px-3 py-2">
              <p className="text-[8px] font-black uppercase tracking-widest mb-1">რისკის დონე</p>
              <p className="text-[10px] font-black">{getRiskLabel()} რისკი</p>
            </div>
          </div>
          {isComplete ? (
            <div className="space-y-2">
              {MORSE_INTERVENTIONS[riskLevel].map((item, i) => (
                <p key={i} className="text-[9px] leading-snug font-medium">• {cleanInterventionItem(item)}</p>
              ))}
            </div>
          ) : (
            <p className="text-[9px] leading-snug font-medium">გთხოვთ შეავსოთ ყველა პუნქტი რეკომენდაციების სანახავად.</p>
          )}
        </div>

        <div className="print-break-avoid flex justify-between mt-20 text-[10px] font-bold uppercase tracking-widest">
          <div className="flex flex-col gap-2">
            <span>შემფასებელი: ________________________</span>
            <span className="text-[8px] font-medium normal-case tracking-normal">{patientInfo.assessor || '________________'}</span>
          </div>
          <p>თარიღი: {formatDisplayDate(patientInfo.date)}</p>
        </div>
      </div>
    </div>
  );
};

const BradenScale = ({ onBack }: { onBack: () => void }) => {
  const [scores, setScores] = useState<Record<string, number | null>>(
    Object.fromEntries(BRADEN_CRITERIA.map(c => [c.id, null]))
  );

  const [patientInfo, setPatientInfo] = useState({
    name: '',
    age: '',
    id: '',
    historyNum: '',
    gender: '',
    assessor: '',
    date: new Date().toISOString().split('T')[0]
  });

  const totalScore = useMemo(() => {
    return Object.keys(scores).reduce((acc, key) => acc + (scores[key] || 0), 0);
  }, [scores]);

  const riskLevel = useMemo(() => {
    if (Object.values(scores).some(v => v === null)) return 'none';
    if (totalScore <= 9) return 'veryHigh';
    if (totalScore <= 12) return 'high';
    if (totalScore <= 14) return 'moderate';
    if (totalScore <= 18) return 'low';
    return 'none';
  }, [totalScore, scores]);

  const isComplete = useMemo(() => {
    return Object.values(scores).every(v => v !== null);
  }, [scores]);

  const getRiskColor = () => {
    if (riskLevel === 'veryHigh' || riskLevel === 'high') return 'text-red-600 bg-red-50 border-red-200';
    if (riskLevel === 'moderate') return 'text-amber-600 bg-amber-50 border-amber-200';
    if (riskLevel === 'low') return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    return 'text-slate-400 bg-slate-50 border-slate-200';
  };

  const getRiskLabel = () => {
    if (riskLevel === 'veryHigh') return 'ძალიან მაღალი';
    if (riskLevel === 'high') return 'მაღალი';
    if (riskLevel === 'moderate') return 'საშუალო';
    if (riskLevel === 'low') return 'დაბალი';
    return '—';
  };

  const handleReset = () => {
    setScores(Object.fromEntries(BRADEN_CRITERIA.map(c => [c.id, null])));
    setPatientInfo({
      name: '',
      age: '',
      id: '',
      historyNum: '',
      gender: '',
      assessor: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="print-sheet max-w-[210mm] mx-auto bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden print:max-w-none print:shadow-none print:border-0 print:rounded-none print:overflow-visible">
      <div className="screen-only">
        {/* Header Section */}
        <div className="bg-white border-b border-slate-100 p-8 sm:p-10 text-center">
        <div className="flex justify-between items-start mb-6 no-print">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-all font-bold text-[10px] uppercase tracking-wider"
          >
            <ChevronLeft size={14} /> უკან დაბრუნება
          </button>
          <div className="flex gap-3">
            <button 
              onClick={handleReset} 
              className="flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md transition-all font-bold text-[10px] uppercase tracking-wider"
            >
              <RotateCcw size={14} /> გასუფთავება
            </button>
            <button 
              onClick={() => window.print()} 
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-1.5 rounded-md font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm active:scale-95"
            >
              <Printer size={14} /> ბეჭდვა
            </button>
          </div>
        </div>

        <div className="flex justify-end mb-4">
          <ClinicLogo compact />
        </div>
        
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">ბრადენის შკალა (Braden Scale)</h1>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Pressure Ulcer Risk Assessment Tool</p>
        <div className="mt-4 inline-block px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">ნაწოლების განვითარების რისკის შეფასება</p>
        </div>
        </div>

        <div className="p-8 sm:p-12">
        {/* Patient Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-x-10 gap-y-8 mb-16">
          <div className="sm:col-span-8 group">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-focus-within:text-slate-900 transition-colors">პაციენტის სახელი, გვარი</label>
            <input 
              type="text" 
              value={patientInfo.name} 
              onChange={e => setPatientInfo({...patientInfo, name: e.target.value})}
              className="w-full bg-transparent border-b border-slate-200 focus:border-slate-900 outline-none py-1.5 font-bold text-slate-800 transition-all placeholder:text-slate-200" 
              placeholder="შეიყვანეთ სახელი..."
            />
          </div>
          <div className="sm:col-span-4 group">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-focus-within:text-slate-900 transition-colors">ასაკი</label>
            <div className="flex items-end gap-2 border-b border-slate-200 focus-within:border-slate-900 transition-all">
              <input 
                type="text" 
                value={patientInfo.age} 
                onChange={e => setPatientInfo({...patientInfo, age: e.target.value})}
                className="w-full bg-transparent outline-none py-1.5 font-bold text-slate-800" 
              />
              <span className="pb-1.5 text-[10px] font-bold text-slate-300 uppercase">წელი</span>
            </div>
          </div>

          <div className="sm:col-span-6 group">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-focus-within:text-slate-900 transition-colors">პირადი ნომერი</label>
            <input 
              type="text" 
              value={patientInfo.id} 
              onChange={e => setPatientInfo({...patientInfo, id: e.target.value})}
              className="w-full bg-transparent border-b border-slate-200 focus:border-slate-900 outline-none py-1.5 font-bold text-slate-800 transition-all" 
            />
          </div>
          <div className="sm:col-span-6 group">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-focus-within:text-slate-900 transition-colors">ისტორიის ნომერი</label>
            <input 
              type="text" 
              value={patientInfo.historyNum} 
              onChange={e => setPatientInfo({...patientInfo, historyNum: e.target.value})}
              className="w-full bg-transparent border-b border-slate-200 focus:border-slate-900 outline-none py-1.5 font-bold text-slate-800 transition-all" 
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">სქესი</label>
            <div className="flex gap-2">
              {['კაცი', 'ქალი'].map((g) => (
                <button
                  key={g}
                  onClick={() => setPatientInfo({...patientInfo, gender: g})}
                  className={`flex-1 py-1.5 rounded border font-bold text-[10px] uppercase tracking-wider transition-all ${
                    patientInfo.gender === g 
                    ? 'bg-slate-900 border-slate-900 text-white' 
                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-4 group">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-focus-within:text-slate-900 transition-colors">შემფასებელი</label>
            <input 
              type="text" 
              value={patientInfo.assessor} 
              onChange={e => setPatientInfo({...patientInfo, assessor: e.target.value})}
              className="w-full bg-transparent border-b border-slate-200 focus:border-slate-900 outline-none py-1.5 font-bold text-slate-800 transition-all" 
            />
          </div>
          <div className="sm:col-span-4 group">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-focus-within:text-slate-900 transition-colors">შეფასების თარიღი</label>
            <input 
              type="date" 
              value={patientInfo.date} 
              onChange={e => setPatientInfo({...patientInfo, date: e.target.value})}
              className="w-full bg-transparent border-b border-slate-200 focus:border-slate-900 outline-none py-1.5 font-bold text-slate-800 transition-all" 
            />
          </div>
        </div>

        {/* Criteria Section */}
        <div className="space-y-10 mb-16">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em]">შეფასების კრიტერიუმები</h2>
            <div className="h-[1px] flex-1 bg-slate-100"></div>
          </div>

          {BRADEN_CRITERIA.map((criterion, cIdx) => (
            <div key={criterion.id} className="group">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-4">
                    <span className="text-xs font-black text-slate-300 mt-0.5">{String(cIdx + 1).padStart(2, '0')}</span>
                    <p className="text-sm font-bold text-slate-800 leading-snug">{criterion.label}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-1.5 pl-7">
                    {criterion.options.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setScores({...scores, [criterion.id]: opt.value})}
                        className={`w-full text-left px-4 py-2.5 rounded-lg border transition-all flex justify-between items-center group/btn ${
                          scores[criterion.id] === opt.value 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-sm' 
                          : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-[11px] font-bold">
                          {opt.label}
                        </span>
                        <span className={`ml-4 text-[10px] font-black ${
                          scores[criterion.id] === opt.value ? 'text-white/60' : 'text-slate-300'
                        }`}>
                          {opt.value}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sm:w-20 flex flex-col items-center justify-center no-print pt-8 sm:pt-0">
                  <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">ქულა</div>
                  <div className={`w-12 h-10 rounded-lg border flex items-center justify-center text-sm font-black transition-all ${
                    scores[criterion.id] !== null 
                    ? 'bg-slate-50 border-slate-200 text-slate-900' 
                    : 'bg-white border-slate-50 text-slate-100'
                  }`}>
                    {scores[criterion.id] !== null ? scores[criterion.id] : '—'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Results Summary */}
        <div className="mt-20 pt-10 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-10 items-start">
            <div className="sm:col-span-4">
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-sm">
                <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">საბოლოო ქულა</span>
                <span className="text-6xl font-black text-slate-900 block mb-3">{totalScore}</span>
                <div className={`inline-block px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest border transition-all ${getRiskColor()}`}>
                  {getRiskLabel()} რისკი
                </div>
              </div>
            </div>

            <div className="sm:col-span-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-wider">პრევენციული ინტერვენცია</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ბრადენის შკალის რეკომენდაციები</p>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                {isComplete ? (
                  <div className="space-y-3">
                    {BRADEN_INTERVENTIONS[riskLevel as keyof typeof BRADEN_INTERVENTIONS].map((item, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="w-1 h-1 rounded-full bg-slate-300 mt-1.5 shrink-0"></div>
                        <p className="text-[11px] leading-relaxed text-slate-600 font-medium">
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 mx-auto mb-3">
                      <Info size={20} />
                    </div>
                    <p className="text-[10px] font-bold text-slate-300 italic">გთხოვთ შეავსოთ ყველა პუნქტი რეკომენდაციების სანახავად</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6 no-print">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center text-white font-black text-[8px]">HT</div>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">HTMC Medical Center • Braden Scale</p>
          </div>
          <div className="flex gap-8 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            <div className="flex flex-col gap-1">
              <span className="opacity-50">შემფასებელი</span>
              <span className="text-slate-900 border-b border-slate-200 min-w-[120px] pb-0.5"></span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="opacity-50">თარიღი</span>
              <span className="text-slate-900">{formatDisplayDate(patientInfo.date)}</span>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Print Version */}
      <div className="print-only bg-white text-black p-0 font-sans">
        <div className="print-break-avoid border border-black p-6 mb-8 text-center">
          <div className="flex justify-end mb-3">
            <ClinicLogo compact />
          </div>
          <h1 className="text-xl font-black uppercase tracking-tight">ბრადენის შკალა (Braden Scale)</h1>
          <p className="text-xs font-bold uppercase tracking-widest mt-1">Pressure Ulcer Risk Assessment Tool</p>
        </div>

        <div className="print-break-avoid grid grid-cols-2 gap-x-12 gap-y-4 mb-10 text-[10px]">
          <div className="border-b border-black pb-1 flex justify-between"><span>პაციენტი:</span> <span className="font-bold">{patientInfo.name || '________________'}</span></div>
          <div className="border-b border-black pb-1 flex justify-between"><span>ასაკი:</span> <span className="font-bold">{patientInfo.age || '____'} წელი</span></div>
          <div className="border-b border-black pb-1 flex justify-between"><span>პირადი №:</span> <span className="font-bold">{patientInfo.id || '________________'}</span></div>
          <div className="border-b border-black pb-1 flex justify-between"><span>ისტორია №:</span> <span className="font-bold">{patientInfo.historyNum || '________________'}</span></div>
          <div className="border-b border-black pb-1 flex justify-between"><span>სქესი:</span> <span className="font-bold">{patientInfo.gender || '____'}</span></div>
          <div className="border-b border-black pb-1 flex justify-between"><span>თარიღი:</span> <span className="font-bold">{formatDisplayDate(patientInfo.date)}</span></div>
        </div>

        <table className="w-full border-collapse border border-black text-[10px] mb-10">
          <thead>
            <tr className="print-break-avoid">
              <th className="border border-black p-3 text-left uppercase tracking-widest">შეფასების კრიტერიუმი</th>
              <th className="border border-black p-3 text-center w-20 uppercase tracking-widest">ქულა</th>
            </tr>
          </thead>
          <tbody>
            {BRADEN_CRITERIA.map(c => (
              <tr key={c.id} className="print-break-avoid">
                <td className="border border-black p-3">
                  <p className="font-bold mb-1">{c.label}</p>
                  <p className="text-[9px] italic font-medium">არჩეული: {c.options.find(o => o.value === scores[c.id])?.label || '—'}</p>
                </td>
                <td className="border border-black p-3 text-center font-bold text-sm">{scores[c.id] ?? '—'}</td>
              </tr>
            ))}
            <tr className="font-black print-break-avoid">
              <td className="border border-black p-3 text-right uppercase tracking-widest">საბოლოო ქულა:</td>
              <td className="border border-black p-3 text-center text-base">{totalScore}</td>
            </tr>
          </tbody>
        </table>

        <div className="print-break-avoid border border-black p-6 mb-10">
          <div className="flex justify-between items-center mb-4 border-b border-black pb-2">
            <p className="text-[10px] font-black uppercase tracking-widest">რისკის დონე: {getRiskLabel()}</p>
          </div>
          {isComplete ? (
            <div className="space-y-2">
              {BRADEN_INTERVENTIONS[riskLevel as keyof typeof BRADEN_INTERVENTIONS]?.map((item, i) => (
                <p key={i} className="text-[9px] leading-snug font-medium">• {item}</p>
              ))}
            </div>
          ) : (
            <p className="text-[9px] leading-snug font-medium">გთხოვთ შეავსოთ ყველა პუნქტი რეკომენდაციების სანახავად.</p>
          )}
        </div>

        <div className="print-break-avoid flex justify-between mt-20 text-[10px] font-bold uppercase tracking-widest">
          <div className="flex flex-col gap-2">
            <span>შემფასებელი: ________________________</span>
            <span className="text-[8px] font-medium normal-case tracking-normal">{patientInfo.assessor || '________________'}</span>
          </div>
          <p>თარიღი: {formatDisplayDate(patientInfo.date)}</p>
        </div>
      </div>
    </div>
  );
};

const PlaceholderView = ({ title, onBack }: { title: string, onBack: () => void }) => (
  <div className="max-w-2xl mx-auto py-20 px-6 text-center screen-only">
    <div className="flex justify-end mb-4">
      <ClinicLogo compact />
    </div>
    <h2 className="text-2xl font-black text-slate-900 mb-4">{title}</h2>
    <p className="text-slate-500 font-medium mb-10 leading-relaxed">
      ეს დოკუმენტი ამჟამად დამუშავების პროცესშია და მალე ხელმისაწვდომი იქნება.
    </p>
    <button 
      onClick={onBack}
      className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md active:scale-95"
    >
      <ChevronLeft size={16} /> უკან დაბრუნება
    </button>
  </div>
);

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12 px-4 font-sans print:bg-white print:py-0 print:px-0">
      {currentView === 'dashboard' && <Dashboard setView={setCurrentView} />}
      {currentView === 'morse' && <MorseFallScale onBack={() => setCurrentView('dashboard')} />}
      {currentView === 'braden' && <BradenScale onBack={() => setCurrentView('dashboard')} />}
      {currentView === 'handover' && <PlaceholderView title="ექთნის გადაბარების ჩექლისთი" onBack={() => setCurrentView('dashboard')} />}
    </div>
  );
}
