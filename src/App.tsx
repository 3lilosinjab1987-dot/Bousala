import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  LogOut, 
  BookOpen, 
  GraduationCap, 
  Plus, 
  Trash2, 
  LayoutDashboard,
  ClipboardList,
  Menu,
  X,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, loginWithGoogle, logout, db, OperationType, handleFirestoreError } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  Timestamp, 
  updateDoc 
} from 'firebase/firestore';

// Types
interface Thesis {
  id: string;
  studentId: string;
  title: string;
  description: string;
  status: 'pending' | 'review' | 'completed';
  grade?: number;
  createdAt: any;
}

interface GradeEntry {
  id: string;
  studentId: string;
  subject: string;
  score: number;
  semester: string;
}

// SDG Colors for the Compass Ring
const SDG_COLORS = [
  '#E5243B', '#DDA63A', '#4C9F38', '#C5192D', '#FF3A21', 
  '#26BDE2', '#FCC30B', '#A21942', '#FD6925', '#DD1367', 
  '#FD9D24', '#BF8B2E', '#3F7E44', '#0A97D9', '#56C02B', 
  '#00689D', '#19486A'
];

function CompassLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <div className={`${className} relative flex items-center justify-center p-0.5`}>
      {/* SDG Color Wheel Background */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full rotate-[-90deg]">
        {SDG_COLORS.map((color, i) => {
          const angle = 360 / SDG_COLORS.length;
          const startAngle = i * angle;
          const endAngle = (i + 1) * angle;
          const x1 = 50 + 50 * Math.cos((startAngle * Math.PI) / 180);
          const y1 = 50 + 50 * Math.sin((startAngle * Math.PI) / 180);
          const x2 = 50 + 50 * Math.cos((endAngle * Math.PI) / 180);
          const y2 = 50 + 50 * Math.sin((endAngle * Math.PI) / 180);
          
          return (
            <path
              key={i}
              d={`M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`}
              fill={color}
              stroke="white"
              strokeWidth="0.5"
            />
          );
        })}
        {/* Inner gap/mask to make it a ring */}
        <circle cx="50" cy="50" r="38" fill="white" />
        <circle cx="50" cy="50" r="34" fill="transparent" stroke="#f3f4f6" strokeWidth="1" />
      </svg>
      
      {/* Rotating Needle */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        className="relative z-10 w-[60%] h-[60%] flex items-center justify-center"
      >
        <svg viewBox="0 0 24 24" className="w-full h-full drop-shadow-md">
          {/* North Needle */}
          <path d="M12 2L15 12L12 12.5L9 12L12 2Z" fill="#E5243B" />
          {/* South Needle */}
          <path d="M12 22L9 12L12 11.5L15 12L12 22Z" fill="#2c241d" />
          {/* Center Point */}
          <circle cx="12" cy="12" r="1.5" fill="white" />
          <circle cx="12" cy="12" r="0.8" fill="#5a6344" />
        </svg>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'thesis' | 'grades'>('dashboard');
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [grades, setGrades] = useState<GradeEntry[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Data Fetching
  useEffect(() => {
    if (!user) return;

    const thesesQuery = query(collection(db, 'theses'), where('studentId', '==', user.uid));
    const unsubscribeTheses = onSnapshot(thesesQuery, (snapshot) => {
      setTheses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Thesis)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'theses'));

    const gradesQuery = query(collection(db, 'grades'), where('studentId', '==', user.uid));
    const unsubscribeGrades = onSnapshot(gradesQuery, (snapshot) => {
      setGrades(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GradeEntry)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'grades'));

    return () => {
      unsubscribeTheses();
      unsubscribeGrades();
    };
  }, [user]);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sand-medium">
        <div className="flex flex-col items-center">
          <CompassLogo className="w-20 h-20 mb-6" />
          <p className="text-deep-earth font-serif font-bold animate-pulse text-lg">جاري تحميل بوصلة...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-sand-medium flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-sand-light p-10 rounded-[32px] shadow-2xl text-center border border-white/40"
        >
          <CompassLogo className="mx-auto mb-8 w-24 h-24" />
          <h1 className="text-4xl font-black text-deep-earth mb-4 font-serif">بوصلة</h1>
          <p className="text-text-main opacity-80 mb-10 leading-relaxed text-lg">
            منصة تحليل مذكرات الطلبة
            <br />
            <span className="text-sm font-sans opacity-70 italic">جامعة الشهيد حمه لخضر - الوادي</span>
          </p>
          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white text-text-main font-bold py-4 px-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            استمرار بحساب Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-sand-medium p-4 lg:p-8 text-right" dir="rtl">
      <div className="flex flex-grow w-full max-w-7xl mx-auto rounded-[32px] overflow-hidden shadow-2xl bg-sand-light border border-white/20">
        {/* Sidebar */}
        <AnimatePresence>
          {(isSidebarOpen || window.innerWidth >= 1024) && (
            <motion.aside
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              className={`fixed inset-y-0 right-0 z-50 w-72 bg-olive text-white shadow-xl lg:static lg:block ${isSidebarOpen ? 'block' : 'hidden'}`}
            >
              <div className="h-full flex flex-col p-8">
                <div className="flex items-center gap-3 mb-16 px-2">
                  <CompassLogo className="w-10 h-10" />
                  <span className="text-2xl font-bold font-serif">بوصلة</span>
                  <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden mr-auto text-white/60">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4 flex-grow">
                  <NavItem 
                    icon={<LayoutDashboard />} 
                    label="لوحة التحكم" 
                    active={activeTab === 'dashboard'} 
                    onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} 
                  />
                  <NavItem 
                    icon={<BookOpen />} 
                    label="مذكراتي" 
                    active={activeTab === 'thesis'} 
                    onClick={() => { setActiveTab('thesis'); setIsSidebarOpen(false); }} 
                  />
                  <NavItem 
                    icon={<ClipboardList />} 
                    label="كشف النقاط" 
                    active={activeTab === 'grades'} 
                    onClick={() => { setActiveTab('grades'); setIsSidebarOpen(false); }} 
                  />
                </div>

                <div className="mt-auto pt-8 border-t border-white/10 text-center">
                  <div className="mb-6 opacity-60 text-[10px] leading-relaxed">
                    جامعة الشهيد حمه لخضر - الوادي<br />
                    كلية العلوم الدقيقة
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 mb-6">
                    <img src={user.photoURL || ''} alt="" className="w-10 h-10 rounded-full border-2 border-white/20" />
                    <div className="flex-grow min-w-0 text-right">
                      <p className="text-xs font-bold truncate">{user.displayName}</p>
                      <p className="text-[10px] opacity-60 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 text-white/70 font-bold hover:bg-white/5 rounded-2xl transition-colors text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    خروج
                  </button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-grow flex flex-col min-w-0 h-full overflow-hidden">
          <header className="h-24 px-8 flex items-center justify-between shrink-0">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-olive">
              <Menu className="w-6 h-6" />
            </button>
            <div className="welcome">
              <h1 className="text-2xl font-bold text-deep-earth font-serif">مرحباً، {user.displayName?.split(' ')[0]}</h1>
              <p className="text-xs text-text-main opacity-60">تابع تقدم مذكرتك الدراسية ونقاطك في مكان واحد</p>
            </div>
            <div className="flex items-center gap-4">
               <div className="hidden md:flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm text-xs font-medium text-text-main">
                  <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4" />
                  حساب قوقل متصل
               </div>
               <div className="w-10 h-10 border-2 border-accent-orange/20 rounded-full p-1">
                  <img src={user.photoURL || ''} alt="" className="w-full h-full rounded-full object-cover" />
               </div>
            </div>
          </header>

          <div className="p-8 overflow-y-auto flex-grow">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-5xl"
              >
                {activeTab === 'dashboard' && <DashboardTab theses={theses} grades={grades} />}
                {activeTab === 'thesis' && <ThesisTab theses={theses} userId={user.uid} />}
                {activeTab === 'grades' && <GradesTab grades={grades} userId={user.uid} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// Components
function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 py-3 px-5 rounded-xl text-sm font-semibold transition-all ${
        active 
          ? 'bg-sand-light text-olive shadow-md' 
          : 'text-white/70 hover:bg-white/5'
      }`}
    >
      <span className={active ? 'text-olive' : 'text-white/40'}>{icon}</span>
      {label}
    </button>
  );
}

function DashboardTab({ theses, grades }: { theses: Thesis[], grades: GradeEntry[] }) {
  const avgGrade = grades.length > 0 ? (grades.reduce((acc, curr) => acc + curr.score, 0) / grades.length).toFixed(2) : 0;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <section className="bg-white p-8 rounded-[24px] shadow-sm border border-black/[0.03]">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-olive font-serif">المذكرات الحالية</h2>
            <small className="text-accent-orange font-bold cursor-pointer">إضافة مذكرة +</small>
          </div>
          <div className="space-y-4">
            {theses.length === 0 ? (
              <p className="text-text-main/40 text-center py-12 italic border-2 border-dashed border-gray-50 rounded-2xl">لا توجد مذكرات حالية</p>
            ) : (
              theses.map(thesis => (
                <div key={thesis.id} className="flex items-center gap-5 p-5 bg-sand-light rounded-2xl transition-all hover:bg-white hover:shadow-md border border-transparent hover:border-sand-medium">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    thesis.status === 'completed' ? 'bg-olive text-white' : 'bg-accent-orange text-white'
                  }`}>
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="font-bold text-deep-earth text-sm truncate">{thesis.title}</h3>
                    <p className="text-[10px] text-text-main opacity-50">تم التحديث: {thesis.createdAt?.toDate().toLocaleDateString('ar-DZ')}</p>
                  </div>
                  <span className="status-pill font-sans">{thesis.status === 'completed' ? 'مكتملة' : thesis.status === 'review' ? 'مراجعة' : 'قيد العمل'}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-white p-8 rounded-[24px] shadow-sm border border-black/[0.03]">
          <h2 className="text-xl font-bold text-olive font-serif mb-6">التحليل الذكي</h2>
          <div className="p-5 bg-sand-light rounded-2xl border border-sand-medium/30 text-olive text-sm leading-relaxed">
            <strong>تحليل بوصلة:</strong> مستواك مستقر. ننصح بالتركيز على مادة "منهجية البحث" لرفع المعدل في السداسي القادم.
          </div>
        </section>
      </div>

      <div className="space-y-8">
        <section className="bg-white p-8 rounded-[24px] shadow-sm border border-black/[0.03] text-center">
          <h2 className="text-xl font-bold text-olive font-serif mb-8 text-right">الأداء الأكاديمي</h2>
          <div className="relative w-32 h-32 mx-auto mb-8 flex flex-col items-center justify-center">
            <div className="absolute inset-0 border-[6px] border-sand-medium rounded-full"></div>
            <div className="absolute inset-0 border-[6px] border-accent-orange rounded-full border-t-transparent -rotate-45"></div>
            <span className="text-3xl font-black text-deep-earth">{avgGrade}</span>
            <span className="text-[10px] opacity-40 font-bold uppercase tracking-wider">المعدل العام</span>
          </div>
          
          <div className="space-y-4">
            <DashboardStat label="المذكرات المكتملة" value={theses.filter(t => t.status === 'completed').length} />
            <DashboardStat label="عدد المواد المسجلة" value={grades.length} />
            <DashboardStat label="أعلى علامة" value={grades.length > 0 ? Math.max(...grades.map(g => g.score)) : '--'} />
          </div>
        </section>

        <div className="p-6 bg-olive rounded-[24px] text-white overflow-hidden relative">
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
          <p className="text-[10px] uppercase font-bold tracking-widest opacity-50 mb-2">تنبيه المواعيد</p>
          <p className="text-xs font-medium leading-relaxed">الموعد النهائي لتسليم مسودات الفصل الثاني هو 15 ماي 2024.</p>
        </div>
      </div>
    </div>
  );
}

function DashboardStat({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-dashed border-sand-medium text-xs">
      <span className="text-text-main opacity-60 font-medium">{label}</span>
      <strong className="text-deep-earth font-black">{value}</strong>
    </div>
  );
}

function StatCard({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: string | number, color: string }) {
  return (
    <div className={`p-6 rounded-3xl shadow-sm border border-gray-100 bg-white flex items-center gap-5 transition-transform hover:-translate-y-1`}>
      <div className={`p-4 rounded-2xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-bold">{title}</p>
        <p className="text-3xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function ThesisTab({ theses, userId }: { theses: Thesis[], userId: string }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      await addDoc(collection(db, 'theses'), {
        studentId: userId,
        title: newTitle,
        description: newDesc,
        status: 'pending',
        createdAt: Timestamp.now()
      });
      setNewTitle('');
      setNewDesc('');
      setShowAdd(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'theses');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المذكرة؟')) return;
    try {
      await deleteDoc(doc(db, 'theses', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'theses');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-deep-earth font-serif">إدارة مذكرات التخرج</h1>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-accent-orange text-white p-3 rounded-2xl hover:brightness-110 transition-all shadow-lg shadow-accent-orange/20"
        >
          {showAdd ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAdd} className="bg-white p-8 rounded-[24px] border border-black/[0.03] shadow-sm space-y-6">
              <div>
                <label className="block text-sm font-bold text-olive mb-2">عنوان المذكرة</label>
                <input 
                  type="text" 
                  value={newTitle} 
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-sand-light border border-sand-medium/30 rounded-xl py-3 px-4 focus:ring-2 focus:ring-olive/20 transition-all outline-none text-text-main"
                  placeholder="مثال: تحليل البيانات الضخمة في القطاع الصحي"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-olive mb-2">وصف المذكرة</label>
                <textarea 
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-sand-light border border-sand-medium/30 rounded-xl py-3 px-4 focus:ring-2 focus:ring-olive/20 transition-all outline-none h-32 text-text-main"
                  placeholder="اكتب وصفاً قصيراً للبحث..."
                ></textarea>
              </div>
              <button 
                type="submit"
                className="w-full bg-olive text-white font-bold py-4 rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-olive/10"
              >
                إضافة المذكرة الجديدة
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {theses.map(thesis => (
          <div key={thesis.id} className="bg-white p-8 rounded-[24px] border border-black/[0.03] shadow-sm relative group transition-all hover:shadow-md">
            <button 
              onClick={() => handleDelete(thesis.id)}
              className="absolute top-8 left-8 text-text-main/20 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-6">
               <span className="status-pill font-sans">
                 {thesis.status === 'completed' ? 'مكتملة' : thesis.status === 'review' ? 'مراجعة' : 'قيد العمل'}
               </span>
               <span className="text-[10px] text-text-main/40 font-bold uppercase tracking-wider">
                 {thesis.createdAt?.toDate().toLocaleDateString('ar-DZ')}
               </span>
            </div>
            <h3 className="text-xl font-bold text-deep-earth mb-3 font-serif line-clamp-2 leading-snug">{thesis.title}</h3>
            <p className="text-text-main/70 text-sm mb-8 leading-relaxed line-clamp-3">{thesis.description}</p>
            
            <div className="flex items-center justify-between pt-5 border-t border-sand-light">
              <span className="text-[10px] font-bold text-text-main/40 uppercase tracking-widest">الدرجة النهائية</span>
              <span className="text-2xl font-black text-olive">{thesis.grade || '--'}<span className="text-xs opacity-40 mr-1">/20</span></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GradesTab({ grades, userId }: { grades: GradeEntry[], userId: string }) {
  const [showAdd, setShowAdd] = useState(false);
  const [subject, setSubject] = useState('');
  const [score, setScore] = useState('');
  const [semester, setSemester] = useState('السداسي الأول');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !score) return;
    try {
      await addDoc(collection(db, 'grades'), {
        studentId: userId,
        subject,
        score: parseFloat(score),
        semester
      });
      setSubject('');
      setScore('');
      setShowAdd(false);
    } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, 'grades');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذه العلامة؟')) return;
    try {
      await deleteDoc(doc(db, 'grades', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'grades');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-deep-earth font-serif">سجل كشف النقاط</h1>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="bg-accent-orange text-white p-3 rounded-2xl hover:brightness-110 transition-all shadow-lg shadow-accent-orange/20"
        >
          {showAdd ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white p-8 rounded-[24px] border border-black/[0.03] shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-olive mb-2">اسم المادة</label>
              <input 
                type="text" 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-sand-light border border-sand-medium/30 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-olive/20 text-text-main"
                placeholder="مثال: ذكاء اصطناعي"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-olive mb-2">العلامة</label>
              <input 
                type="number" 
                value={score} 
                onChange={(e) => setScore(e.target.value)}
                className="w-full bg-sand-light border border-sand-medium/30 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-olive/20 text-text-main"
                step="0.25"
                min="0"
                max="20"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-olive mb-2">السداسي</label>
              <select 
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full bg-sand-light border border-sand-medium/30 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-olive/20 text-text-main"
              >
                <option>السداسي الأول</option>
                <option>السداسي الثاني</option>
                <option>السداسي الثالث</option>
                <option>السداسي الرابع</option>
              </select>
            </div>
            <div className="md:col-span-4">
              <button 
                onClick={handleAdd}
                className="w-full bg-olive text-white font-bold py-4 rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-olive/10"
              >
                إضافة العلامة للسجل
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-[24px] border border-black/[0.03] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-sand-light/50 border-b border-sand-medium/20 text-[10px] uppercase tracking-widest text-text-main/40 font-bold">
                <th className="py-5 px-8">اسم المادة الدراسيّة</th>
                <th className="py-5 px-8 text-center">السداسي</th>
                <th className="py-5 px-8 text-center">العلامة المحصل عليها</th>
                <th className="py-5 px-8 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-light">
              {grades.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-text-main/30 italic font-medium">لا توجد علامات مدخلة في السجل الأكاديمي حالياً</td>
                </tr>
              ) : (
                grades.map(grade => (
                  <tr key={grade.id} className="hover:bg-sand-light/20 transition-colors group">
                    <td className="py-5 px-8 font-bold text-deep-earth text-sm">{grade.subject}</td>
                    <td className="py-5 px-8 text-center text-text-main/60 text-xs font-semibold">{grade.semester}</td>
                    <td className="py-5 px-8 text-center font-black text-olive text-lg">{grade.score}<span className="text-[10px] opacity-30 mr-1">/20</span></td>
                    <td className="py-5 px-8">
                      <button 
                        onClick={() => handleDelete(grade.id)}
                        className="p-2 text-text-main/10 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
