/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, Component, ReactNode, ErrorInfo } from 'react';
import axios from 'axios';
import { 
  CreditCard, 
  Send, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Smartphone, 
  Gamepad2, 
  History, 
  Settings, 
  LogOut, 
  Eye, 
  EyeOff, 
  ChevronRight, 
  Search, 
  Bell, 
  Shield, 
  HelpCircle, 
  User as UserIcon, 
  UserCircle,
  Camera, 
  Check, 
  Calendar, 
  Trophy, 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Zap, 
  Globe, 
  Lock, 
  Fingerprint, 
  Clock, 
  Download, 
  Filter, 
  Share2, 
  Home, 
  Menu, 
  X, 
  ChevronDown, 
  MoreVertical, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Wallet, 
  Banknote, 
  QrCode, 
  Activity, 
  Briefcase, 
  Gift, 
  Star, 
  Heart, 
  MapPin, 
  Phone, 
  Mail, 
  Info, 
  ExternalLink, 
  RefreshCcw, 
  Trash2, 
  Edit3, 
  Copy, 
  XCircle, 
  MinusCircle, 
  PlusCircle, 
  ArrowLeft, 
  ArrowUp, 
  ArrowDown, 
  Maximize2, 
  Minimize2, 
  LayoutDashboard, 
  Layers, 
  Grid, 
  List, 
  Table, 
  BarChart3, 
  LineChart, 
  Settings2, 
  UserPlus, 
  UserMinus, 
  UserCheck, 
  UserX, 
  ShieldAlert, 
  ShieldOff, 
  Key, 
  Laptop, 
  Monitor, 
  Tablet, 
  Watch, 
  Headphones, 
  Mic, 
  Video, 
  Image as ImageIcon, 
  Music, 
  FileText, 
  File, 
  Folder, 
  Archive, 
  Cloud, 
  CloudUpload, 
  CloudDownload, 
  Wifi, 
  Bluetooth, 
  Battery, 
  Sun, 
  Moon, 
  CloudRain, 
  Wind, 
  Flame, 
  Droplets, 
  Leaf, 
  Coffee, 
  Utensils, 
  ShoppingCart, 
  Truck, 
  Package, 
  Bitcoin, 
  DollarSign, 
  Euro, 
  PoundSterling, 
  IndianRupee, 
  JapaneseYen, 
  Coins, 
  Calculator, 
  BookOpen,
  Tv,
  Quote,
  PieChart as PieChartIcon,
  Trash2 as Delete,
  Building2,
  Rocket,
  Sparkles,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  runTransaction, 
  serverTimestamp,
  Timestamp,
  or,
  limit,
  FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  arrayUnion,
  increment,
  deleteDoc
} from './firebase';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  originalError?: any;
  operationType: OperationType;
  path: string | null;
  userFriendlyMessage: string;
  suggestedAction?: string;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const withRetry = async (fn: () => Promise<any>, retries = 2, delay = 1000) => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      if (i === retries || (err.response && err.response.status === 429)) throw err;
      await new Promise(res => setTimeout(res, delay * (i + 1)));
    }
  }
};

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  let errorMessage;
  if (error instanceof Error) {
    errorMessage = error.message;
  } else {
    errorMessage = String(error);
  }

  let userFriendlyMessage = "An unexpected error occurred. Please try again.";
  let suggestedAction = "Try refreshing the page or checking your connection.";

  if (errorMessage.includes("insufficient permissions") || errorMessage.includes("permission-denied")) {
    userFriendlyMessage = "Access Denied: You don't have permission to perform this action.";
    suggestedAction = "Ensure you are logged in with the correct account. If you believe this is an error, please contact support.";
  } else if (errorMessage.includes("offline") || errorMessage.includes("unavailable")) {
    userFriendlyMessage = "Connection Lost: You appear to be offline.";
    suggestedAction = "Please check your internet connection. The app will automatically reconnect when you're back online.";
  } else if (errorMessage.includes("quota exceeded") || errorMessage.includes("resource-exhausted")) {
    userFriendlyMessage = "Service Limit Reached: The daily usage quota has been exceeded.";
    suggestedAction = "The application is experiencing high traffic. Please try again in a few minutes or tomorrow.";
  } else if (errorMessage.includes("not found") || errorMessage.includes("not-found")) {
    userFriendlyMessage = `Resource Not Found: The requested ${path || 'item'} could not be located.`;
    suggestedAction = "The item might have been moved or deleted. Please double-check the details and try again.";
  } else if (errorMessage.includes("unauthenticated") || errorMessage.includes("auth/user-token-expired")) {
    userFriendlyMessage = "Session Expired: Your security token is no longer valid.";
    suggestedAction = "Please log out and log back in to refresh your secure session.";
  } else if (errorMessage.includes("already exists") || errorMessage.includes("already-exists")) {
    userFriendlyMessage = "Duplicate Entry: This item already exists in our records.";
    suggestedAction = "Please use a unique identifier or check if the action has already been completed.";
  } else if (errorMessage.includes("invalid-argument")) {
    userFriendlyMessage = "Invalid Data: The information provided is not in the correct format.";
    suggestedAction = "Please review your input fields and ensure all required information is correctly filled.";
  } else if (errorMessage.includes("deadline-exceeded")) {
    userFriendlyMessage = "Request Timeout: The operation took too long to complete.";
    suggestedAction = "Your connection might be slow. Please try again when you have a stronger signal.";
  }

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    userFriendlyMessage,
    suggestedAction,
    originalError: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid || 'unauthenticated',
      email: auth.currentUser?.email || 'N/A',
      emailVerified: auth.currentUser?.emailVerified || false,
      isAnonymous: auth.currentUser?.isAnonymous || false,
      tenantId: auth.currentUser?.tenantId || 'N/A',
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName || 'N/A',
        email: provider.email || 'N/A',
        photoUrl: provider.photoURL || 'N/A'
      })) || []
    },
    operationType,
    path
  };

  console.error('Firestore Error Details:', JSON.stringify(errInfo, null, 2));
  
  // Dispatch custom event for global error handling
  window.dispatchEvent(new CustomEvent('sagevault-error', { detail: errInfo }));
  
  throw new Error(JSON.stringify(errInfo));
}

function GlobalErrorModal({ error, onClose }: { error: FirestoreErrorInfo | null, onClose: () => void }) {
  if (!error) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative z-10 bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border border-red-100 dark:border-red-900/30"
        >
          <div className="bg-red-500 p-8 text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-black tracking-tight">System Alert</h3>
            <p className="text-white/80 font-bold mt-1 uppercase text-[10px] tracking-widest">Error Code: {error.operationType.toUpperCase()}</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <p className="text-lg font-black text-gray-900 dark:text-white leading-tight">
                {error.userFriendlyMessage}
              </p>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {error.suggestedAction}
              </p>
            </div>

            {error.path && (
              <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-xl border border-gray-100 dark:border-zinc-700">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Affected Resource</p>
                <p className="text-xs font-mono font-bold text-gray-600 dark:text-gray-300 truncate">{error.path}</p>
              </div>
            )}

            <button 
              onClick={onClose}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black shadow-lg shadow-red-600/20 active:scale-95 transition-all"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

class ErrorBoundary extends Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    const state = (this as any).state;
    if (state.hasError) {
      let errorMessage = "Something went wrong.";
      let suggestedAction = "Try refreshing the page.";
      
      try {
        let errorMsgString = "";
        if (state.error && state.error.message) {
          errorMsgString = state.error.message;
        }
        
        const parsedError = JSON.parse(errorMsgString);
        if (parsedError.userFriendlyMessage) {
          errorMessage = parsedError.userFriendlyMessage;
          if (parsedError.suggestedAction) {
            suggestedAction = parsedError.suggestedAction;
          }
        } else if (parsedError.error) {
          errorMessage = `Error: ${parsedError.error}`;
        }
      } catch (e) {
        if (state.error && state.error.message) {
          errorMessage = state.error.message;
        } else {
          errorMessage = "Something went wrong.";
        }
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center border border-gray-100 dark:border-zinc-800">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">System Alert</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-2 font-bold text-lg">
              {errorMessage}
            </p>
            <p className="text-gray-400 dark:text-gray-500 mb-8 text-sm font-medium">
              {suggestedAction}
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95"
              >
                Refresh Application
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

import { Logo } from './components/Logo';

// -------- MOCK DATA & TYPES -------- 
interface User {
  uid?: string;
  phone: string;
  email: string;
  name: string;
  password?: string;
  dob?: string;
  tier?: number;
  balance: number;
  accountNumber: string;
  invitationCode: string;
  pin?: string;
  authorizedDevices?: string[];
  referralCode?: string;
  profileImage?: string;
  dailySpent?: number;
  monthlySpent?: number;
  lastSpentReset?: any;
  investments?: {
    id: string;
    planId: string;
    planTitle: string;
    amount: number;
    roi: string;
    date: any;
    status: 'active' | 'matured';
    progress: number;
  }[];
  virtualCard?: {
    cardNumber: string;
    expiry: string;
    cvv: string;
    cardName: string;
    cardType: string;
    isFrozen: boolean;
    cardBalance: number;
  };
  referralsCount?: number;
  dailyLimit?: number;
  monthlyLimit?: number;
  createdAt?: any;
  transactions?: any[];
}

interface Testimonial {
  id: string;
  uid: string;
  name: string;
  text: string;
  createdAt: any;
}

const INITIAL_USER: User = { 
  uid: '',
  phone: '',
  email: '', 
  name: '', 
  dob: '',
  tier: 1,
  balance: 0,
  accountNumber: '',
  invitationCode: '',
  pin: '',
  authorizedDevices: [],
  referralCode: '',
  referralsCount: 0,
  dailyLimit: 1000000,
  monthlyLimit: 10000000,
  dailySpent: 0,
  monthlySpent: 0
};

const TIER_LIMITS: Record<number, { daily: number, monthly: number }> = {
  1: { daily: 1000000, monthly: 10000000 },
  2: { daily: 5000000, monthly: 50000000 },
  3: { daily: 20000000, monthly: 200000000 }
};

function checkTransactionLimit(user: User, amount: number): { allowed: boolean, reason?: string } {
  const now = new Date();
  let lastReset;
  if (user.lastSpentReset) {
    if (user.lastSpentReset.toDate) {
      lastReset = user.lastSpentReset.toDate();
    } else {
      lastReset = new Date(user.lastSpentReset);
    }
  } else {
    lastReset = new Date(0);
  }
  
  let dailySpent = 0;
  if (user.dailySpent) {
    dailySpent = user.dailySpent;
  }
  
  let monthlySpent = 0;
  if (user.monthlySpent) {
    monthlySpent = user.monthlySpent;
  }

  // Reset if new day
  if (now.toDateString() !== lastReset.toDateString()) {
    dailySpent = 0;
  }
  // Reset if new month
  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    monthlySpent = 0;
  }

  const limits = TIER_LIMITS[user.tier || 1];
  
  if (dailySpent + amount > limits.daily) {
    return { allowed: false, reason: `Daily limit of ₦${limits.daily.toLocaleString()} exceeded. You have ₦${(limits.daily - dailySpent).toLocaleString()} left for today.` };
  }
  
  if (monthlySpent + amount > limits.monthly) {
    return { allowed: false, reason: `Monthly limit of ₦${limits.monthly.toLocaleString()} exceeded. You have ₦${(limits.monthly - monthlySpent).toLocaleString()} left for this month.` };
  }

  return { allowed: true };
}

// -------- OTP VERIFICATION COMPONENT -------- 
// -------- PIN SETUP COMPONENT -------- 
function PinSetup({ onComplete, dark, setDark }: { onComplete: (pin: string) => void, dark: boolean, setDark: (d: boolean) => void }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4 || confirmPin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }
    onComplete(pin);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-700 via-indigo-600 to-emerald-500 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900 p-4 font-sans text-slate-900 relative transition-colors duration-500">
      <div className="absolute top-6 right-6">
        <button 
          onClick={() => setDark(!dark)} 
          className="bg-white/20 backdrop-blur-md text-white px-2.5 py-2 sm:px-4 sm:py-2 rounded-xl font-bold text-[10px] sm:text-xs flex items-center gap-1.5 sm:gap-2 hover:bg-white/30 transition-all active:scale-95"
          title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {dark ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          <span className="hidden min-[380px]:inline">{dark ? 'Light' : 'Dark'}</span>
        </button>
      </div>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md text-center transition-colors duration-300"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-3xl mb-6">
          <Zap className="w-10 h-10 text-emerald-600" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Secure Your Account</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 font-medium">Create a 4-digit PIN for transfers and sensitive actions.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New PIN</label>
              <input 
                type="password"
                maxLength={4}
                className="w-full p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl text-center text-2xl font-black tracking-[1em] focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                placeholder="••••"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm PIN</label>
              <input 
                type="password"
                maxLength={4}
                className="w-full p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl text-center text-2xl font-black tracking-[1em] focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                placeholder="••••"
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-xs font-bold bg-red-50 dark:bg-red-900/10 p-3 rounded-xl"
            >
              {error}
            </motion.p>
          )}

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-lg shadow-xl transition-all"
          >
            Set Transaction PIN
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

// -------- SIGN UP COMPONENT -------- 
function SignUp({ onSignUp, onGoogleSignUp, onBackToLogin, dark, setDark }: { onSignUp: (user: User) => void, onGoogleSignUp: () => void, onBackToLogin: () => void, dark: boolean, setDark: (d: boolean) => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
      const newUser: User = {
        name,
        phone,
        email,
        password,
        referralCode,
        invitationCode: `SV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        balance: 100000, // Initial balance as requested
        accountNumber: Math.floor(Math.random() * 9000000000 + 1000000000).toString(),
      };
    
    onSignUp(newUser);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 font-sans relative transition-colors duration-500 flex flex-col lg:flex-row">
      {/* Left Side: Branding/Illustration (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-700 via-teal-600 to-blue-500 dark:from-slate-900 dark:via-emerald-950 dark:to-slate-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-white blur-[120px] rounded-full animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-white blur-[120px] rounded-full animate-pulse delay-700"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <Logo size="lg" className="shadow-2xl" />
            <h1 className="text-3xl font-black text-white tracking-tighter">SageVault</h1>
          </div>
          
          <div className="space-y-6 max-w-md">
            <h2 className="text-6xl font-black text-white leading-[0.9] tracking-tighter">
              Secure Your <br />
              <span className="text-emerald-400">Financial Future</span>
            </h2>
            <p className="text-white/70 text-lg font-medium leading-relaxed">
              Join thousands of users who trust SageVault for their daily banking, savings, and investments.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-8">
          <div className="flex -space-x-4">
            {[5, 6, 7, 8].map(i => (
              <div key={i} className="w-12 h-12 rounded-full border-4 border-white/10 overflow-hidden">
                <img src={`https://i.pravatar.cc/100?img=${i + 30}`} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
          <div className="text-white/60 text-sm font-bold uppercase tracking-widest">
            Trusted by <span className="text-white">50k+</span> active members
          </div>
        </div>
      </div>

    {/* Right Side: Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-gray-50 dark:bg-zinc-950 relative overflow-y-auto">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <button 
            onClick={() => setDark(!dark)} 
            className="bg-slate-900 dark:bg-zinc-900 border border-slate-800 dark:border-zinc-800 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-bold text-[10px] sm:text-xs flex items-center gap-2 hover:shadow-md transition-all active:scale-95"
          >
            {dark ? <Sun className="w-3.5 h-3.5 sm:w-4 h-4 text-yellow-500" /> : <Moon className="w-3.5 h-3.5 sm:w-4 h-4 text-white" />}
            <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-zinc-900 p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-md border border-gray-100 dark:border-zinc-800 my-8"
        >
          <div className="text-center mb-8 sm:mb-10 lg:hidden">
            <div className="inline-flex items-center justify-center mb-3 sm:mb-4">
              <Logo size="lg" className="shadow-xl" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-emerald-600 tracking-tight">Join SageVault</h2>
          </div>

          <div className="mb-8 sm:mb-10">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">Create Account</h3>
            <p className="text-gray-400 text-sm sm:text-base font-medium">Fill in your details to get started</p>
          </div>
          
          <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-1 text-left">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Full Name</label>
            <div className="relative">
              <input 
                type="text"
                className="border border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 p-4 w-full rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white font-bold" 
                placeholder="John Doe" 
                value={name}
                onChange={e => setName(e.target.value)} 
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="tel"
                  className="border border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 p-4 pl-11 w-full rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white font-bold" 
                  placeholder="08012345678" 
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} 
                  required
                />
              </div>
            </div>
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Email (Optional)</label>
              <input 
                type="email"
                className="border border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 p-4 w-full rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white font-bold" 
                placeholder="name@example.com" 
                value={email}
                onChange={e => setEmail(e.target.value)} 
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="border border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 p-4 w-full rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white font-bold" 
                  placeholder="••••••" 
                  value={password}
                  onChange={e => setPassword(e.target.value)} 
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400 uppercase ml-1">Confirm</label>
              <input 
                type={showPassword ? "text" : "password"} 
                className="border border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 p-4 w-full rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white font-bold" 
                placeholder="••••••" 
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)} 
                required
              />
            </div>
          </div>
          <div className="space-y-1 text-left">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Referral Code (Optional)</label>
            <div className="relative">
              <Gift className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                className="border border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 p-4 pl-11 w-full rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white font-bold" 
                placeholder="Enter referral code" 
                value={referralCode}
                onChange={e => setReferralCode(e.target.value)} 
              />
            </div>
          </div>
          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-xs font-black uppercase tracking-tighter bg-red-50 dark:bg-red-900/10 p-3 rounded-xl text-center"
            >
              {error}
            </motion.p>
          )}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white w-full py-5 rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/20 transform transition mt-4"
          >
            Create Account
          </motion.button>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-100 dark:bg-zinc-800"></div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Or continue with</span>
            <div className="flex-1 h-px bg-gray-100 dark:bg-zinc-800"></div>
          </div>

          <button 
            type="button"
            onClick={onGoogleSignUp}
            className="w-full bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 text-gray-900 dark:text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:shadow-md transition-all active:scale-95 mb-4"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            <span>Sign up with Google</span>
          </button>
        </form>
        <div className="text-center mt-6">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
            Already have an account?{' '}
            <motion.button 
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBackToLogin}
              className="text-emerald-600 font-black hover:text-emerald-700 transition-colors focus:outline-none focus:underline"
            >
              Sign In
            </motion.button>
          </p>
        </div>
      </motion.div>
    </div>
  </div>
  );
}

// -------- LOGIN COMPONENT -------- 
function Login({ onLogin, onGoToSignUp, users, dark, setDark }: { onLogin: (loginData: any, remember: boolean) => void, onGoToSignUp: () => void, users: User[], dark: boolean, setDark: (d: boolean) => void }) {
  const [phone, setPhone] = useState(() => {
    const savedPhone = localStorage.getItem('sagevault-remember-phone');
    if (savedPhone) {
      return savedPhone;
    } else {
      return '';
    }
  });
  const [password, setPassword] = useState(() => {
    const savedPass = localStorage.getItem('sagevault-remember-pass');
    if (savedPass) {
      return savedPass;
    } else {
      return '';
    }
  });
  const [remember, setRemember] = useState(() => {
    const savedPhone = localStorage.getItem('sagevault-remember-phone');
    if (savedPhone) {
      return true;
    } else {
      return false;
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({ phone, password }, remember);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 font-sans relative transition-colors duration-500 flex flex-col lg:flex-row">
      {/* Left Side: Branding/Illustration (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-700 via-indigo-600 to-emerald-500 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-white blur-[120px] rounded-full animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-white blur-[120px] rounded-full animate-pulse delay-700"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <Logo size="lg" className="shadow-2xl" />
            <h1 className="text-3xl font-black text-white tracking-tighter">SageVault</h1>
          </div>
          
          <div className="space-y-6 max-w-md">
            <h2 className="text-6xl font-black text-white leading-[0.9] tracking-tighter">
              The Future of <br />
              <span className="text-emerald-400">Digital Banking</span>
            </h2>
            <p className="text-white/70 text-lg font-medium leading-relaxed">
              Experience seamless cross-border transfers, virtual cards, and AI-powered financial insights all in one place.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-8">
          <div className="flex -space-x-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-12 h-12 rounded-full border-4 border-white/10 overflow-hidden">
                <img src={`https://i.pravatar.cc/100?img=${i + 20}`} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
          <div className="text-white/60 text-sm font-bold uppercase tracking-widest">
            Joined by <span className="text-white">10k+</span> users globally
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-gray-50 dark:bg-zinc-950 relative overflow-y-auto">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <button 
            onClick={() => setDark(!dark)} 
            className="bg-slate-900 dark:bg-zinc-900 border border-slate-800 dark:border-zinc-800 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl font-bold text-[10px] sm:text-xs flex items-center gap-2 hover:shadow-md transition-all active:scale-95"
          >
            {dark ? <Sun className="w-3.5 h-3.5 sm:w-4 h-4 text-yellow-500" /> : <Moon className="w-3.5 h-3.5 sm:w-4 h-4 text-white" />}
            <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-zinc-900 p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-md border border-gray-100 dark:border-zinc-800 my-8"
        >
          <div className="text-center mb-8 sm:mb-10 lg:hidden">
            <div className="inline-flex items-center justify-center mb-3 sm:mb-4">
              <Logo size="lg" className="shadow-2xl sm:scale-125" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-purple-600 tracking-tight">SageVault</h2>
          </div>

          <div className="mb-8 sm:mb-10">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">Welcome Back</h3>
            <p className="text-gray-400 text-sm sm:text-base font-medium">Enter your credentials to access your vault</p>
          </div>
          
          <form onSubmit={handleLoginSubmit} className="space-y-5">
          <div className="space-y-1 text-left">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="tel"
                className="border border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 p-4 pl-11 w-full rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white font-bold" 
                placeholder="08012345678" 
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} 
                required
              />
            </div>
          </div>
          <div className="space-y-1 text-left">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type={showPassword ? "text" : "password"} 
                className="border border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 p-4 pl-11 w-full rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all dark:text-white font-bold" 
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)} 
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  className="peer sr-only"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                />
                <div className="w-5 h-5 border-2 border-gray-200 dark:border-zinc-700 rounded-lg peer-checked:bg-purple-600 peer-checked:border-purple-600 transition-all"></div>
                <ShieldCheck className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 left-[3px] transition-opacity" />
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">Remember Me</span>
            </label>
            <button type="button" className="text-xs font-bold text-purple-600 hover:underline uppercase tracking-tighter">Forgot Password?</button>
          </div>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-100 dark:bg-zinc-800"></div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Or continue with</span>
            <div className="flex-1 h-px bg-gray-100 dark:bg-zinc-800"></div>
          </div>

          <button 
            type="button"
            onClick={() => onLogin({} as any, remember)}
            className="w-full bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 text-gray-900 dark:text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:shadow-md transition-all active:scale-95 mb-4"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            <span>Sign in with Google</span>
          </button>

          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-xs font-black uppercase tracking-tighter bg-red-50 dark:bg-red-900/10 p-3 rounded-xl text-center"
            >
              {error}
            </motion.p>
          )}
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white w-full py-5 rounded-2xl font-black text-lg shadow-xl shadow-purple-500/20 transform transition mt-4"
          >
            Sign In
          </motion.button>
        </form>
        <div className="text-center mt-6">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">
            Don't have an account?{' '}
            <motion.button 
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onGoToSignUp}
              className="text-purple-600 font-black hover:text-purple-700 transition-colors focus:outline-none focus:underline"
            >
              Sign Up
            </motion.button>
          </p>
        </div>
      </motion.div>
    </div>
  </div>
  );
}

// -------- DASHBOARD COMPONENT -------- 
function ProfileModal({ open, onClose, user, onUpdateUser, dark }: { 
  open: boolean, 
  onClose: () => void, 
  user: User, 
  onUpdateUser: (u: User) => void,
  dark: boolean 
}) {
  const [formData, setFormData] = useState(() => {
    let email = '';
    if (user.email) {
      email = user.email;
    }
    let phone = '';
    if (user.phone) {
      phone = user.phone;
    }
    let dob = '';
    if (user.dob) {
      dob = user.dob;
    }
    return {
      name: user.name,
      email: email,
      phone: phone,
      dob: dob,
      profileImage: user.profileImage || ''
    };
  });

  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onUpdateUser({ ...user, ...formData });
    onClose();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profileImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendVerification = async () => {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      setIsVerifyingEmail(true);
      try {
        await sendEmailVerification(auth.currentUser);
        setVerificationSent(true);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'auth/verification');
      } finally {
        setIsVerifyingEmail(false);
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 rounded-t-[3rem] z-[120] shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black tracking-tight">Profile Settings</h3>
              <button onClick={onClose} className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col items-center mb-8">
              <div className="relative group">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-purple-500 to-blue-600 p-1 shadow-xl shadow-purple-500/20 group-hover:scale-105 transition-transform cursor-pointer"
                >
                  <div className="w-full h-full rounded-[1.8rem] bg-white dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
                    {formData.profileImage ? (
                      <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-10 h-10 text-gray-300" />
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 p-2 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-gray-100 dark:border-zinc-700 text-purple-600 active:scale-90 transition-all"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Tap to change photo</p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-2">Full Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-5 bg-gray-50 dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 font-bold outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-2">Email Address</label>
                  <div className="relative">
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-5 bg-gray-50 dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 font-bold outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      placeholder="Enter your email"
                    />
                    {auth.currentUser && !auth.currentUser.emailVerified && (
                      <div className="mt-2 flex items-center justify-between px-2">
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Email not verified
                        </p>
                        <button 
                          onClick={handleSendVerification}
                          disabled={isVerifyingEmail || verificationSent}
                          className="text-[10px] font-black text-purple-600 uppercase tracking-widest hover:underline disabled:opacity-50"
                        >
                          {verificationSent ? 'Verification Sent' : isVerifyingEmail ? 'Sending...' : 'Verify Now'}
                        </button>
                      </div>
                    )}
                    {auth.currentUser && auth.currentUser.emailVerified && (
                      <p className="mt-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1 px-2">
                        <CheckCircle2 className="w-3 h-3" /> Email Verified
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-2">Phone Number</label>
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-5 bg-gray-50 dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 font-bold outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-2">Date of Birth</label>
                  <input 
                    type="date" 
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full p-5 bg-gray-50 dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 font-bold outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                  />
                </div>
              </div>

              <div className="p-6 bg-gray-50 dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-black tracking-tight">Security PIN</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Used for all transactions</p>
                  </div>
                  <button className="text-purple-600 text-[10px] font-black uppercase tracking-widest hover:underline">Change</button>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-3 h-3 rounded-full bg-gray-200 dark:bg-zinc-800" />
                  ))}
                </div>
              </div>

              <button 
                onClick={handleSave}
                className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-purple-500/20 active:scale-95 transition-all mt-4"
              >
                Save Profile
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function HelpModal({ open, onClose, dark }: { open: boolean, onClose: () => void, dark: boolean }) {
  const helpTopics = [
    { title: 'Getting Started', icon: <BookOpen className="w-5 h-5" />, description: 'Learn the basics of SageVault' },
    { title: 'Security & Privacy', icon: <ShieldCheck className="w-5 h-5" />, description: 'How we keep your funds safe' },
    { title: 'Transfers & Payments', icon: <CreditCard className="w-5 h-5" />, description: 'Troubleshoot transaction issues' },
    { title: 'Account Limits', icon: <TrendingUp className="w-5 h-5" />, description: 'Understand tiers and upgrades' },
    { title: 'Contact Support', icon: <MessageSquare className="w-5 h-5" />, description: 'Chat with our support team' },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 rounded-t-[3rem] z-[120] shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black tracking-tight">Help & Support</h3>
              <button onClick={onClose} className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="relative mb-8">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search for help topics..."
                className="w-full p-5 pl-14 bg-gray-50 dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 font-bold outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {helpTopics.map((topic, i) => (
                <button 
                  key={i}
                  className="w-full p-6 bg-gray-50 dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-zinc-800 flex items-center gap-4 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all text-left group"
                >
                  <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl shadow-sm text-purple-500 group-hover:scale-110 transition-transform">
                    {topic.icon}
                  </div>
                  <div>
                    <p className="font-black text-sm tracking-tight">{topic.title}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{topic.description}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-8 p-8 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[2.5rem] text-center text-white shadow-xl shadow-purple-500/20">
              <div className="flex -space-x-3 justify-center mb-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-purple-600 bg-white overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="Support Agent" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
              <p className="text-sm font-black tracking-tight mb-1">Still need help?</p>
              <p className="text-[10px] text-white/60 uppercase tracking-widest font-black mb-6">Our team is available 24/7</p>
              <button className="w-full py-4 bg-white text-purple-600 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                Start Live Chat
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function UpgradeModal({ open, onClose, user, onUpdateUser, dark }: { 
  open: boolean, 
  onClose: () => void, 
  user: User, 
  onUpdateUser: (u: User) => void,
  dark: boolean 
}) {
  const [step, setStep] = useState(1);
  const [docType, setDocType] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  let currentTier = 1;
  if (user.tier) {
    currentTier = user.tier;
  }

  const handleUpgrade = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onUpdateUser({ ...user, tier: currentTier + 1 });
      setIsProcessing(false);
      onClose();
    }, 3000);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 rounded-t-[3rem] z-[120] shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Upgrade Account</h3>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Tier {currentTier} → Tier {currentTier + 1}</p>
              </div>
              <button onClick={onClose} className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>

            {currentTier >= 3 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trophy className="w-10 h-10 text-emerald-500" />
                </div>
                <h4 className="text-xl font-black mb-2">Maximum Tier Reached</h4>
                <p className="text-sm text-gray-400 font-medium">You are already on Tier 3 with the highest limits.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Tier Progress */}
                <div className="flex items-center justify-between px-4 relative">
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-100 dark:bg-zinc-800 z-0 mx-8" />
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-purple-500 z-0 mx-8 transition-all duration-1000" style={{ width: `${((currentTier - 1) / 2) * 100}%` }} />
                  {[1, 2, 3].map((t) => (
                    <div key={t} className="relative z-10 flex flex-col items-center gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                        t <= currentTier 
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
                          : t === currentTier + 1 
                            ? 'bg-white dark:bg-zinc-800 border-2 border-purple-500 text-purple-600' 
                            : 'bg-white dark:bg-zinc-800 border-2 border-gray-100 dark:border-zinc-700 text-gray-300'
                      }`}>
                        {t < currentTier ? <Check className="w-5 h-5" /> : t}
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-widest ${t <= currentTier ? 'text-purple-600' : 'text-gray-400'}`}>Tier {t}</span>
                    </div>
                  ))}
                </div>

                <div className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-zinc-900 dark:to-zinc-800 rounded-[2.5rem] text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <h4 className="font-black text-lg mb-2">New Benefits</h4>
                    <ul className="space-y-3">
                      {[
                        currentTier === 1 ? 'Daily limit: ₦5,000,000' : 'Unlimited daily transfers',
                        'Higher interest on savings',
                        'Priority customer support',
                        'Exclusive virtual card designs'
                      ].map((benefit, i) => (
                        <li key={i} className="flex items-center gap-3 text-xs font-bold text-slate-300">
                          <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <Check className="w-3 h-3 text-emerald-500" />
                          </div>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 ml-2">Select Identity Document</label>
                    <div className="grid grid-cols-2 gap-4">
                      {(currentTier === 1 ? ['NIN', 'Voters Card'] : ['Drivers License', 'Passport']).map((type) => (
                        <button
                          key={type}
                          onClick={() => setDocType(type)}
                          className={`p-5 rounded-2xl border-2 transition-all font-black text-xs uppercase tracking-widest ${
                            docType === type 
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600' 
                              : 'border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 text-gray-400'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {docType && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-2">
                        {docType} Number
                      </label>
                      <input 
                        type="text" 
                        value={docNumber}
                        onChange={(e) => setDocNumber(e.target.value)}
                        className="w-full p-5 bg-gray-50 dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 font-bold outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                        placeholder={`Enter your ${docType} number`}
                      />
                    </motion.div>
                  )}

                  <button 
                    disabled={!docType || !docNumber || isProcessing}
                    onClick={handleUpgrade}
                    className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Submit for Verification'
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// -------- HELPERS --------
const formatTxDate = (timestamp: any) => {
  if (!timestamp) {
    return 'N/A';
  }
  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else {
    date = new Date(timestamp.seconds * 1000);
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getTxIcon = (type: string) => {
  switch (type) {
    case 'transfer': return <ArrowUpRight className="w-6 h-6" />;
    case 'credit': return <ArrowDownLeft className="w-6 h-6" />;
    case 'airtime': return <Smartphone className="w-6 h-6" />;
    case 'data': return <Globe className="w-6 h-6" />;
    case 'tv': return <Tv className="w-6 h-6" />;
    case 'bill': return <Zap className="w-6 h-6" />;
    case 'card': return <CreditCard className="w-6 h-6" />;
    default: return <History className="w-6 h-6" />;
  }
};

function TransactionDetailsModal({ open, onClose, transaction, symbol, convert, dark }: { 
  open: boolean, 
  onClose: () => void, 
  transaction: any, 
  symbol: string, 
  convert: (amt: number) => string,
  dark: boolean 
}) {
  if (!transaction) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative z-10 bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            <div className={`p-8 text-center text-white ${transaction.isCredit ? 'bg-emerald-500' : 'bg-slate-800 dark:bg-zinc-800'}`}>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                {getTxIcon(transaction.isCredit ? 'credit' : transaction.type)}
              </div>
              <h3 className="text-2xl font-black tracking-tight">
                {transaction.isCredit ? 'Credit Received' : 'Transaction Details'}
              </h3>
              <p className="text-white/80 font-bold mt-1 uppercase text-[10px] tracking-widest">Transaction Receipt</p>
            </div>

            <div className="p-8 space-y-6">
              <div className="text-center">
                <h2 className={`text-4xl font-black tracking-tighter ${transaction.isCredit ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                  {transaction.isCredit ? '+' : '-'}{symbol}{convert(Math.abs(transaction.amount))}
                </h2>
                <p className="text-gray-400 text-xs font-bold mt-1">{formatTxDate(transaction.createdAt)}</p>
              </div>

              <div className="space-y-4 border-t border-dashed border-gray-200 dark:border-zinc-800 pt-6">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-xs font-bold uppercase">Type</span>
                  <span className="font-bold text-sm uppercase">{transaction.type}</span>
                </div>
                
                {transaction.type === 'transfer' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-xs font-bold uppercase">{transaction.isCredit ? 'Sender' : 'Recipient'}</span>
                      <span className="font-bold text-sm">{transaction.accountName || transaction.senderAccount || transaction.receiverAccount}</span>
                    </div>
                    {transaction.bankName && (
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-xs font-bold uppercase">Bank</span>
                        <span className="font-bold text-sm">{transaction.bankName}</span>
                      </div>
                    )}
                  </>
                )}

                {transaction.phoneNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs font-bold uppercase">Phone</span>
                    <span className="font-bold text-sm">{transaction.phoneNumber}</span>
                  </div>
                )}

                {transaction.network && (
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs font-bold uppercase">Network</span>
                    <span className="font-bold text-sm">{transaction.network}</span>
                  </div>
                )}

                {transaction.note && (
                  <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl border border-gray-100 dark:border-zinc-700/50">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Note</p>
                    <p className="text-xs font-medium italic">"{transaction.note}"</p>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-400 text-xs font-bold uppercase">Ref Number</span>
                  <span className="font-bold text-sm font-mono">{transaction.ref || transaction.id?.slice(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-xs font-bold uppercase">Status</span>
                  <span className={`font-black text-sm uppercase ${
                    (transaction.status || 'success') === 'success' ? 'text-emerald-500' : 
                    (transaction.status === 'pending' ? 'text-amber-500' : 'text-rose-500')
                  }`}>
                    {transaction.status || 'Completed'}
                  </span>
                </div>
              </div>

              <button 
                onClick={onClose}
                className="w-full py-4 bg-zinc-900 dark:bg-white dark:text-black text-white rounded-2xl font-black shadow-lg active:scale-95 transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function TransactionItem({ transaction, symbol, convert, onClick, onToggleFavorite }: { transaction: any, symbol: string, convert: (amt: number) => string, onClick: () => void, onToggleFavorite?: (e: React.MouseEvent) => void }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.01, x: 5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-gray-50 dark:border-zinc-800 flex justify-between items-center cursor-pointer hover:shadow-md transition-all group relative overflow-hidden"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${transaction.isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-600'}`}>
          {getTxIcon(transaction.isCredit ? 'credit' : transaction.type)}
        </div>
        <div>
          <p className="font-bold text-base">{transaction.isCredit ? `Credit from ${transaction.senderAccount}` : transaction.name}</p>
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-400 font-medium">{formatTxDate(transaction.createdAt)}</p>
            <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest bg-gray-50 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
              Ref: {transaction.ref || transaction.id?.slice(0, 8).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className={`font-black text-base ${transaction.isCredit ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
            {transaction.isCredit ? '+' : '-'}{symbol}{convert(transaction.amount)}
          </p>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${
            (transaction.status || 'success') === 'success' ? 'text-gray-400' : 
            (transaction.status === 'pending' ? 'text-amber-500' : 'text-rose-500')
          }`}>
            {transaction.status || 'Completed'}
          </p>
        </div>
        {onToggleFavorite && (
          <motion.button
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.8 }}
            onClick={onToggleFavorite}
            className={`p-2 rounded-xl transition-colors ${transaction.isFavorite ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-gray-300 hover:text-amber-500'}`}
          >
            <Star className={`w-4 h-4 ${transaction.isFavorite ? 'fill-current' : ''}`} />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

function TransactionSummary({ totalInflow, totalOutflow, symbol }: { totalInflow: number, totalOutflow: number, symbol: string }) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-8">
      <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-[2rem] border border-emerald-100 dark:border-emerald-900/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-emerald-500 text-white rounded-xl">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Total Inflow</span>
        </div>
        <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{symbol}{totalInflow.toLocaleString()}</p>
      </div>
      <div className="bg-rose-50 dark:bg-rose-900/10 p-6 rounded-[2rem] border border-rose-100 dark:border-rose-900/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-rose-500 text-white rounded-xl">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">Total Outflow</span>
        </div>
        <p className="text-2xl font-black text-rose-700 dark:text-rose-400">{symbol}{totalOutflow.toLocaleString()}</p>
      </div>
    </div>
  );
}

function TransactionChart({ chartData, symbol, dark }: { chartData: any[], symbol: string, dark: boolean }) {
  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 mb-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="font-black text-sm uppercase tracking-widest text-gray-400">Spending Flow</h4>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Last 7 Days</p>
        </div>
        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl">
          <TrendingUp className="w-4 h-4 text-indigo-500" />
        </div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={dark ? '#27272a' : '#f4f4f5'} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
            />
            <YAxis hide />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: dark ? '#18181b' : '#ffffff', 
                borderRadius: '1rem', 
                border: 'none',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
              itemStyle={{ fontWeight: 'bold' }}
            />
            <Area 
              type="monotone" 
              dataKey="amount" 
              stroke="#6366f1" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorAmt)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 pt-8 border-t border-gray-50 dark:border-zinc-800 grid grid-cols-2 gap-4">
        <div>
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Avg. Daily</p>
          <p className="text-sm font-black tracking-tight">{symbol}1,240</p>
        </div>
        <div className="text-right">
          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Efficiency</p>
          <p className="text-sm font-black text-emerald-500 tracking-tight">94%</p>
        </div>
      </div>
    </div>
  );
}

function TransactionCategories({ categoryData, dark }: { categoryData: any[], dark: boolean }) {
  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 mb-8">
      <h4 className="font-black text-sm uppercase tracking-widest text-gray-400 mb-6">Top Spending Categories</h4>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={categoryData} layout="vertical">
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              width={100}
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
            />
            <Tooltip 
              cursor={{ fill: 'transparent' }}
              contentStyle={{ 
                backgroundColor: dark ? '#18181b' : '#ffffff', 
                borderRadius: '1rem', 
                border: 'none'
              }}
            />
            <Bar dataKey="total" radius={[0, 10, 10, 0]} barSize={20}>
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'][index % 5]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SearchUsersModal({ open, onClose, onSelect, dark }: { 
  open: boolean, 
  onClose: () => void, 
  onSelect: (user: any) => void,
  dark: boolean 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const publicProfilesRef = collection(db, 'public_profiles');
        // Search by name or phone
        const qName = query(publicProfilesRef, where('name', '>=', searchQuery), where('name', '<=', searchQuery + '\uf8ff'), limit(5));
        const qPhone = query(publicProfilesRef, where('phone', '==', searchQuery), limit(5));
        
        const [snapName, snapPhone] = await Promise.all([
          withRetry(() => getDocs(qName)),
          withRetry(() => getDocs(qPhone))
        ]);
        
        const combined = [...snapName.docs, ...snapPhone.docs].map(doc => ({
          uid: doc.id,
          ...doc.data()
        }));

        // Filter out current user and duplicates
        const unique = combined.filter((v, i, a) => a.findIndex(t => t.uid === v.uid) === i && v.uid !== auth.currentUser?.uid);
        setResults(unique);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 rounded-t-[3rem] z-[160] shadow-2xl p-8 max-h-[80vh] flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Search Receivers</h3>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Find SageVault users</p>
              </div>
              <button onClick={onClose} className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text"
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name or phone number..."
                className="w-full p-5 pl-14 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
              />
              {isSearching && (
                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
              {results.length === 0 ? (
                <div className="text-center py-12">
                  <UserIcon className="w-12 h-12 text-gray-200 dark:text-zinc-800 mx-auto mb-4" />
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
                    {searchQuery.length < 3 ? 'Type at least 3 characters' : 'No users found'}
                  </p>
                </div>
              ) : (
                results.map((r) => (
                  <motion.button
                    key={r.uid}
                    whileHover={{ x: 5 }}
                    onClick={() => onSelect(r)}
                    className="w-full p-5 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl flex items-center gap-4 text-left group transition-all hover:bg-blue-50 dark:hover:bg-blue-900/10"
                  >
                    <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-blue-600 font-black text-lg shadow-sm group-hover:scale-110 transition-transform">
                      {r.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-base tracking-tight">{r.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{r.accountNumber}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function RecurringPaymentsModal({ open, onClose, payments, onAdd, onDelete, symbol, convert, dark }: { 
  open: boolean, 
  onClose: () => void, 
  payments: any[], 
  onAdd: (payment: any) => void, 
  onDelete: (id: string) => void,
  symbol: string,
  convert: (amt: number) => string,
  dark: boolean 
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newCategory, setNewCategory] = useState('tv');

  const handleAdd = () => {
    if (!newName || !newAmount || !newDate) return;
    
    onAdd({
      name: newName,
      amount: parseFloat(newAmount),
      date: newDate,
      category: newCategory
    });

    setNewName('');
    setNewAmount('');
    setNewDate('');
    setIsAdding(false);
  };

  const icons: { [key: string]: React.ReactNode } = {
    tv: <Tv className="w-5 h-5" />,
    music: <Music className="w-5 h-5" />,
    internet: <Globe className="w-5 h-5" />,
    other: <Zap className="w-5 h-5" />
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 rounded-t-[3rem] z-[120] shadow-2xl p-8 max-h-[90vh] overflow-y-auto scrollbar-hide"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Recurring Payments</h3>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Manage your subscriptions</p>
              </div>
              <button onClick={onClose} className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>

            {isAdding ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Service Name</label>
                    <input 
                      type="text" 
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="e.g. Netflix, Rent, Electricity"
                      className="w-full p-5 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Amount</label>
                      <input 
                        type="number" 
                        value={newAmount}
                        onChange={e => setNewAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full p-5 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Next Date</label>
                      <input 
                        type="text" 
                        value={newDate}
                        onChange={e => setNewDate(e.target.value)}
                        placeholder="e.g. 24 Oct 2024"
                        className="w-full p-5 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { id: 'tv', icon: <Tv className="w-4 h-4" /> },
                        { id: 'music', icon: <Music className="w-4 h-4" /> },
                        { id: 'internet', icon: <Globe className="w-4 h-4" /> },
                        { id: 'other', icon: <Zap className="w-4 h-4" /> },
                      ].map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setNewCategory(cat.id)}
                          className={`p-4 rounded-xl flex items-center justify-center transition-all ${newCategory === cat.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-gray-50 dark:bg-zinc-900 text-gray-400 border border-gray-100 dark:border-zinc-800'}`}
                        >
                          {cat.icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded-2xl font-black uppercase tracking-widest text-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAdd}
                    className="flex-1 py-5 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-purple-500/20"
                  >
                    Add Payment
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  {payments.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 dark:bg-zinc-900 rounded-[2rem] border border-dashed border-gray-200 dark:border-zinc-800">
                      <Calendar className="w-12 h-12 text-gray-200 dark:text-zinc-800 mx-auto mb-4" />
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No recurring payments set up</p>
                    </div>
                  ) : (
                    payments.map((p) => (
                      <div key={p.id} className="bg-gray-50 dark:bg-zinc-900 p-6 rounded-[2rem] border border-gray-100 dark:border-zinc-800 flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-purple-600 shadow-sm transition-transform group-hover:scale-110">
                            {icons[p.category] || <Zap className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-black text-base tracking-tight">{p.name}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Next: {p.date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-black text-base">{symbol}{convert(p.amount)}</p>
                            <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Active</p>
                          </div>
                          <button 
                            onClick={() => onDelete(p.id)}
                            className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <button 
                  onClick={() => setIsAdding(true)}
                  className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" /> Add New Recurring Payment
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function TransactionHistoryModal({ open, onClose, transactions, user, currency, convert, symbol, dark, setSelectedTransaction, setTransactionDetailsModalOpen }: { 
  open: boolean, 
  onClose: () => void, 
  transactions: any[], 
  user: User, 
  currency: string, 
  convert: (amt: number) => string, 
  symbol: string,
  dark: boolean,
  setSelectedTransaction: (tx: any) => void,
  setTransactionDetailsModalOpen: (open: boolean) => void
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const processedTransactions = (transactions || []).map(tx => {
    const isCredit = tx.isCredit;
    const displayAmount = isCredit ? tx.amount : -tx.amount;

    return {
      ...tx,
      displayAmount
    };
  });

  const filteredTransactions = processedTransactions.filter(tx => {
    const matchesSearch = (tx.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (tx.senderAccount || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (tx.receiverAccount || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (tx.type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (tx.amount.toString()).includes(searchQuery) ||
                         (tx.ref || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || 
                       (filterType === 'credit' && tx.isCredit) || 
                       (filterType === 'debit' && !tx.isCredit) ||
                       (filterType === 'transfer' && tx.type === 'transfer');
    
    const matchesCategory = filterCategory === 'all' || tx.type === filterCategory;
    
    const matchesStatus = filterStatus === 'all' || (tx.status || 'success') === filterStatus;
    
    const txDate = tx.createdAt ? (tx.createdAt.toDate ? tx.createdAt.toDate() : new Date(tx.createdAt.seconds * 1000)) : null;
    const matchesStartDate = !startDate || (txDate && txDate >= new Date(startDate));
    const matchesEndDate = !endDate || (txDate && txDate <= new Date(endDate + 'T23:59:59'));
    
    const matchesMinAmount = !minAmount || tx.amount >= parseFloat(minAmount);
    const matchesMaxAmount = !maxAmount || tx.amount <= parseFloat(maxAmount);
    
    return matchesSearch && matchesType && matchesCategory && matchesStatus && matchesStartDate && matchesEndDate && matchesMinAmount && matchesMaxAmount;
  }).sort((a, b) => {
    const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt.seconds * 1000)) : new Date(0);
    const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt.seconds * 1000)) : new Date(0);
    
    if (sortBy === 'newest') return dateB.getTime() - dateA.getTime();
    if (sortBy === 'oldest') return dateA.getTime() - dateB.getTime();
    if (sortBy === 'highest') return b.amount - a.amount;
    if (sortBy === 'lowest') return a.amount - b.amount;
    if (sortBy === 'status') return (a.status || 'success').localeCompare(b.status || 'success');
    return 0;
  });

  const chartData = filteredTransactions.slice().reverse().map((t, i) => {
    let name = 'N/A';
    if (t.date) {
      name = t.date;
    } else if (t.createdAt) {
      name = new Date(t.createdAt.seconds * 1000).toLocaleDateString();
    }
    
    let type = 'Outflow';
    if (t.isCredit) {
      type = 'Inflow';
    }

    return {
      name: name,
      amount: Math.abs(t.displayAmount),
      type: type
    };
  });

  const totalInflow = filteredTransactions.reduce((acc, t) => {
    if (t.isCredit) {
      return acc + t.amount;
    } else {
      return acc;
    }
  }, 0);
  const totalOutflow = filteredTransactions.reduce((acc, t) => {
    if (!t.isCredit) {
      return acc + t.amount;
    } else {
      return acc;
    }
  }, 0);

  const categoryData = filteredTransactions.reduce((acc: any[], t) => {
    let name;
    if (t.isCredit) {
      name = `Credit from ${t.senderAccount}`;
    } else {
      name = t.name;
    }
    const existing = acc.find(item => item.name === name);
    if (existing) {
      existing.count += 1;
      existing.total += t.amount;
    } else {
      acc.push({ name, count: 1, total: t.amount });
    }
    return acc;
  }, []).sort((a, b) => b.total - a.total).slice(0, 5);

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('SageVault Account Statement', 14, 22);
    
    // Add user info
    doc.setFontSize(11);
    doc.text(`Name: ${user.name}`, 14, 30);
    doc.text(`Account Number: ${user.accountNumber}`, 14, 35);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 40);
    
    // Add transaction table
    const tableData = filteredTransactions.map(tx => [
      tx.createdAt ? (tx.createdAt.toDate ? tx.createdAt.toDate().toLocaleDateString() : new Date(tx.createdAt.seconds * 1000).toLocaleDateString()) : 'N/A',
      tx.name || (tx.isCredit ? `Credit from ${tx.senderAccount}` : `Transfer to ${tx.receiverAccount}`),
      tx.type || (tx.isCredit ? 'Credit' : 'Debit'),
      `${tx.isCredit ? '+' : '-'}${symbol}${convert(tx.amount)}`,
      'Completed'
    ]);
    
    autoTable(doc, {
      head: [['Date', 'Description', 'Type', 'Amount', 'Status']],
      body: tableData,
      startY: 50,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] }, // Indigo color
    });
    
    doc.save(`SageVault_Statement_${user.accountNumber}.pdf`);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 rounded-t-[3rem] z-[120] shadow-2xl p-8 max-h-[95vh] overflow-y-auto scrollbar-hide"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Account Statement</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Detailed Transaction Analysis</p>
              </div>
              <button onClick={onClose} className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search and Filter Controls */}
            <div className="mb-8 space-y-4">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search by name, account, or type..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all"
                  />
                </div>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-4 rounded-2xl border transition-all ${showFilters ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-gray-50 dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 text-gray-400'}`}
                >
                  <Filter className="w-6 h-6" />
                </button>
              </div>

              <AnimatePresence>
                {showFilters && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 bg-gray-50 dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Transaction Type</label>
                        <select 
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                          className="w-full p-4 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl outline-none font-bold"
                        >
                          <option value="all">All Types</option>
                          <option value="credit">Credits (Inflow)</option>
                          <option value="debit">Debits (Outflow)</option>
                          <option value="transfer">Transfers</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                        <select 
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                          className="w-full p-4 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl outline-none font-bold"
                        >
                          <option value="all">All Categories</option>
                          <option value="transfer">Transfer</option>
                          <option value="airtime">Airtime</option>
                          <option value="data">Data</option>
                          <option value="tv">TV Subscription</option>
                          <option value="bill">Utility Bills</option>
                          <option value="card">Card Operations</option>
                          <option value="investment">Investment</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status</label>
                        <select 
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="w-full p-4 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl outline-none font-bold"
                        >
                          <option value="all">All Statuses</option>
                          <option value="success">Success</option>
                          <option value="pending">Pending</option>
                          <option value="failed">Failed</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date Range</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="date" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="flex-1 p-4 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl outline-none font-bold text-xs"
                          />
                          <span className="text-gray-400">to</span>
                          <input 
                            type="date" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="flex-1 p-4 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl outline-none font-bold text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Amount Range</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            placeholder="Min"
                            value={minAmount}
                            onChange={(e) => setMinAmount(e.target.value)}
                            className="flex-1 p-4 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl outline-none font-bold text-xs"
                          />
                          <span className="text-gray-400">-</span>
                          <input 
                            type="number" 
                            placeholder="Max"
                            value={maxAmount}
                            onChange={(e) => setMaxAmount(e.target.value)}
                            className="flex-1 p-4 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl outline-none font-bold text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sort By</label>
                        <select 
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="w-full p-4 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl outline-none font-bold"
                        >
                          <option value="newest">Newest First</option>
                          <option value="oldest">Oldest First</option>
                          <option value="highest">Highest Amount</option>
                          <option value="lowest">Lowest Amount</option>
                          <option value="status">Status</option>
                        </select>
                      </div>

                      <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-3 pt-2">
                        <button 
                          onClick={() => {
                            setSearchQuery('');
                            setFilterType('all');
                            setFilterCategory('all');
                            setFilterStatus('all');
                            setStartDate('');
                            setEndDate('');
                            setMinAmount('');
                            setMaxAmount('');
                            setSortBy('newest');
                          }}
                          className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors"
                        >
                          Reset Filters
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <TransactionSummary totalInflow={totalInflow} totalOutflow={totalOutflow} symbol={symbol} />

            <TransactionChart chartData={chartData} symbol={symbol} dark={dark} />

            <TransactionCategories categoryData={categoryData} dark={dark} />

            <div className="space-y-4">
              <div className="flex justify-between items-center ml-2">
                <h4 className="font-black text-sm uppercase tracking-widest text-gray-400">
                  {filteredTransactions.length === processedTransactions.length ? 'Full History' : `Filtered Results (${filteredTransactions.length})`}
                </h4>
              </div>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((t, i) => (
                  <TransactionItem 
                    key={i} 
                    transaction={t} 
                    symbol={symbol} 
                    convert={convert} 
                    onClick={() => {
                      setSelectedTransaction(t);
                      setTransactionDetailsModalOpen(true);
                    }} 
                  />
                ))
              ) : (
                <div className="py-12 text-center bg-gray-50 dark:bg-zinc-900 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-zinc-800">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="font-black text-gray-400 uppercase tracking-widest text-[10px]">No transactions match your filters</p>
                </div>
              )}
            </div>

            <div className="mt-12 text-center">
              <button 
                onClick={generatePDF}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl flex items-center gap-3 mx-auto active:scale-95 transition-all"
              >
                <FileText className="w-4 h-4" />
                Download PDF Statement
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Dashboard({ user, transactions, onLogout, onUpdateUser, dark, setDark, adIndex }: { user: User, transactions: any[], onLogout: () => void, onUpdateUser: (user: User) => void, dark: boolean, setDark: (d: boolean) => void, adIndex: number }) {
  const ads = [
    "chop with us with TripChow",
    "spend quality internet time with Sagehub",
    "invest with US with savego"
  ];
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [isPinResetModalOpen, setIsPinResetModalOpen] = useState(false);
  const [pinResetStep, setPinResetStep] = useState<'request' | 'verify' | 'reset'>('request');
  const [pinResetEmail, setPinResetEmail] = useState('');
  const [pinResetOTP, setPinResetOTP] = useState('');
  const [pinResetNewPin, setPinResetNewPin] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [isRetryable, setIsRetryable] = useState(false);

  const [cardTopUpStep, setCardTopUpStep] = useState<'amount' | 'pin'>('amount');
  const [cardTopUpAmount, setCardTopUpAmount] = useState('');
  const [cardTopUpPin, setCardTopUpPin] = useState('');
  const [cardTopUpError, setCardTopUpError] = useState('');
  const [isCardTopUpProcessing, setIsCardTopUpProcessing] = useState(false);

  const [showAllTestimonials, setShowAllTestimonials] = useState(false);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [newTestimony, setNewTestimony] = useState('');
  const [isSubmittingTestimony, setIsSubmittingTestimony] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'testimonials'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Testimonial));
      setTestimonials(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'testimonials');
    });
    return () => unsubscribe();
  }, []);

  const handlePostTestimony = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestimony.trim()) return;
    
    setIsSubmittingTestimony(true);
    try {
      await withRetry(async () => {
        const testimonyRef = doc(collection(db, 'testimonials'));
        let userName = 'User';
        if (user.name) {
          userName = user.name;
        }
        const firstName = userName.split(' ')[0];
        const name = firstName + '.';
        
        await setDoc(testimonyRef, {
          id: testimonyRef.id,
          uid: user.uid,
          name: name,
          text: newTestimony,
          createdAt: serverTimestamp()
        });
      });
      setNewTestimony('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'testimonials');
    } finally {
      setIsSubmittingTestimony(false);
    }
  };

  const handleToggleFavorite = async (txId: string, currentStatus: boolean) => {
    try {
      const txRef = doc(db, 'transactions', txId);
      await updateDoc(txRef, { isFavorite: !currentStatus });
      showToast(currentStatus ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };
  const handleFreezeCard = async () => {
    if (!user.virtualCard) return;
    try {
      await withRetry(async () => {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          'virtualCard.isFrozen': !user.virtualCard.isFrozen
        });
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    }
  };

  const handleTopUpCard = async (topUpAmount: string, pin: string) => {
    const num = parseFloat(topUpAmount);
    if (isNaN(num) || num <= 0 || num > user.balance) return;

    if (pin !== user.pin) {
      setCardTopUpError("Invalid transaction PIN");
      return;
    }

    const limitCheck = checkTransactionLimit(user, num);
    if (!limitCheck.allowed) {
      setCardTopUpError(limitCheck.reason || "Limit exceeded");
      return;
    }
    
    setIsCardTopUpProcessing(true);
    setCardTopUpError('');
    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw "User does not exist!";
        
        const userData = userDoc.data() as User;
        if (userData.balance < num) throw "Insufficient balance!";

        const now = new Date();
        let lastReset;
        if (userData.lastSpentReset) {
          if (userData.lastSpentReset.toDate) {
            lastReset = userData.lastSpentReset.toDate();
          } else {
            lastReset = new Date(userData.lastSpentReset);
          }
        } else {
          lastReset = new Date(0);
        }
        
        let dailySpent = 0;
        if (userData.dailySpent) {
          dailySpent = userData.dailySpent;
        }
        
        let monthlySpent = 0;
        if (userData.monthlySpent) {
          monthlySpent = userData.monthlySpent;
        }

        if (now.toDateString() !== lastReset.toDateString()) {
          dailySpent = 0;
        }
        if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
          monthlySpent = 0;
        }

        let currentCardBalance = 0;
        if (userData.virtualCard) {
          if (userData.virtualCard.cardBalance) {
            currentCardBalance = userData.virtualCard.cardBalance;
          }
        }

        let cardName = '';
        if (userData.virtualCard) {
          if (userData.virtualCard.cardName) {
            cardName = userData.virtualCard.cardName;
          }
        }

        transaction.update(userRef, {
          balance: userData.balance - num,
          'virtualCard.cardBalance': currentCardBalance + num,
          dailySpent: dailySpent + num,
          monthlySpent: monthlySpent + num,
          lastSpentReset: serverTimestamp()
        });

        const txRef = doc(collection(db, 'transactions'));
        const txData = {
          senderAccount: userData.accountNumber,
          senderUid: user.uid,
          receiverAccount: 'CARD',
          receiverUid: user.uid,
          amount: num,
          status: 'success',
          type: 'card',
          name: 'Card Top Up',
          createdAt: serverTimestamp(),
          ref: `TOP-${Math.random().toString(36).substring(7).toUpperCase()}`,
          details: { 
            cardName: cardName,
            cardType: userData.virtualCard?.cardType || 'Virtual Card'
          }
        };
        transaction.set(txRef, txData);
        
        setLastTransaction({
          id: txRef.id,
          ...txData,
          date: 'Just now',
          icon: <CreditCard className="w-6 h-6 text-emerald-600" />
        });
      });
      setIsCardTopUpProcessing(false);
      setCardTopUpModalOpen(false);
      setReceiptModalOpen(true);
      setCardTopUpStep('amount');
      setCardTopUpAmount('');
      setCardTopUpPin('');
    } catch (error) {
      setIsCardTopUpProcessing(false);
      handleFirestoreError(error, OperationType.WRITE, 'transactions');
    }
  };

  const [currency, setCurrency] = useState('NGN');
  const [chatOpen, setChatOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [airtimeModalOpen, setAirtimeModalOpen] = useState(false);
  const [dataModalOpen, setDataModalOpen] = useState(false);
  const [tvModalOpen, setTvModalOpen] = useState(false);
  const [billsModalOpen, setBillsModalOpen] = useState(false);
  const [cardsModalOpen, setCardsModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [cardTopUpModalOpen, setCardTopUpModalOpen] = useState(false);
  const [bettingModalOpen, setBettingModalOpen] = useState(false);
  const [investmentModalOpen, setInvestmentModalOpen] = useState(false);
  const [investmentModalTab, setInvestmentModalTab] = useState<'plans' | 'my-investments' | 'explore' | 'details' | 'portfolio'>('plans');
  const [selectedInvestmentPlan, setSelectedInvestmentPlan] = useState<any>(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [investmentAgreementAccepted, setInvestmentAgreementAccepted] = useState(false);
  const [isInvestmentProcessing, setIsInvestmentProcessing] = useState(false);
  const [investmentError, setInvestmentError] = useState('');
  const [navView, setNavView] = useState<'home' | 'card' | 'me' | 'invitation' | 'cards' | 'transactions' | 'payments'>('home');
  const [lastTransaction, setLastTransaction] = useState<any>(null);
  
  // Transaction Filter States
  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [txFilterType, setTxFilterType] = useState('all');
  const [txFilterCategory, setTxFilterCategory] = useState('all');
  const [txFilterStatus, setTxFilterStatus] = useState('all');
  const [txStartDate, setTxStartDate] = useState('');
  const [txEndDate, setTxEndDate] = useState('');
  const [txMinAmount, setTxMinAmount] = useState('');
  const [txMaxAmount, setTxMaxAmount] = useState('');
  const [txSortBy, setTxSortBy] = useState('newest');
  const [txShowFilters, setTxShowFilters] = useState(false);
  
  // Transfer Flow State
  const [transferStep, setTransferStep] = useState<'details' | 'confirm' | 'pin' | 'success'>('details');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [accountName, setAccountName] = useState('');
  const [transferPin, setTransferPin] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferError, setTransferError] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [resolvingBank, setResolvingBank] = useState<string | null>(null);
  const [isVerifiedAccount, setIsVerifiedAccount] = useState(false);
  const [recentRecipients, setRecentRecipients] = useState<any[]>([]);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [isServiceError, setIsServiceError] = useState(false);
  const [searchUsersModalOpen, setSearchUsersModalOpen] = useState(false);

  // Betting State
  const [bettingPlatform, setBettingPlatform] = useState('');
  const [bettingUserId, setBettingUserId] = useState('');
  const [bettingAmount, setBettingAmount] = useState('');
  const [bettingError, setBettingError] = useState('');
  const [isBettingProcessing, setIsBettingProcessing] = useState(false);
  const [transactionHistoryModalOpen, setTransactionHistoryModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [transactionDetailsModalOpen, setTransactionDetailsModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const cashFlowData = [
    { name: 'Jan', income: 4000, expense: 2400 },
    { name: 'Feb', income: 3000, expense: 1398 },
    { name: 'Mar', income: 2000, expense: 9800 },
    { name: 'Apr', income: 2780, expense: 3908 },
    { name: 'May', income: 1890, expense: 4800 },
    { name: 'Jun', income: 2390, expense: 3800 },
  ];

  const [recurringPaymentsModalOpen, setRecurringPaymentsModalOpen] = useState(false);
  const [recurringPayments, setRecurringPayments] = useState<any[]>([]);
  const [myInvestments, setMyInvestments] = useState<any[]>([]);

  useEffect(() => {
    if (user.uid) {
      const q = query(collection(db, 'user_investments'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMyInvestments(data);
      }, (error) => {
        console.error("User investments listener error:", error);
        // If index is missing, fallback to non-ordered
        const qFallback = query(collection(db, 'user_investments'), where('uid', '==', user.uid));
        onSnapshot(qFallback, (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setMyInvestments(data);
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'user_investments');
        });
      });
      return () => unsubscribe();
    }
  }, [user.uid]);

  useEffect(() => {
    const q = query(collection(db, 'recurring_payments'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecurringPayments(data);
    }, (error) => {
      console.error("Recurring payments listener error:", error);
      const qFallback = query(collection(db, 'recurring_payments'), where('uid', '==', user.uid));
      onSnapshot(qFallback, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRecurringPayments(data);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, 'recurring_payments');
      });
    });
    return () => unsubscribe();
  }, [user.uid]);

  const handleAddRecurringPayment = async (payment: any) => {
    try {
      const paymentRef = doc(collection(db, 'recurring_payments'));
      await setDoc(paymentRef, {
        ...payment,
        uid: user.uid,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'recurring_payments');
    }
  };

  const handleDeleteRecurringPayment = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'recurring_payments', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'recurring_payments');
    }
  };

  const handleInvest = async () => {
    const amt = parseFloat(investmentAmount);
    if (isNaN(amt) || amt <= 0 || amt > user.balance) {
      setInvestmentError("Invalid amount or insufficient balance");
      return;
    }

    setIsInvestmentProcessing(true);
    setInvestmentError('');

    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw "User does not exist!";
        
        const userData = userDoc.data() as User;
        if (userData.balance < amt) throw "Insufficient balance!";

        // Deduct from balance
        transaction.update(userRef, {
          balance: userData.balance - amt
        });

        // Add to user_investments
        const investmentRef = doc(collection(db, 'user_investments'));
        transaction.set(investmentRef, {
          uid: user.uid,
          planTitle: selectedInvestmentPlan.title,
          amount: amt,
          roi: selectedInvestmentPlan.return,
          risk: selectedInvestmentPlan.risk,
          color: selectedInvestmentPlan.color,
          createdAt: serverTimestamp(),
          status: 'active'
        });

        // Add transaction record
        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          uid: user.uid,
          senderAccount: userData.accountNumber,
          receiverAccount: 'INVESTMENT',
          type: 'investment',
          name: `Invested in ${selectedInvestmentPlan.title}`,
          amount: amt,
          status: 'success',
          createdAt: serverTimestamp(),
          details: { planTitle: selectedInvestmentPlan.title }
        });
      });

      setInvestmentModalTab('portfolio');
      setInvestmentAmount('');
      setInvestmentAgreementAccepted(false);
    } catch (error: any) {
      console.error("Investment error:", error);
      setInvestmentError(typeof error === 'string' ? error : "Investment failed. Please try again.");
    } finally {
      setIsInvestmentProcessing(false);
    }
  };

  const [phoneNumber, setPhoneNumber] = useState('');
  const [network, setNetwork] = useState('');
  const [dataPlan, setDataPlan] = useState('');

  // TV/Bills State
  const [serviceProvider, setServiceProvider] = useState('');
  const [billType, setBillType] = useState('');
  const [customerRef, setCustomerRef] = useState('');

  // Cards State
  const [cardName, setCardName] = useState('');
  const [cardType, setCardType] = useState('Virtual Visa');

  const [messages, setMessages] = useState([
    { role: 'model', content: `Hello ${user.name}! I am Sage AI, your personal financial assistant. How can I help you today?` }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [note, setNote] = useState('');
  const [transferSuccess, setTransferSuccess] = useState(false);

  const convert = (amt: number) => {
    const numericAmt = Math.abs(amt);
    if (currency === 'USD') {
      return (numericAmt / 1550).toFixed(2);
    } else {
      return numericAmt.toLocaleString();
    }
  };

  const getSymbol = () => {
    if (currency === 'NGN') {
      return '₦';
    } else {
      return '$';
    }
  };
  const symbol = getSymbol();

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);


  useEffect(() => {
    if (transferModalOpen && transactions) {
      const recents = transactions
        .filter(tx => tx.type === 'transfer' && tx.senderUid === user.uid)
        .map(tx => tx.details)
        .filter((details, index, self) => 
          details && details.accountNumber && 
          self.findIndex(t => t?.accountNumber === details.accountNumber) === index
        )
        .slice(0, 5);
      setRecentRecipients(recents);
    }
  }, [transferModalOpen, transactions, user.uid]);

  // Real Account Name Resolution using Paystack API (via our backend proxy)
  useEffect(() => {
    if (isRateLimited) {
      const timer = setTimeout(() => setIsRateLimited(false), 15000); // 15s lockout
      return () => clearTimeout(timer);
    }

    if (accountNumber.length > 0) {
      if (!/^\d+$/.test(accountNumber)) {
        setAccountName('');
        setTransferError('Account number must contain only digits');
        return;
      }
      if (accountNumber.length !== 10) {
        setAccountName('');
        setTransferError('Incorrect account number');
        return;
      }
    }

    if (accountNumber.length === 0 || !bankName) {
      setAccountName('');
      setTransferError('');
      return;
    }

    const timer = setTimeout(() => {
      const resolveAccount = async () => {
        setIsResolving(true);
        setResolvingBank(bankName);
        setTransferError('');
        setIsVerifiedAccount(false);
        
        const internalSearch = async () => {
          const publicProfilesRef = collection(db, 'public_profiles');
          const q = query(publicProfilesRef, where('accountNumber', '==', accountNumber));
          const querySnapshot = await withRetry(() => getDocs(q));
          if (!querySnapshot.empty) {
            const recipientData = querySnapshot.docs[0].data();
            if (recipientData.uid === auth.currentUser?.uid) {
              setAccountName('');
              setTransferError("You cannot send money to yourself");
              return null;
            }
            setIsVerifiedAccount(true);
            return recipientData.name;
          }
          return null;
        };

        const bankCodes: Record<string, string> = {
          'Access Bank': '044', 'First Bank': '011', 'GTBank': '058', 'Zenith Bank': '057',
          'UBA': '033', 'Kuda Bank': '50211', 'Opay': '999992', 'Palmpay': '999991',
          'Wema Bank': '035', 'Sterling Bank': '232', 'Union Bank': '032', 'Stanbic IBTC': '221',
          'Fidelity Bank': '070', 'Moniepoint': '50515', 'FairMoney': '51318', 'Carbon': '050003',
          'FCMB': '214', 'Heritage Bank': '030', 'Unity Bank': '215', 'Polaris Bank': '076',
          'Keystone Bank': '082', 'Standard Chartered': '068', 'Titan Trust': '102',
          'Providus Bank': '101', 'Taj Bank': '302', 'Jaiz Bank': '301', 'Suntrust Bank': '100',
          'Globus Bank': '103'
        };

        const FALLBACK_BANKS = [
          'GTBank', 'Access Bank', 'Zenith Bank', 'First Bank', 'UBA', 'Kuda Bank', 'Opay', 'Palmpay', 'Moniepoint'
        ];

        try {
          // 1. Try Internal Search First if SageVault is selected
          if (bankName === 'SageVault') {
            const name = await internalSearch();
            if (name) {
              setAccountName(name);
              return;
            }
          }

          // 2. Try Selected Bank (External)
          if (bankName !== 'SageVault') {
            try {
              const bankCode = bankCodes[bankName] || '044';
              const response = await withRetry(() => axios.get(`/api/resolve-account?account_number=${accountNumber.trim()}&bank_code=${bankCode.trim()}`));
              
              if (response.data.status) {
                setAccountName(response.data.data.account_name);
                return;
              }
            } catch (err) {
              console.warn(`Resolution failed for ${bankName}, trying fallbacks...`);
            }
          }

          // 3. Fallback Loop: Try Internal Search (if not already tried)
          if (bankName !== 'SageVault') {
            setResolvingBank('SageVault');
            const internalName = await internalSearch();
            if (internalName) {
              setAccountName(internalName);
              setBankName('SageVault');
              return;
            }
          }

          // 4. Fallback Loop: Try Common External Banks
          for (const fallbackBank of FALLBACK_BANKS) {
            if (fallbackBank === bankName) continue; // Skip if already tried
            
            try {
              setResolvingBank(fallbackBank);
              const bCode = bankCodes[fallbackBank];
              if (!bCode) continue;
              
              console.log(`Fallback loop: Trying ${fallbackBank}...`);
              const res = await axios.get(`/api/resolve-account?account_number=${accountNumber.trim()}&bank_code=${bCode}`);
              
              if (res.data.status) {
                setAccountName(res.data.data.account_name);
                setBankName(fallbackBank);
                showToast(`Found account in ${fallbackBank}!`);
                return;
              }
            } catch (e) {
              // Silently continue to next fallback
            }
          }

          // 5. Final Fallback: If still not found
          setAccountName('');
          setTransferError('Account not found in any supported bank');

        } catch (err: any) {
          console.error('Resolution error:', err);
          setAccountName('');
          if (err.response && err.response.status === 429) {
            setTransferError('Too many requests. Please wait.');
            setIsRateLimited(true);
          } else if (err.response && err.response.status === 422) {
            setTransferError(err.response.data?.message || 'Account not found. Please check the details.');
          } else if (err.response && (err.response.status >= 500 || err.response.status === 502)) {
            setTransferError(err.response.data?.message || 'Bank service is currently unavailable. Please try again later.');
            setIsServiceError(true);
          } else {
            setTransferError('Could not verify account. Please check the details.');
          }
        } finally {
          setIsResolving(false);
          setResolvingBank(null);
        }
      };

      resolveAccount();
    }, 800);

    return () => clearTimeout(timer);
  }, [accountNumber, bankName, isRateLimited]);

  // Network Detection
  useEffect(() => {
    if (phoneNumber.length === 0) {
      setNetwork('');
      setTransferError('');
      return;
    }
    
    if (phoneNumber.length !== 11) {
      setNetwork('');
      if (phoneNumber.length > 3) setTransferError('Incorrect number');
      return;
    }

    const networkDB: Record<string, string> = {
      "080": "MTN",
      "081": "MTN",
      "070": "Airtel",
      "090": "Airtel",
      "091": "Glo"
    };

    const prefix = phoneNumber.substring(0, 3);
    const detectedNetwork = networkDB[prefix];
    
    if (detectedNetwork) {
      setNetwork(detectedNetwork);
      setTransferError('');
    } else {
      setNetwork('');
      setTransferError('Incorrect number');
    }
  }, [phoneNumber]);

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      setTransferError('Please enter a valid amount');
      return;
    }
    
    if (numAmount > user.balance) {
      setTransferError('Insufficient balance');
      return;
    }

    if (accountNumber.length < 10) {
      setTransferError('Invalid account number');
      return;
    }

    if (!accountName) {
      setTransferError('Could not resolve account name');
      return;
    }

    setTransferStep('confirm');
    setTransferError('');
  };

  const handleActionSubmit = (type: 'Airtime' | 'Data' | 'TV' | 'Bill' | 'Card') => {
    let numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      numAmount = 0;
    }
    if (type !== 'Card' && (isNaN(numAmount) || numAmount <= 0)) {
      setTransferError('Please enter a valid amount');
      return;
    }
    if (type !== 'Card' && numAmount > user.balance) {
      setTransferError('Insufficient balance');
      return;
    }
    if (type === 'Card' && 10 > user.balance) {
      setTransferError('Insufficient balance for card creation fee (₦10)');
      return;
    }
    setTransferStep('pin');
  };

  const verifyPinAndSend = async (e?: React.FormEvent | string, typeOverride?: string) => {
    if (e && typeof e !== 'string') e.preventDefault();
    const pinToVerify = typeof e === 'string' ? e : transferPin;
    if (pinToVerify !== user.pin) {
      setTransferError('Incorrect Transaction PIN');
      return;
    }

    const numAmount = parseFloat(amount) || 0;
    let transactionType: 'transfer' | 'airtime' | 'data' | 'tv' | 'bill' | 'card' | 'betting' = (typeOverride as any) || 'transfer';
    let transactionName = `Transfer to ${accountName}`;
    let details = { accountNumber, bankName, accountName };

    if (airtimeModalOpen) {
      transactionType = 'airtime';
      transactionName = `Airtime Recharge (${network})`;
      details = { phoneNumber, network, amount } as any;
    } else if (dataModalOpen) {
      transactionType = 'data';
      transactionName = `Data Purchase (${network})`;
      details = { phoneNumber, network, dataPlan, amount } as any;
    } else if (tvModalOpen) {
      transactionType = 'tv';
      transactionName = `${serviceProvider} Subscription`;
      details = { customerRef, serviceProvider, amount } as any;
    } else if (billsModalOpen) {
      transactionType = 'bill';
      transactionName = `${billType} Payment`;
      details = { billType, customerRef, amount } as any;
    } else if (cardsModalOpen) {
      transactionType = 'card';
      transactionName = `Virtual Card Creation (${cardName})`;
      details = { cardName, cardType, amount: '10' } as any;
    }

    const finalAmount = cardsModalOpen ? 10 : numAmount;
    const isInternal = bankName === 'SageVault';

    // Generate card details if needed
    const generatedCard = cardsModalOpen ? {
      cardNumber: Array.from({length: 4}, () => Math.floor(Math.random() * 9000 + 1000)).join(' '),
      expiry: '12/28',
      cvv: Math.floor(Math.random() * 900 + 100).toString(),
      cardName: cardName || user.name,
      cardType: cardType,
      isFrozen: false,
      cardBalance: 0
    } : null;

    if (cardsModalOpen && generatedCard) {
      details = { ...details, ...generatedCard } as any;
    }

    setIsResolving(true);
    setTransferError('');
    setIsRetryable(false);
    try {
      let receiverRef = null;
      if (isInternal && accountNumber) {
        const publicProfilesRef = collection(db, 'public_profiles');
        const q = query(publicProfilesRef, where('accountNumber', '==', accountNumber));
        try {
          const querySnapshot = await withRetry(() => getDocs(q));
          if (!querySnapshot.empty) {
            const receiverUid = querySnapshot.docs[0].data().uid;
            receiverRef = doc(db, 'users', receiverUid);
          } else {
            throw "Internal receiver account not found";
          }
        } catch (error) {
          if (typeof error === 'string') throw error;
          handleFirestoreError(error, OperationType.LIST, 'public_profiles');
        }
      }

      try {
        await withRetry(() => runTransaction(db, async (transaction) => {
          const senderRef = doc(db, 'users', user.uid);
          const senderDoc = await transaction.get(senderRef);
          if (!senderDoc.exists()) throw "Sender does not exist!";
          
          const senderData = senderDoc.data() as User;
          
          // Transaction Logic Engine Integration
          const DAILY_LIMIT = 500000;
          if (senderData.dailySpent + finalAmount > DAILY_LIMIT) {
            throw "Transaction limit exceeded";
          }

          if (senderData.balance < finalAmount) throw "Insufficient balance";

          // Deduct from sender
          transaction.update(senderRef, {
            balance: senderData.balance - finalAmount,
            ...(cardsModalOpen && generatedCard && {
              virtualCard: generatedCard
            })
          });

          // If internal, credit receiver
          let receiverUid = null;
          if (receiverRef) {
            receiverUid = receiverRef.id;
            transaction.update(receiverRef, {
              balance: increment(finalAmount)
            });
          }

          // Add transaction record for sender
          const txRef = doc(collection(db, 'transactions'));
          let receiverAccount;
          if (accountNumber) {
            receiverAccount = accountNumber;
          } else {
            if (cardsModalOpen) {
              receiverAccount = 'CARD';
            } else {
              receiverAccount = 'BILL';
            }
          }
          const txData = {
            uid: user.uid,
            senderAccount: senderData.accountNumber,
            senderUid: user.uid,
            receiverAccount: receiverAccount,
            receiverUid: receiverUid,
            amount: finalAmount,
            status: 'success',
            type: transactionType,
            name: transactionName,
            createdAt: serverTimestamp(),
            ref: `${transactionType.substring(0,3).toUpperCase()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
            details: details,
            note: transferNote
          };
          transaction.set(txRef, txData);
          
          setLastTransaction({
            id: txRef.id,
            ...txData,
            date: 'Just now',
            icon: <Send className="w-6 h-6 text-blue-600" />
          });
        }));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'transactions');
      }

      // Reset form and switch modals
      setTransferStep('success');
      setTransferSuccess(true);
    } catch (error: any) {
      console.error("Transaction error:", error);
      let displayError = "Transaction failed. Please check your connection and try again.";
      let isRetryable = true;

      if (typeof error === 'string') {
        displayError = error;
        if (error === "Insufficient balance" || error === "Transaction limit exceeded") {
          isRetryable = false;
        }
      } else if (error.message) {
        try {
          const parsed = JSON.parse(error.message);
          if (parsed.error && parsed.error.includes('offline')) {
            displayError = "Network error: You appear to be offline. Please check your internet.";
          } else {
            displayError = "A secure connection could not be established. Please try again.";
          }
        } catch (e) {
          displayError = error.message;
        }
      }
      
      setTransferError(displayError);
      setIsRetryable(isRetryable); 
    } finally {
      setIsResolving(false);
    }
  };

  const resetTransferForm = () => {
    setTransferStep('details');
    setBankName('');
    setAccountNumber('');
    setAmount('');
    setAccountName('');
    setTransferPin('');
    setTransferError('');
    setIsRateLimited(false);
    setIsServiceError(false);
    setIsVerifiedAccount(false);
    setResolvingBank(null);
    setPhoneNumber('');
    setNetwork('');
    setDataPlan('');
    setServiceProvider('');
    setBillType('');
    setCustomerRef('');
    setCardName('');
    setTransferNote('');
  };

  const sendMessage = async (messageInput?: string | React.FormEvent) => {
    let userMessage = '';
    if (typeof messageInput === 'string') {
      userMessage = messageInput;
    } else {
      if (messageInput) messageInput.preventDefault();
      if (!input.trim() || isTyping) return;
      userMessage = input;
    }

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [{ text: `You are Sage AI, a financial assistant for SageVault. The user is ${user.name}. Their balance is ${symbol}${convert(user.balance)}. Answer the following query concisely: ${userMessage}` }]
          }
        ],
        config: {
          systemInstruction: "You are a helpful, professional, and friendly financial assistant for a fintech app called SageVault. Keep responses short and actionable."
        }
      });

      const aiResponseText = response.text || "I'm sorry, I couldn't process that. Please try again.";
      let aiResponse = aiResponseText;
      if (response.text) {
        aiResponse = response.text;
      } else {
        aiResponse = "I'm sorry, I couldn't process that. Please try again.";
      }
      setMessages(prev => [...prev, { role: 'model', content: aiResponse }]);
    } catch (error) {
      console.error("Gemini API Error:", error);
      setMessages(prev => [...prev, { role: 'model', content: "I'm having trouble connecting to my brain right now. Please try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navItems = [
    { id: 'home', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
    { id: 'transactions', label: 'Transactions', icon: <ArrowUpRight className="w-5 h-5" /> },
    { id: 'cards', label: 'My Cards', icon: <CreditCard className="w-5 h-5" /> },
    { id: 'payments', label: 'Payments', icon: <Zap className="w-5 h-5" /> },
  ];

  const preferenceItems = [
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
    { id: 'help', label: 'Help & Support', icon: <HelpCircle className="w-5 h-5" /> },
  ];

  let showAllTestimonialsModal = null;
  if (showAllTestimonials) {
    showAllTestimonialsModal = (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowAllTestimonials(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
        >
          <div className="flex justify-between items-center mb-8 shrink-0">
            <div>
              <h3 className="font-black text-2xl uppercase tracking-tight">All Testimonials</h3>
              <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-400 uppercase tracking-widest">What our community says</p>
            </div>
            <button onClick={() => setShowAllTestimonials(false)} className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-2xl hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
            {testimonials.map((t) => {
              let testimonialNameInitial = '';
              if (t.name) {
                testimonialNameInitial = t.name.charAt(0);
              }

              let testimonialDate = 'Just now';
              if (t.createdAt) {
                if (t.createdAt.toDate) {
                  testimonialDate = t.createdAt.toDate().toLocaleDateString();
                } else {
                  testimonialDate = new Date(t.createdAt).toLocaleDateString();
                }
              }

              return (
                <div key={t.id} className="bg-gray-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-gray-100 dark:border-zinc-700/50">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xs">
                        {testimonialNameInitial}
                      </div>
                      <h4 className="font-bold text-base">{t.name}</h4>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-zinc-300 text-sm leading-relaxed italic">"{t.text}"</p>
                  <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold mt-4 uppercase tracking-widest">
                    {testimonialDate}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    );
  }

  let transferModal = null;
  if (transferModalOpen) {
    let transferModalContent = null;
    if (transferStep === 'details') {
      transferModalContent = (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Select Bank</label>
              <select 
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                className="w-full p-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all text-zinc-900 dark:text-zinc-100"
              >
                <option value="" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Choose a bank</option>
                <option value="SageVault" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">SageVault (Internal)</option>
                <option value="Access Bank" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Access Bank</option>
                <option value="First Bank" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">First Bank</option>
                <option value="GTBank" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">GTBank</option>
                <option value="Zenith Bank" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Zenith Bank</option>
                <option value="UBA" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">UBA</option>
                <option value="Wema Bank" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Wema Bank</option>
                <option value="Sterling Bank" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Sterling Bank</option>
                <option value="Union Bank" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Union Bank</option>
                <option value="Stanbic IBTC" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Stanbic IBTC</option>
                <option value="Fidelity Bank" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Fidelity Bank</option>
                <option value="Moniepoint" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Moniepoint</option>
                <option value="FairMoney" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">FairMoney</option>
                <option value="Carbon" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Carbon</option>
                <option value="FCMB" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">FCMB</option>
                <option value="Heritage Bank" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Heritage Bank</option>
                <option value="Unity Bank" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Unity Bank</option>
                <option value="Polaris Bank" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Polaris Bank</option>
                <option value="Keystone Bank" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Keystone Bank</option>
                <option value="Standard Chartered" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Standard Chartered</option>
                <option value="Titan Trust" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Titan Trust</option>
                <option value="Kuda Bank" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Kuda Bank</option>
                <option value="Opay" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Opay</option>
                <option value="Palmpay" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Palmpay</option>
              </select>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Number</label>
                <button 
                  onClick={() => setSearchUsersModalOpen(true)}
                  className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1"
                >
                  <Search className="w-3 h-3" /> Search Users
                </button>
              </div>
              <div className="relative">
                <input 
                  type="text"
                  maxLength={10}
                  value={accountNumber}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setAccountNumber(val);
                  }}
                  placeholder="0123456789"
                  className="w-full p-5 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all"
                />
                {isResolving && (
                  <div className="absolute right-5 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              {accountName && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/30 flex items-center gap-3"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-tight">{accountName}</span>
                </motion.div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest ml-1">Amount</label>
              <div className="flex items-center bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl focus-within:ring-2 focus-within:ring-blue-500 transition-all overflow-hidden">
                <span className="pl-5 font-black text-emerald-500 text-xl">₦</span>
                <input 
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-5 pl-2 bg-transparent border-none outline-none font-black text-xl text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Note (Optional)</label>
              <input 
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="What's this for?"
                className="w-full p-5 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all"
              />
            </div>
          </div>

          {transferError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/30 flex flex-col gap-3 relative">
              <button 
                onClick={() => {
                  setTransferError('');
                  setIsRetryable(false);
                }}
                className="absolute top-2 right-2 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors"
              >
                <X className="w-3 h-3 text-red-400" />
              </button>
              <div className="flex items-center gap-3 pr-6">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-xs font-bold text-red-600 dark:text-red-400">{transferError}</span>
              </div>
              {isRetryable && (
                <button 
                  onClick={() => {
                    setTransferError('');
                    setIsRetryable(false);
                    verifyPinAndSend();
                  }}
                  className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline text-left ml-7"
                >
                  Retry Transaction
                </button>
              )}
            </div>
          )}

          <button 
            onClick={() => {
              if (!bankName || !accountNumber || !amount || !accountName) {
                setTransferError("Please fill all fields correctly");
                return;
              }
              if (parseFloat(amount) < 100) {
                setTransferError("Minimum transfer amount is " + symbol + "100");
                return;
              }
              if (parseFloat(amount) > user.balance) {
                setTransferError("Insufficient balance");
                return;
              }
              setTransferStep('confirm');
            }}
            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all active:scale-95"
          >
            Continue
          </button>
        </div>
      );
    } else if (transferStep === 'confirm') {
      transferModalContent = (
        <div className="space-y-8">
          <div className="bg-gray-50 dark:bg-zinc-800/50 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-700/50 space-y-6">
            <div className="text-center space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">You are sending</p>
              <h2 className="text-4xl font-black tracking-tighter">{symbol}{convert(parseFloat(amount))}</h2>
            </div>
            <div className="space-y-4 pt-6 border-t border-dashed border-gray-200 dark:border-zinc-700">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recipient</span>
                <span className="font-black text-sm uppercase">{accountName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bank</span>
                <span className="font-black text-sm">{bankName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Account</span>
                <span className="font-black text-sm">{accountNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fee</span>
                <span className="font-black text-sm text-emerald-500 uppercase tracking-widest">Free</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => setTransferStep('details')}
              className="flex-1 py-5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
            >
              Back
            </button>
            <button 
              onClick={() => setTransferStep('pin')}
              className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all active:scale-95"
            >
              Confirm Transfer
            </button>
          </div>
        </div>
      );
    } else if (transferStep === 'pin') {
      transferModalContent = (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-10 h-10 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">Enter Transaction PIN</h3>
              <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 mt-1">Secure your transaction with your 4-digit PIN</p>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            {[0, 1, 2, 3].map(i => (
              <div 
                key={i}
                className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${
                  transferPin.length > i 
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800'
                }`}
              >
                {transferPin.length > i && <div className="w-3 h-3 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]" />}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'back'].map((num, i) => (
              <button
                key={i}
                onClick={() => {
                  if (num === 'back') {
                    setTransferPin(prev => prev.slice(0, -1));
                  } else if (num !== '' && transferPin.length < 4) {
                    const newPin = transferPin + num;
                    setTransferPin(newPin);
                    if (newPin.length === 4) {
                      verifyPinAndSend(newPin);
                    }
                  }
                }}
                className={`h-16 rounded-2xl font-black text-xl flex items-center justify-center transition-all active:scale-90 ${
                  num === '' ? 'opacity-0 pointer-events-none' : 'bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700'
                }`}
              >
                {num === 'back' ? <Delete className="w-6 h-6" /> : num}
              </button>
            ))}
          </div>

          <div className="text-center">
            <button 
              onClick={() => {
                setPinResetStep('request');
                setPinResetEmail(user.email || '');
                setIsPinResetModalOpen(true);
              }}
              className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline"
            >
              Forgot Transaction PIN?
            </button>
          </div>

          {transferError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/30 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-xs font-bold text-red-600 dark:text-red-400">{transferError}</span>
            </div>
          )}
        </div>
      );
    } else if (transferStep === 'success') {
      transferModalContent = (
        <div className="text-center space-y-8 py-10">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30"
          >
            <CheckCircle2 className="w-12 h-12 text-white" />
          </motion.div>
          <div>
            <h3 className="text-2xl font-black tracking-tight">Transfer Successful!</h3>
            <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 mt-2 uppercase tracking-widest">Your money is on its way</p>
          </div>
          <div className="bg-gray-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-gray-100 dark:border-zinc-700/50">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Amount Sent</p>
            <p className="text-3xl font-black text-blue-600">{symbol}{convert(parseFloat(amount))}</p>
          </div>
        </div>
      );
    }

    transferModal = (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !isResolving && setTransferModalOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          className="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] p-8 sm:p-10 shadow-2xl overflow-hidden"
        >
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center shadow-inner">
                <Send className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight leading-none">Send Money</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Transfer to any bank</p>
              </div>
            </div>
            <button onClick={() => setTransferModalOpen(false)} className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-2xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          {transferModalContent}
        </motion.div>
      </div>
    );
  }

  let receiveModal = null;
  if (receiveModalOpen) {
    receiveModal = (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setReceiveModalOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          className="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] p-8 sm:p-10 shadow-2xl overflow-hidden"
        >
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center shadow-inner">
                <ArrowDownLeft className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight leading-none">Receive</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Your account details</p>
              </div>
            </div>
            <button onClick={() => setReceiveModalOpen(false)} className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-2xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-zinc-800/50 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-700/50 text-center space-y-6">
              <div className="w-32 h-32 bg-white dark:bg-zinc-900 rounded-3xl mx-auto flex items-center justify-center shadow-sm border border-gray-100 dark:border-zinc-800">
                <QrCode className="w-20 h-20 text-gray-200 dark:text-zinc-700" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Account Name</p>
                <h4 className="text-xl font-black tracking-tight uppercase">{user.name}</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Bank Name</p>
                  <p className="text-sm font-black">SageVault</p>
                </div>
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 relative group">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Account Number</p>
                  <p className="text-sm font-black">{user.accountNumber}</p>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(user.accountNumber);
                    }}
                    className="absolute top-2 right-2 p-1 text-gray-300 hover:text-blue-500 transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <button 
              onClick={() => {
                const text = `Hey! You can send money to my SageVault account:\nName: ${user.name}\nAccount: ${user.accountNumber}\nBank: SageVault`;
                if (navigator.share) {
                  navigator.share({ title: 'My Account Details', text });
                } else {
                  navigator.clipboard.writeText(text);
                }
              }}
              className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3"
            >
              <Share2 className="w-5 h-5" />
              Share Details
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  let airtimeModal = null;
  if (airtimeModalOpen) {
    let airtimeModalContent = null;
    if (transferStep === 'pin') {
       airtimeModalContent = (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-10 h-10 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">Enter Transaction PIN</h3>
              <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 mt-1">Secure your purchase with your 4-digit PIN</p>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            {[0, 1, 2, 3].map(i => (
              <div 
                key={i}
                className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${
                  transferPin.length > i 
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' 
                    : 'border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800'
                }`}
              >
                {transferPin.length > i && <div className="w-3 h-3 bg-emerald-600 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'back'].map((num, i) => (
              <button
                key={i}
                onClick={() => {
                  if (num === 'back') {
                    setTransferPin(prev => prev.slice(0, -1));
                  } else if (num !== '' && transferPin.length < 4) {
                    const newPin = transferPin + num;
                    setTransferPin(newPin);
                    if (newPin.length === 4) {
                      verifyPinAndSend(newPin, 'airtime');
                    }
                  }
                }}
                className={`h-16 rounded-2xl font-black text-xl flex items-center justify-center transition-all active:scale-90 ${
                  num === '' ? 'opacity-0 pointer-events-none' : 'bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700'
                }`}
              >
                {num === 'back' ? <Delete className="w-6 h-6" /> : num}
              </button>
            ))}
          </div>

          {transferError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/30 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-xs font-bold text-red-600 dark:text-red-400">{transferError}</span>
            </div>
          )}
        </div>
      );
    } else if (transferStep === 'success') {
      airtimeModalContent = (
        <div className="text-center space-y-8 py-10">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            className="w-24 h-24 bg-emerald-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30"
          >
            <CheckCircle2 className="w-12 h-12 text-white" />
          </motion.div>
          <div>
            <h3 className="text-2xl font-black tracking-tight">Recharge Successful!</h3>
            <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 mt-2 uppercase tracking-widest">Your airtime has been sent</p>
          </div>
          <div className="bg-gray-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-gray-100 dark:border-zinc-700/50">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Amount Recharged</p>
            <p className="text-3xl font-black text-emerald-600">{symbol}{convert(parseFloat(amount))}</p>
          </div>
        </div>
      );
    } else {
      airtimeModalContent = (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
              <input 
                type="text"
                maxLength={11}
                value={phoneNumber}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPhoneNumber(val);
                }}
                placeholder="08012345678"
                className="w-full p-5 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Network</label>
              <div className="grid grid-cols-4 gap-3">
                {['MTN', 'Airtel', 'Glo', '9mobile'].map(n => (
                  <button
                    key={n}
                    onClick={() => setNetwork(n)}
                    className={`py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                      network === n 
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                        : 'bg-gray-50 dark:bg-zinc-800 text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {network && phoneNumber.length === 11 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/30 flex items-center gap-3"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-tight">{network} Network Detected</span>
                </motion.div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Amount</label>
              <div className="flex items-center bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl focus-within:ring-2 focus-within:ring-emerald-500 transition-all overflow-hidden">
                <span className="pl-5 font-black text-emerald-500">₦</span>
                <input 
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-5 pl-2 bg-transparent border-none outline-none font-bold"
                />
              </div>
            </div>
          </div>

          {transferError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/30 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-xs font-bold text-red-600 dark:text-red-400">{transferError}</span>
            </div>
          )}

          <button 
            onClick={() => {
              if (!phoneNumber || !network || !amount) {
                setTransferError("Please fill all fields");
                return;
              }
              if (parseFloat(amount) > user.balance) {
                setTransferError("Insufficient balance");
                return;
              }
              setTransferStep('pin');
            }}
            className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all active:scale-95"
          >
            Buy Airtime
          </button>
        </div>
      );
    }

    airtimeModal = (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setAirtimeModalOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          className="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] p-8 sm:p-10 shadow-2xl overflow-hidden"
        >
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center shadow-inner">
                <Smartphone className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight leading-none">Airtime</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Top up any phone</p>
              </div>
            </div>
            <button onClick={() => setAirtimeModalOpen(false)} className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-2xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          {airtimeModalContent}
        </motion.div>
      </div>
    );
  }

  let dataModal = null;
  if (dataModalOpen) {
    let dataModalContent = null;
    if (transferStep === 'pin') {
      dataModalContent = (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-10 h-10 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">Enter Transaction PIN</h3>
              <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 mt-1">Secure your purchase with your 4-digit PIN</p>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            {[0, 1, 2, 3].map(i => (
              <div 
                key={i}
                className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${
                  transferPin.length > i 
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800'
                }`}
              >
                {transferPin.length > i && <div className="w-3 h-3 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]" />}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'back'].map((num, i) => (
              <button
                key={i}
                onClick={() => {
                  if (num === 'back') {
                    setTransferPin(prev => prev.slice(0, -1));
                  } else if (num !== '' && transferPin.length < 4) {
                    const newPin = transferPin + num;
                    setTransferPin(newPin);
                    if (newPin.length === 4) {
                      verifyPinAndSend(newPin, 'data');
                    }
                  }
                }}
                className={`h-16 rounded-2xl font-black text-xl flex items-center justify-center transition-all active:scale-90 ${
                  num === '' ? 'opacity-0 pointer-events-none' : 'bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700'
                }`}
              >
                {num === 'back' ? <Delete className="w-6 h-6" /> : num}
              </button>
            ))}
          </div>

          {transferError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/30 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-xs font-bold text-red-600 dark:text-red-400">{transferError}</span>
            </div>
          )}
        </div>
      );
    } else if (transferStep === 'success') {
      dataModalContent = (
        <div className="text-center space-y-8 py-10">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            className="w-24 h-24 bg-blue-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/30"
          >
            <CheckCircle2 className="w-12 h-12 text-white" />
          </motion.div>
          <div>
            <h3 className="text-2xl font-black tracking-tight">Data Purchase Successful!</h3>
            <p className="text-xs font-bold text-gray-400 dark:text-zinc-500 mt-2 uppercase tracking-widest">Your data plan is active</p>
          </div>
          <div className="bg-gray-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-gray-100 dark:border-zinc-700/50">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Plan Purchased</p>
            <p className="text-3xl font-black text-blue-600">{dataPlan}</p>
          </div>
        </div>
      );
    } else {
      dataModalContent = (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
              <input 
                type="text"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder="08012345678"
                className="w-full p-5 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Network</label>
              <div className="grid grid-cols-4 gap-3">
                {['MTN', 'Airtel', 'Glo', '9mobile'].map(n => (
                  <button
                    key={n}
                    onClick={() => setNetwork(n)}
                    className={`py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                      network === n 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                        : 'bg-gray-50 dark:bg-zinc-800 text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Data Plan</label>
              <select 
                value={dataPlan}
                onChange={e => setDataPlan(e.target.value)}
                className="w-full p-5 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all"
              >
                <option value="">Select a plan</option>
                <option value="1GB-500">1GB - ₦500 (30 Days)</option>
                <option value="2.5GB-1000">2.5GB - ₦1,000 (30 Days)</option>
                <option value="5GB-2000">5GB - ₦2,000 (30 Days)</option>
                <option value="10GB-3500">10GB - ₦3,500 (30 Days)</option>
                <option value="20GB-5000">20GB - ₦5,000 (30 Days)</option>
              </select>
            </div>
          </div>

          {transferError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/30 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-xs font-bold text-red-600 dark:text-red-400">{transferError}</span>
            </div>
          )}

          <button 
            onClick={() => {
              if (!phoneNumber || !network || !dataPlan) {
                setTransferError("Please fill all fields");
                return;
              }
              const planAmount = parseFloat(dataPlan.split('-')[1]);
              if (planAmount > user.balance) {
                setTransferError("Insufficient balance");
                return;
              }
              setTransferStep('pin');
            }}
            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all active:scale-95"
          >
            Buy Data
          </button>
        </div>
      );
    }

    dataModal = (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setDataModalOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          className="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] p-8 sm:p-10 shadow-2xl overflow-hidden"
        >
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center shadow-inner">
                <Globe className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight leading-none">Data Bundle</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">High-speed internet</p>
              </div>
            </div>
            <button onClick={() => setDataModalOpen(false)} className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-2xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          {dataModalContent}
        </motion.div>
      </div>
    );
  }

  let tvModal = null;
  if (tvModalOpen) {
    tvModal = (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setTvModalOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          className="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] p-8 sm:p-10 shadow-2xl overflow-hidden"
        >
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center shadow-inner">
                <Tv className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight leading-none">TV Subscription</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Never miss a show</p>
              </div>
            </div>
            <button onClick={() => setTvModalOpen(false)} className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-2xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Provider</label>
                <div className="grid grid-cols-3 gap-3">
                  {['DSTV', 'GOTV', 'Startimes'].map(p => (
                    <button
                      key={p}
                      className="py-4 bg-gray-50 dark:bg-zinc-800 rounded-xl font-black text-[10px] uppercase tracking-widest text-gray-400 hover:bg-gray-100 transition-all"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Smart Card Number</label>
                <input 
                  type="text"
                  placeholder="Enter number"
                  className="w-full p-5 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-bold transition-all"
                />
              </div>
            </div>
            <button className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-600/20 transition-all active:scale-95">
              Continue
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  let billsModal = null;
  if (billsModalOpen) {
    billsModal = (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setBillsModalOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          className="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] p-8 sm:p-10 shadow-2xl overflow-hidden"
        >
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center shadow-inner">
                <Zap className="w-7 h-7 text-orange-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight leading-none">Utility Bills</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Electricity & Water</p>
              </div>
            </div>
            <button onClick={() => setBillsModalOpen(false)} className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-2xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <button className="p-6 bg-gray-50 dark:bg-zinc-800 rounded-3xl border border-gray-100 dark:border-zinc-700 text-left space-y-3 hover:border-orange-500 transition-all group">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-black text-sm">Electricity</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Prepaid/Postpaid</p>
                </div>
              </button>
              <button className="p-6 bg-gray-50 dark:bg-zinc-800 rounded-3xl border border-gray-100 dark:border-zinc-700 text-left space-y-3 hover:border-blue-500 transition-all group">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Droplets className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-black text-sm">Water</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Utility Board</p>
                </div>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  let cardsModal = null;
  if (cardsModalOpen) {
    cardsModal = (
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setCardsModalOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          className="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] p-8 sm:p-10 shadow-2xl overflow-hidden"
        >
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center shadow-inner">
                <CreditCard className="w-7 h-7 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight leading-none">Virtual Card</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Global payments</p>
              </div>
            </div>
            <button onClick={() => setCardsModalOpen(false)} className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-2xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[2.5rem] text-white space-y-8 shadow-2xl shadow-indigo-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="flex justify-between items-start relative z-10">
                <div className="w-12 h-8 bg-amber-400/20 rounded-md border border-white/20 flex items-center justify-center">
                  <div className="w-8 h-4 bg-amber-400/40 rounded-sm" />
                </div>
                <div className="font-black italic text-xl tracking-tighter">SAGE</div>
              </div>
              <div className="space-y-1 relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Card Number</p>
                <p className="text-2xl font-black tracking-[0.2em]">**** **** **** 4242</p>
              </div>
              <div className="flex justify-between items-end relative z-10">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Card Holder</p>
                  <p className="text-sm font-black uppercase tracking-tight">{user.name}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Expires</p>
                  <p className="text-sm font-black">12/28</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => {
                setAmount('10'); // Card creation cost
                setTransferStep('pin');
                setTransferModalOpen(true);
              }}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all active:scale-95"
            >
              Create New Card (₦10)
            </button>
          </div>
        </motion.div>
      </div>
    );
  }



  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-500 flex ${dark ? 'bg-[#0a0a0b] text-white' : 'bg-gray-50 text-slate-900'}`}>
      
      {/* Global Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -100, opacity: 0, x: '-50%' }}
            animate={{ y: 40, opacity: 1, x: '-50%' }}
            exit={{ y: -100, opacity: 0, x: '-50%' }}
            className={`fixed top-0 left-1/2 z-[1000] px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4 min-w-[300px] border-2 ${
              toast.type === 'success' 
                ? 'bg-emerald-500 border-emerald-400 text-white' 
                : 'bg-rose-500 border-rose-400 text-white'
            }`}
          >
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              {toast.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            </div>
            <span className="font-black text-sm tracking-tight">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar for Desktop */}
      {!isMobile && (
        <aside className="hidden lg:flex flex-col w-72 h-screen sticky top-0 bg-white dark:bg-zinc-900 border-r border-gray-100 dark:border-zinc-800 z-50 p-8">
          <div className="flex items-center gap-3 mb-12">
            <Logo size="md" />
            <h1 className="text-2xl font-black tracking-tighter">SageVault</h1>
          </div>
          
          <nav className="flex-1 space-y-2">
            {[
              { id: 'home', label: 'Dashboard', icon: <Home className="w-5 h-5" /> },
              { id: 'transactions', label: 'Activity', icon: <History className="w-5 h-5" /> },
              { id: 'payments', label: 'Payments', icon: <Zap className="w-5 h-5" /> },
              { id: 'card', label: 'Card', icon: <CreditCard className="w-5 h-5" /> },
              { id: 'invitation', label: 'Referral', icon: <Users className="w-5 h-5" /> },
              { id: 'me', label: 'Profile', icon: <UserCircle className="w-5 h-5" /> },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setNavView(item.id as any)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all group ${navView === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white'}`}
              >
                <div className={`${navView === item.id ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'} transition-colors`}>
                  {item.icon}
                </div>
                <span className="font-bold text-sm">{item.label}</span>
                {navView === item.id && (
                  <motion.div layoutId="sidebar-active" className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-8 border-t border-gray-100 dark:border-zinc-800">
            <button 
              onClick={() => setSettingsModalOpen(true)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white transition-all group"
            >
              <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
              <span className="font-bold text-sm">Settings</span>
            </button>
            <button 
              onClick={() => { onLogout(); setSettingsModalOpen(false); }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all mt-2"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-bold text-sm">Logout</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 relative overflow-hidden ${isMobile ? 'pb-24' : ''}`}>
        
        {/* Testimonials See All Modal */}
      <AnimatePresence>
        {showAllTestimonials && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAllTestimonials(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-8 shrink-0">
                <div>
                  <h3 className="font-black text-2xl uppercase tracking-tight">All Testimonials</h3>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-400 uppercase tracking-widest">What our community says</p>
                </div>
                <button onClick={() => setShowAllTestimonials(false)} className="p-3 bg-gray-100 dark:bg-zinc-800 rounded-2xl hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
                {testimonials.map((t) => (
                  <div key={t.id} className="bg-gray-50 dark:bg-zinc-800/50 p-6 rounded-3xl border border-gray-100 dark:border-zinc-700/50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xs">
                          {t.name.charAt(0)}
                        </div>
                        <h4 className="font-bold text-base">{t.name}</h4>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-zinc-300 text-sm leading-relaxed italic">"{t.text}"</p>
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold mt-4 uppercase tracking-widest">
                      {(() => {
                        if (t.createdAt) {
                          if (t.createdAt.toDate) {
                            return t.createdAt.toDate().toLocaleDateString();
                          } else {
                            return new Date(t.createdAt).toLocaleDateString();
                          }
                        } else {
                          return 'Just now';
                        }
                      })()}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 relative overflow-x-hidden">
        {/* Background Decorative Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse delay-700"></div>
        </div>

        <div className={`${navView === 'cards' ? 'max-w-full' : 'max-w-7xl'} mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 ${isMobile ? 'pb-32' : ''}`}>
          {/* Header Section */}
          <header className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-3">
              {isMobile && <Logo size="md" />}
              {navView !== 'home' && (
                <motion.button 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setNavView('home')}
                  className="p-2.5 bg-gray-100 dark:bg-zinc-800 rounded-2xl hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors mr-1 group"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                </motion.button>
              )}
              <div className={isMobile ? "hidden sm:block" : ""}>
                <h2 className="text-2xl font-black tracking-tighter leading-none capitalize">{navView === 'home' ? 'Dashboard' : navView}</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Welcome back, {(user.name || 'User').split(' ')[0]}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl mx-8">
              <div className="hidden md:flex items-center bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl px-4 py-2.5 shadow-sm w-full">
                <Search className="w-4 h-4 text-gray-400 mr-2" />
                <input 
                  type="text" 
                  placeholder="Search transactions..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm font-medium w-full" 
                />
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <button 
                onClick={() => setDark(!dark)} 
                className="p-3 bg-slate-900 dark:bg-zinc-900 border border-slate-800 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                {dark ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-white" />}
              </button>
              <button className="p-3 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 relative">
                <Bell className="w-5 h-5 text-gray-400" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900"></span>
              </button>
              <button 
                onClick={() => setProfileModalOpen(true)}
                className="flex items-center gap-2 p-1.5 pr-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xs overflow-hidden">
                  {user.profileImage ? <img src={user.profileImage} alt="" className="w-full h-full object-cover" /> : user.name.charAt(0)}
                </div>
                <span className="hidden sm:block text-sm font-black tracking-tight">{user.name}</span>
              </button>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={navView}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {navView === 'transactions' && (
          <main className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Transaction History</h3>
                <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Track your spending and income</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setTxShowFilters(!txShowFilters)}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-xs font-black uppercase tracking-widest shadow-sm transition-all ${txShowFilters ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800'}`}
                >
                  <Filter className="w-4 h-4" /> Filter
                </button>
                <button 
                  onClick={() => {
                    const doc = new jsPDF();
                    doc.setFontSize(20);
                    doc.text('SageVault Account Statement', 14, 22);
                    doc.setFontSize(11);
                    doc.text(`Name: ${user.name}`, 14, 30);
                    doc.text(`Account Number: ${user.accountNumber}`, 14, 35);
                    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 40);
                    
                    const processed = (transactions || []).map(tx => ({
                      ...tx,
                      displayAmount: tx.isCredit ? tx.amount : -tx.amount
                    }));

                    const filtered = processed.filter(tx => {
                      const matchesSearch = (tx.name || '').toLowerCase().includes(txSearchQuery.toLowerCase()) ||
                                           (tx.senderAccount || '').toLowerCase().includes(txSearchQuery.toLowerCase()) ||
                                           (tx.receiverAccount || '').toLowerCase().includes(txSearchQuery.toLowerCase()) ||
                                           (tx.type || '').toLowerCase().includes(txSearchQuery.toLowerCase()) ||
                                           (tx.amount.toString()).includes(txSearchQuery) ||
                                           (tx.ref || '').toLowerCase().includes(txSearchQuery.toLowerCase());
                      const matchesType = txFilterType === 'all' || (txFilterType === 'credit' && tx.isCredit) || (txFilterType === 'debit' && !tx.isCredit) || (txFilterType === 'transfer' && tx.type === 'transfer');
                      const matchesCategory = txFilterCategory === 'all' || tx.type === txFilterCategory;
                      const matchesStatus = txFilterStatus === 'all' || (tx.status || 'success') === txFilterStatus;
                      const txDate = tx.createdAt ? (tx.createdAt.toDate ? tx.createdAt.toDate() : new Date(tx.createdAt.seconds * 1000)) : null;
                      const matchesStartDate = !txStartDate || (txDate && txDate >= new Date(txStartDate));
                      const matchesEndDate = !txEndDate || (txDate && txDate <= new Date(txEndDate + 'T23:59:59'));
                      const matchesMinAmount = !txMinAmount || tx.amount >= parseFloat(txMinAmount);
                      const matchesMaxAmount = !txMaxAmount || tx.amount <= parseFloat(txMaxAmount);
                      return matchesSearch && matchesType && matchesCategory && matchesStatus && matchesStartDate && matchesEndDate && matchesMinAmount && matchesMaxAmount;
                    }).sort((a, b) => {
                      const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt.seconds * 1000)) : new Date(0);
                      const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt.seconds * 1000)) : new Date(0);
                      if (txSortBy === 'newest') return dateB.getTime() - dateA.getTime();
                      if (txSortBy === 'oldest') return dateA.getTime() - dateB.getTime();
                      if (txSortBy === 'highest') return b.amount - a.amount;
                      if (txSortBy === 'lowest') return a.amount - b.amount;
                      if (txSortBy === 'status') return (a.status || 'success').localeCompare(b.status || 'success');
                      return 0;
                    });

                    const tableData = filtered.map(tx => [
                      tx.createdAt ? (tx.createdAt.toDate ? tx.createdAt.toDate().toLocaleDateString() : new Date(tx.createdAt.seconds * 1000).toLocaleDateString()) : 'N/A',
                      tx.name || (tx.isCredit ? `Credit from ${tx.senderAccount}` : `Transfer to ${tx.receiverAccount}`),
                      tx.type || (tx.isCredit ? 'Credit' : 'Debit'),
                      `${tx.isCredit ? '+' : '-'}${symbol}${convert(tx.amount)}`,
                      tx.status || 'Completed'
                    ]);
                    
                    autoTable(doc, {
                      head: [['Date', 'Description', 'Type', 'Amount', 'Status']],
                      body: tableData,
                      startY: 50,
                      theme: 'grid',
                      headStyles: { fillColor: [99, 102, 241] },
                    });
                    doc.save(`SageVault_Statement_${user.accountNumber}.pdf`);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-600/20"
                >
                  <Download className="w-4 h-4" /> Export
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search by name, amount, or reference..."
                  value={txSearchQuery}
                  onChange={(e) => setTxSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all shadow-sm"
                />
              </div>

              <AnimatePresence>
                {txShowFilters && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 shadow-sm">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Transaction Type</label>
                        <select 
                          value={txFilterType}
                          onChange={(e) => setTxFilterType(e.target.value)}
                          className="w-full p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl outline-none font-bold"
                        >
                          <option value="all">All Types</option>
                          <option value="credit">Credits (Inflow)</option>
                          <option value="debit">Debits (Outflow)</option>
                          <option value="transfer">Transfers</option>
                          <option value="favorites">Favorites ⭐</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                        <select 
                          value={txFilterCategory}
                          onChange={(e) => setTxFilterCategory(e.target.value)}
                          className="w-full p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl outline-none font-bold"
                        >
                          <option value="all">All Categories</option>
                          <option value="transfer">Transfer</option>
                          <option value="airtime">Airtime</option>
                          <option value="data">Data</option>
                          <option value="tv">TV Subscription</option>
                          <option value="bill">Utility Bills</option>
                          <option value="card">Card Operations</option>
                          <option value="investment">Investment</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status</label>
                        <select 
                          value={txFilterStatus}
                          onChange={(e) => setTxFilterStatus(e.target.value)}
                          className="w-full p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl outline-none font-bold"
                        >
                          <option value="all">All Statuses</option>
                          <option value="success">Success</option>
                          <option value="pending">Pending</option>
                          <option value="failed">Failed</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date Range</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="date" 
                            value={txStartDate}
                            onChange={(e) => setTxStartDate(e.target.value)}
                            className="flex-1 p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl outline-none font-bold text-xs"
                          />
                          <span className="text-gray-400">to</span>
                          <input 
                            type="date" 
                            value={txEndDate}
                            onChange={(e) => setTxEndDate(e.target.value)}
                            className="flex-1 p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl outline-none font-bold text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Amount Range</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            placeholder="Min"
                            value={txMinAmount}
                            onChange={(e) => setTxMinAmount(e.target.value)}
                            className="flex-1 p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl outline-none font-bold text-xs"
                          />
                          <span className="text-gray-400">-</span>
                          <input 
                            type="number" 
                            placeholder="Max"
                            value={txMaxAmount}
                            onChange={(e) => setTxMaxAmount(e.target.value)}
                            className="flex-1 p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl outline-none font-bold text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sort By</label>
                        <select 
                          value={txSortBy}
                          onChange={(e) => setTxSortBy(e.target.value)}
                          className="w-full p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-xl outline-none font-bold"
                        >
                          <option value="newest">Newest First</option>
                          <option value="oldest">Oldest First</option>
                          <option value="highest">Highest Amount</option>
                          <option value="lowest">Lowest Amount</option>
                          <option value="status">Status</option>
                        </select>
                      </div>

                      <div className="md:col-span-2 lg:col-span-3 flex justify-end gap-3 pt-2">
                        <button 
                          onClick={() => {
                            setTxSearchQuery('');
                            setTxFilterType('all');
                            setTxFilterCategory('all');
                            setTxFilterStatus('all');
                            setTxStartDate('');
                            setTxEndDate('');
                            setTxMinAmount('');
                            setTxMaxAmount('');
                            setTxSortBy('newest');
                          }}
                          className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-red-500 transition-colors"
                        >
                          Reset Filters
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {(() => {
              const processed = (transactions || []).map(tx => ({
                ...tx,
                displayAmount: tx.isCredit ? tx.amount : -tx.amount
              }));

              const filtered = processed.filter(tx => {
                const matchesSearch = (tx.name || '').toLowerCase().includes(txSearchQuery.toLowerCase()) ||
                                     (tx.senderAccount || '').toLowerCase().includes(txSearchQuery.toLowerCase()) ||
                                     (tx.receiverAccount || '').toLowerCase().includes(txSearchQuery.toLowerCase()) ||
                                     (tx.type || '').toLowerCase().includes(txSearchQuery.toLowerCase()) ||
                                     (tx.amount.toString()).includes(txSearchQuery) ||
                                     (tx.ref || '').toLowerCase().includes(txSearchQuery.toLowerCase());
                const matchesType = txFilterType === 'all' || 
                                   (txFilterType === 'credit' && tx.isCredit) || 
                                   (txFilterType === 'debit' && !tx.isCredit) || 
                                   (txFilterType === 'transfer' && tx.type === 'transfer') ||
                                   (txFilterType === 'favorites' && tx.isFavorite);
                const matchesCategory = txFilterCategory === 'all' || tx.type === txFilterCategory;
                const matchesStatus = txFilterStatus === 'all' || (tx.status || 'success') === txFilterStatus;
                const txDate = tx.createdAt ? (tx.createdAt.toDate ? tx.createdAt.toDate() : new Date(tx.createdAt.seconds * 1000)) : null;
                const matchesStartDate = !txStartDate || (txDate && txDate >= new Date(txStartDate));
                const matchesEndDate = !txEndDate || (txDate && txDate <= new Date(txEndDate + 'T23:59:59'));
                const matchesMinAmount = !txMinAmount || tx.amount >= parseFloat(txMinAmount);
                const matchesMaxAmount = !txMaxAmount || tx.amount <= parseFloat(txMaxAmount);
                return matchesSearch && matchesType && matchesCategory && matchesStatus && matchesStartDate && matchesEndDate && matchesMinAmount && matchesMaxAmount;
              }).sort((a, b) => {
                const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt.seconds * 1000)) : new Date(0);
                const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt.seconds * 1000)) : new Date(0);
                if (txSortBy === 'newest') return dateB.getTime() - dateA.getTime();
                if (txSortBy === 'oldest') return dateA.getTime() - dateB.getTime();
                if (txSortBy === 'highest') return b.amount - a.amount;
                if (txSortBy === 'lowest') return a.amount - b.amount;
                if (txSortBy === 'status') return (a.status || 'success').localeCompare(b.status || 'success');
                return 0;
              });

              if (filtered.length === 0) {
                return (
                  <div className="bg-white dark:bg-zinc-900 p-12 rounded-[2rem] border border-gray-100 dark:border-zinc-800 text-center shadow-sm">
                    <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="font-black text-gray-400 uppercase tracking-widest text-xs">No transactions found matching your criteria</p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  <div className="flex justify-between items-center ml-2">
                    <h4 className="font-black text-sm uppercase tracking-widest text-gray-400">
                      {filtered.length === processed.length ? 'Full History' : `Filtered Results (${filtered.length})`}
                    </h4>
                  </div>
                  {filtered.map((tx, i) => (
                    <TransactionItem 
                      key={tx.id || i}
                      transaction={tx}
                      symbol={symbol}
                      convert={convert}
                      onClick={() => {
                        setSelectedTransaction(tx);
                        setTransactionDetailsModalOpen(true);
                      }}
                      onToggleFavorite={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(tx.id, tx.isFavorite);
                      }}
                    />
                  ))}
                </div>
              );
            })()}

            {/* Spending Flow Chart (Optional, keep it at bottom) */}
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black tracking-tight">Spending Analysis</h3>
                <div className="flex gap-4">
                   <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Inflow</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Outflow</span>
                  </div>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowData}>
                    <defs>
                      <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={dark ? '#333' : '#f0f0f0'} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#999' }} />
                    <YAxis hide />
                    <Tooltip />
                    <Area type="monotone" dataKey="income" stroke="#2563eb" fillOpacity={1} fill="url(#colorInflow)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </main>
        )}

        {navView === 'cards' && (
          <main className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black tracking-tight">My Cards</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Manage your virtual and physical cards</p>
              </div>
              <button onClick={() => setCardsModalOpen(true)} className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-600/20">
                Add New Card
              </button>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {user.virtualCard ? (
                <div className="space-y-6">
                  <motion.div 
                    className="aspect-[1.58/1] bg-gradient-to-br from-zinc-800 to-black rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full -mr-32 -mt-32"></div>
                    <div className="relative z-10 flex flex-col h-full justify-between">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-xs font-black uppercase tracking-widest opacity-60">Virtual Card</p>
                          <p className="text-lg font-bold">{user.virtualCard.cardType}</p>
                        </div>
                        <Logo size="sm" />
                      </div>
                      <div className="space-y-6">
                        <p className="text-3xl font-mono tracking-[0.25em] font-bold">{user.virtualCard.cardNumber}</p>
                        <div className="flex justify-between items-end">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Card Holder</p>
                            <p className="text-sm font-bold uppercase">{user.virtualCard.cardName}</p>
                          </div>
                          <div className="flex gap-8">
                            <div className="space-y-1 text-right">
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Expires</p>
                              <p className="text-sm font-bold">{user.virtualCard.expiry}</p>
                            </div>
                            <div className="space-y-1 text-right">
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">CVV</p>
                              <p className="text-sm font-bold">***</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  <div className="grid grid-cols-2 gap-4">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleFreezeCard} 
                      className="flex items-center justify-center gap-3 p-5 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all"
                    >
                      {user.virtualCard.isFrozen ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Lock className="w-5 h-5" />}
                      {user.virtualCard.isFrozen ? 'Unfreeze' : 'Freeze'}
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCardTopUpModalOpen(true)} 
                      className="flex items-center justify-center gap-3 p-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                    >
                      <Plus className="w-5 h-5" /> Top Up
                    </motion.button>
                  </div>
                </div>
              ) : (
                <div className="aspect-[1.58/1] bg-gray-100 dark:bg-zinc-800 rounded-[2.5rem] border-4 border-dashed border-gray-200 dark:border-zinc-700 flex flex-col items-center justify-center gap-6 text-gray-400">
                  <CreditCard className="w-16 h-16 opacity-20" />
                  <div className="text-center space-y-2">
                    <p className="font-black text-lg tracking-tight">No Active Cards</p>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-60">Create a virtual card to start spending</p>
                  </div>
                  <button onClick={() => setCardsModalOpen(true)} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20">Create Card</button>
                </div>
              )}

              <div className="space-y-6">
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
                  <h4 className="text-lg font-black tracking-tight mb-6">Card Settings</h4>
                  <div className="space-y-4">
                    {[
                      { label: 'Online Payments', active: true },
                      { label: 'International Spend', active: false },
                      { label: 'Contactless', active: true },
                    ].map((setting, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-zinc-800 rounded-2xl">
                        <span className="text-sm font-bold">{setting.label}</span>
                        <div className={`w-12 h-6 rounded-full relative transition-colors ${setting.active ? 'bg-blue-600' : 'bg-gray-300 dark:bg-zinc-700'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${setting.active ? 'left-7' : 'left-1'}`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </main>
        )}

        {navView === 'payments' && (
          <main className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black tracking-tight">Payments</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pay bills, buy airtime and more</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { label: 'Airtime', icon: <Smartphone />, action: () => setAirtimeModalOpen(true), desc: 'Top up your phone' },
                { label: 'Data', icon: <Globe />, action: () => setDataModalOpen(true), desc: 'Buy internet bundles' },
                { label: 'TV', icon: <Tv />, action: () => setTvModalOpen(true), desc: 'Cable TV subscriptions' },
                { label: 'Electricity', icon: <Zap />, action: () => setBillsModalOpen(true), desc: 'Utility bill payments' },
                { label: 'Betting', icon: <Gamepad2 />, action: () => setBettingModalOpen(true), desc: 'Fund your betting wallet' },
                { label: 'Education', icon: <BookOpen />, action: () => setBillsModalOpen(true), desc: 'School fees & exams' },
                { label: 'Schedule Payment', icon: <Calendar />, action: () => setNavView('me'), desc: 'Manage recurring payments' },
              ].map((item, i) => (
                <motion.button 
                  key={i}
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={item.action}
                  className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-lg transition-all text-left group"
                >
                  <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    {React.cloneElement(item.icon as React.ReactElement<any>, { className: "w-7 h-7" })}
                  </div>
                  <h4 className="text-lg font-black tracking-tight mb-1">{item.label}</h4>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.desc}</p>
                </motion.button>
              ))}
            </div>
          </main>
        )}

        {/* Transfer Modal */}
        <AnimatePresence>
          {transferModalOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setTransferModalOpen(false); resetTransferForm(); }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-[3rem] z-50 shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black tracking-tight">
                    {transferStep === 'details' ? 'Send Money' : transferStep === 'confirm' ? 'Confirm Details' : transferStep === 'success' ? 'Receipt' : 'Enter PIN'}
                  </h3>
                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setTransferModalOpen(false); resetTransferForm(); }} 
                    className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full"
                  >
                    <X className="w-6 h-6" />
                  </motion.button>
                </div>

                {transferStep === 'details' && (
                  <form onSubmit={handleTransferSubmit} className="space-y-6">
                    {recentRecipients.length > 0 && (
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Recent</label>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                          {recentRecipients.map((recipient, i) => (
                            <motion.button
                              key={i}
                              type="button"
                              whileHover={{ y: -4, scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                setBankName(recipient.bankName);
                                setAccountNumber(recipient.accountNumber);
                              }}
                              className="flex-shrink-0 flex flex-col items-center gap-2 p-4 bg-white dark:bg-zinc-800 rounded-[2rem] border border-gray-100 dark:border-zinc-700 min-w-[120px] shadow-sm hover:shadow-md transition-all group"
                            >
                              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                                <UserIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="text-center space-y-0.5">
                                <p className="text-[10px] font-black uppercase tracking-tight truncate w-24 text-zinc-900 dark:text-zinc-100">{recipient.accountName}</p>
                                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">{recipient.bankName}</p>
                                <p className="text-[8px] font-mono text-blue-500 font-bold">{recipient.accountNumber}</p>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Select Bank</label>
                      </div>
                      <select 
                        value={bankName}
                        onChange={e => setBankName(e.target.value)}
                        className="w-full p-4 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all duration-300 text-zinc-900 dark:text-zinc-100"
                        required
                      >
                        <option value="" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Choose a bank</option>
                        <option value="SageVault" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">SageVault (Free & Instant)</option>
                        <option value="Access Bank" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">Access Bank</option>
                        <option value="First Bank" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">First Bank</option>
                        <option value="GTBank">GTBank</option>
                        <option value="Zenith Bank">Zenith Bank</option>
                        <option value="UBA">UBA</option>
                        <option value="Kuda Bank">Kuda Bank</option>
                        <option value="Opay">Opay</option>
                        <option value="Palmpay">Palmpay</option>
                        <option value="Wema Bank">Wema Bank</option>
                        <option value="Moniepoint">Moniepoint</option>
                        <option value="Fidelity Bank">Fidelity Bank</option>
                        <option value="FCMB">FCMB</option>
                        <option value="Stanbic IBTC">Stanbic IBTC</option>
                        <option value="Union Bank">Union Bank</option>
                        <option value="Sterling Bank">Sterling Bank</option>
                        <option value="FairMoney">FairMoney</option>
                        <option value="Carbon">Carbon</option>
                        <option value="Providus Bank">Providus Bank</option>
                      </select>
                      
                      <motion.button 
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => {
                          setTransferModalOpen(false);
                          setNavView('me');
                        }}
                        className="w-full p-4 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all border border-blue-100 dark:border-blue-900/20"
                      >
                        <Users className="w-4 h-4" /> Use Saved Beneficiary
                      </motion.button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Account Number</label>
                      <div className="relative">
                        <input 
                          type="text"
                          maxLength={10}
                          placeholder="0123456789"
                          value={accountNumber}
                          onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                          className="w-full p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                          required
                        />
                        {isResolving && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            {resolvingBank && (
                              <span className="text-[10px] font-black text-blue-500 uppercase animate-pulse">
                                Checking {resolvingBank}...
                              </span>
                            )}
                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      {accountName && (
                        <motion.div 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 ml-1"
                        >
                          <p className="text-xs font-black text-emerald-500 uppercase tracking-tight">
                            {accountName}
                          </p>
                          {isVerifiedAccount && (
                            <div className="flex items-center gap-0.5 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase">Verified</span>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Amount ({symbol})</label>
                      <input 
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-full p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-2xl"
                        required
                      />
                      <div className="flex justify-between px-1">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Available: {symbol}{convert(user.balance)}</p>
                        {transferError && (
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-red-500 font-bold uppercase">{transferError}</p>
                            {(isRateLimited || isServiceError) && (
                              <button 
                                type="button"
                                onClick={() => {
                                  // Trigger resolution again by slightly changing and restoring account number
                                  const current = accountNumber;
                                  setAccountNumber('');
                                  setTimeout(() => setAccountNumber(current), 10);
                                  setIsServiceError(false);
                                  setIsRateLimited(false);
                                }}
                                className="text-[10px] text-blue-500 font-bold uppercase underline"
                              >
                                Retry
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Note (Optional)</label>
                      <input 
                        type="text"
                        placeholder="What's this for?"
                        value={transferNote}
                        onChange={e => setTransferNote(e.target.value)}
                        className="w-full p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                      />
                    </div>

                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isResolving || !accountName}
                      className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg shadow-xl transition-all disabled:opacity-50"
                    >
                      Continue
                    </motion.button>
                  </form>
                )}

                {transferStep === 'confirm' && (
                  <div className="space-y-8">
                    <div className="text-center space-y-2 mb-6">
                      <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4">
                        <ShieldCheck className="w-8 h-8" />
                      </div>
                      <h4 className="text-xl font-black tracking-tight">Confirm Transfer</h4>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Please verify the details below</p>
                    </div>

                    <div className="bg-gray-50 dark:bg-zinc-800 p-6 rounded-3xl space-y-4 border border-gray-100 dark:border-zinc-700">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Recipient</span>
                        <span className="font-black text-sm tracking-tight">{accountName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Bank</span>
                        <span className="font-black text-sm tracking-tight">{bankName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Account</span>
                        <span className="font-mono font-bold text-sm tracking-wider">{accountNumber}</span>
                      </div>
                      <div className="pt-4 border-t border-gray-200 dark:border-zinc-700 flex justify-between items-center">
                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Total Amount</span>
                        <span className="font-black text-2xl text-blue-600">{symbol}{convert(parseFloat(amount))}</span>
                      </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/20 flex gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                      <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400/80 leading-relaxed uppercase tracking-tight">
                        Please ensure the recipient details are correct. Transfers are instant and irreversible.
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setTransferStep('details')}
                        className="flex-1 py-5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 rounded-2xl font-black uppercase tracking-widest text-xs"
                      >
                        Back
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.02, backgroundColor: '#1d4ed8' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setTransferStep('pin')}
                        className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-600/20"
                      >
                        Confirm & Send
                      </motion.button>
                    </div>
                  </div>
                )}

                {transferStep === 'pin' && (
                  <form onSubmit={verifyPinAndSend} className="space-y-8">
                    <div className="text-center space-y-2">
                      <p className="text-gray-500 font-medium">Enter your 4-digit transaction PIN to authorize this action.</p>
                      <input 
                        type="password"
                        maxLength={4}
                        autoFocus
                        className="w-full max-w-[200px] mx-auto p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl text-center text-3xl font-black tracking-[1em] focus:ring-2 focus:ring-blue-500 outline-none transition-all mt-4"
                        placeholder="••••"
                        value={transferPin}
                        onChange={e => setTransferPin(e.target.value.replace(/\D/g, ''))}
                        required
                      />
                      {transferError && <p className="text-xs text-red-500 font-bold uppercase mt-2">{transferError}</p>}
                    </div>

                    <div className="flex gap-4">
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setTransferStep(transferModalOpen ? 'confirm' : 'details')}
                        className="flex-1 py-5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 rounded-2xl font-black"
                      >
                        Back
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.02, backgroundColor: '#059669' }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="flex-1 py-5 bg-emerald-600 text-white rounded-2xl font-black shadow-lg"
                      >
                        Authorize
                      </motion.button>
                    </div>
                  </form>
                )}

                {transferStep === 'success' && lastTransaction && (
                  <TransactionSuccessScreen 
                    transaction={lastTransaction}
                    symbol={symbol}
                    convert={convert}
                    onClose={() => { setTransferModalOpen(false); resetTransferForm(); }}
                    showToast={showToast}
                  />
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Airtime Modal */}
        <AnimatePresence>
          {airtimeModalOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setAirtimeModalOpen(false); resetTransferForm(); }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-[3rem] z-50 shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black tracking-tight">{transferStep === 'details' ? 'Buy Airtime' : transferStep === 'success' ? 'Receipt' : 'Enter PIN'}</h3>
                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setAirtimeModalOpen(false); resetTransferForm(); }} 
                    className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full"
                  >
                    <X className="w-6 h-6" />
                  </motion.button>
                </div>

                {transferStep === 'details' ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                      <input 
                        type="text"
                        maxLength={11}
                        placeholder="08012345678"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        className="w-full p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Network</label>
                      <select 
                        value={network}
                        onChange={e => setNetwork(e.target.value)}
                        className="w-full p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                        required
                      >
                        <option value="">Select Network</option>
                        <option value="MTN">MTN</option>
                        <option value="Glo">Glo</option>
                        <option value="Airtel">Airtel</option>
                        <option value="9mobile">9mobile</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Amount</label>
                      <input 
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-full p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                        required
                      />
                      {transferError && <p className="text-[10px] text-red-500 font-bold uppercase">{transferError}</p>}
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.02, backgroundColor: '#7e22ce' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleActionSubmit('Airtime')}
                      className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black text-lg shadow-xl transition-all"
                    >
                      Continue
                    </motion.button>
                  </div>
                ) : transferStep === 'success' && lastTransaction ? (
                  <TransactionSuccessScreen 
                    transaction={lastTransaction}
                    symbol={symbol}
                    convert={convert}
                    onClose={() => { setAirtimeModalOpen(false); resetTransferForm(); }}
                    showToast={showToast}
                  />
                ) : (
                  <form onSubmit={verifyPinAndSend} className="space-y-8">
                    <div className="text-center space-y-2">
                      <p className="text-gray-500 font-medium">Enter PIN to authorize ₦{amount} airtime for {phoneNumber}</p>
                      <input 
                        type="password"
                        maxLength={4}
                        autoFocus
                        className="w-full max-w-[200px] mx-auto p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl text-center text-3xl font-black tracking-[1em] focus:ring-2 focus:ring-blue-500 outline-none transition-all mt-4 text-zinc-900 dark:text-zinc-100"
                        placeholder="••••"
                        value={transferPin}
                        onChange={e => setTransferPin(e.target.value.replace(/\D/g, ''))}
                        required
                      />
                      <div className="mt-4">
                        <button 
                          type="button"
                          onClick={() => {
                            setPinResetStep('request');
                            setPinResetEmail(user.email || '');
                            setIsPinResetModalOpen(true);
                          }}
                          className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                        >
                          Forgot PIN?
                        </button>
                      </div>
                      {transferError && <p className="text-xs text-red-500 font-bold uppercase mt-2">{transferError}</p>}
                    </div>
                    <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black shadow-lg">Authorize</button>
                  </form>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Data Modal */}
        <AnimatePresence>
          {dataModalOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setDataModalOpen(false); resetTransferForm(); }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-[3rem] z-50 shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black tracking-tight">{transferStep === 'details' ? 'Buy Data' : transferStep === 'success' ? 'Receipt' : 'Enter PIN'}</h3>
                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setDataModalOpen(false); resetTransferForm(); }} 
                    className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full"
                  >
                    <X className="w-6 h-6" />
                  </motion.button>
                </div>

                {transferStep === 'details' ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                      <input 
                        type="text"
                        maxLength={11}
                        placeholder="08012345678"
                        value={phoneNumber}
                        onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        className="w-full p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Network</label>
                      <select 
                        value={network}
                        onChange={e => setNetwork(e.target.value)}
                        className="w-full p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                        required
                      >
                        <option value="">Select Network</option>
                        <option value="MTN">MTN</option>
                        <option value="Glo">Glo</option>
                        <option value="Airtel">Airtel</option>
                        <option value="9mobile">9mobile</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Data Plan</label>
                      <select 
                        value={dataPlan}
                        onChange={e => {
                          setDataPlan(e.target.value);
                          setAmount((e.target.value || '').split('-')[1] || '');
                        }}
                        className="w-full p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                        required
                      >
                        <option value="">Select Plan</option>
                        <option value="1GB-500">1GB - ₦500</option>
                        <option value="2GB-1000">2GB - ₦1,000</option>
                        <option value="5GB-2500">5GB - ₦2,500</option>
                        <option value="10GB-4500">10GB - ₦4,500</option>
                      </select>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.02, backgroundColor: '#059669' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleActionSubmit('Data')}
                      className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-xl transition-all"
                    >
                      Continue
                    </motion.button>
                  </div>
                ) : transferStep === 'success' && lastTransaction ? (
                  <TransactionSuccessScreen 
                    transaction={lastTransaction}
                    symbol={symbol}
                    convert={convert}
                    onClose={() => { setDataModalOpen(false); resetTransferForm(); }}
                    showToast={showToast}
                  />
                ) : (
                  <form onSubmit={verifyPinAndSend} className="space-y-8">
                    <div className="text-center space-y-2">
                      <p className="text-gray-500 font-medium">Enter PIN to authorize {(dataPlan || '').split('-')[0]} data for {phoneNumber}</p>
                      <input 
                        type="password"
                        maxLength={4}
                        autoFocus
                        className="w-full max-w-[200px] mx-auto p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl text-center text-3xl font-black tracking-[1em] focus:ring-2 focus:ring-blue-500 outline-none transition-all mt-4 text-zinc-900 dark:text-zinc-100"
                        placeholder="••••"
                        value={transferPin}
                        onChange={e => setTransferPin(e.target.value.replace(/\D/g, ''))}
                        required
                      />
                      <div className="mt-4">
                        <button 
                          type="button"
                          onClick={() => {
                            setPinResetStep('request');
                            setPinResetEmail(user.email || '');
                            setIsPinResetModalOpen(true);
                          }}
                          className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                        >
                          Forgot PIN?
                        </button>
                      </div>
                      {transferError && <p className="text-xs text-red-500 font-bold uppercase mt-2">{transferError}</p>}
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.02, backgroundColor: '#059669' }}
                      whileTap={{ scale: 0.98 }}
                      type="submit" 
                      className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black shadow-lg transition-all"
                    >
                      Authorize
                    </motion.button>
                  </form>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* TV Modal */}
        <AnimatePresence>
          {tvModalOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setTvModalOpen(false); resetTransferForm(); }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-[3rem] z-50 shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black tracking-tight">{transferStep === 'details' ? 'TV Subscription' : transferStep === 'success' ? 'Receipt' : 'Enter PIN'}</h3>
                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setTvModalOpen(false); resetTransferForm(); }} 
                    className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full"
                  >
                    <X className="w-6 h-6" />
                  </motion.button>
                </div>

                {transferStep === 'details' ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Service Provider</label>
                      <select 
                        value={serviceProvider}
                        onChange={e => setServiceProvider(e.target.value)}
                        className="w-full p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                        required
                      >
                        <option value="">Select Provider</option>
                        <option value="DStv">DStv</option>
                        <option value="GOtv">GOtv</option>
                        <option value="StarTimes">StarTimes</option>
                        <option value="Showmax">Showmax</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Smart Card / IUC Number</label>
                      <input 
                        type="text"
                        placeholder="1234567890"
                        value={customerRef}
                        onChange={e => setCustomerRef(e.target.value)}
                        className="w-full p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Amount</label>
                      <input 
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-full p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                        required
                      />
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.02, backgroundColor: '#ea580c' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleActionSubmit('TV')}
                      className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black text-lg shadow-xl transition-all"
                    >
                      Continue
                    </motion.button>
                  </div>
                ) : transferStep === 'success' && lastTransaction ? (
                  <TransactionSuccessScreen 
                    transaction={lastTransaction}
                    symbol={symbol}
                    convert={convert}
                    onClose={() => { setTvModalOpen(false); resetTransferForm(); }}
                    showToast={showToast}
                  />
                ) : (
                  <form onSubmit={verifyPinAndSend} className="space-y-8">
                    <div className="text-center space-y-2">
                      <p className="text-gray-500 font-medium">Enter PIN to authorize ₦{amount} {serviceProvider} subscription</p>
                      <input 
                        type="password"
                        maxLength={4}
                        autoFocus
                        className="w-full max-w-[200px] mx-auto p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl text-center text-3xl font-black tracking-[1em] focus:ring-2 focus:ring-blue-500 outline-none transition-all mt-4 text-zinc-900 dark:text-zinc-100"
                        placeholder="••••"
                        value={transferPin}
                        onChange={e => setTransferPin(e.target.value.replace(/\D/g, ''))}
                        required
                      />
                      <div className="mt-4">
                        <button 
                          type="button"
                          onClick={() => {
                            setPinResetStep('request');
                            setPinResetEmail(user.email || '');
                            setIsPinResetModalOpen(true);
                          }}
                          className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                        >
                          Forgot PIN?
                        </button>
                      </div>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.02, backgroundColor: '#059669' }}
                      whileTap={{ scale: 0.98 }}
                      type="submit" 
                      className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black shadow-lg transition-all"
                    >
                      Authorize
                    </motion.button>
                  </form>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Bills Modal */}
        <AnimatePresence>
          {billsModalOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setBillsModalOpen(false); resetTransferForm(); }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-[3rem] z-50 shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black tracking-tight">{transferStep === 'details' ? 'Pay Bills' : transferStep === 'success' ? 'Receipt' : 'Enter PIN'}</h3>
                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setBillsModalOpen(false); resetTransferForm(); }} 
                    className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full"
                  >
                    <X className="w-6 h-6" />
                  </motion.button>
                </div>

                {transferStep === 'details' ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Bill Category</label>
                      <select 
                        value={billType}
                        onChange={e => setBillType(e.target.value)}
                        className="w-full p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 font-bold"
                        required
                      >
                        <option value="">Select Category</option>
                        <option value="Electricity">Electricity</option>
                        <option value="Water">Water</option>
                        <option value="Betting">Betting</option>
                        <option value="Travel">Travel (Flight Tickets)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Customer Reference / ID</label>
                      <input 
                        type="text"
                        placeholder="Enter ID"
                        value={customerRef}
                        onChange={e => setCustomerRef(e.target.value)}
                        className="w-full p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 font-bold"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Amount</label>
                      <input 
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-full p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 font-bold"
                        required
                      />
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.02, backgroundColor: '#dc2626' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleActionSubmit('Bill')}
                      className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-lg shadow-xl transition-all"
                    >
                      Continue
                    </motion.button>
                  </div>
                ) : transferStep === 'success' && lastTransaction ? (
                  <TransactionSuccessScreen 
                    transaction={lastTransaction}
                    symbol={symbol}
                    convert={convert}
                    onClose={() => { setBillsModalOpen(false); resetTransferForm(); }}
                    showToast={showToast}
                  />
                ) : (
                  <form onSubmit={verifyPinAndSend} className="space-y-8">
                    <div className="text-center space-y-2">
                      <p className="text-gray-500 font-medium">Enter PIN to authorize ₦{amount} {billType} payment</p>
                      <input 
                        type="password"
                        maxLength={4}
                        autoFocus
                        className="w-full max-w-[200px] mx-auto p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl text-center text-3xl font-black tracking-[1em] focus:ring-2 focus:ring-blue-500 outline-none transition-all mt-4 text-zinc-900 dark:text-zinc-100"
                        placeholder="••••"
                        value={transferPin}
                        onChange={e => setTransferPin(e.target.value.replace(/\D/g, ''))}
                        required
                      />
                      <div className="mt-4">
                        <button 
                          type="button"
                          onClick={() => {
                            setPinResetStep('request');
                            setPinResetEmail(user.email || '');
                            setIsPinResetModalOpen(true);
                          }}
                          className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                        >
                          Forgot PIN?
                        </button>
                      </div>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.02, backgroundColor: '#059669' }}
                      whileTap={{ scale: 0.98 }}
                      type="submit" 
                      className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black shadow-lg transition-all"
                    >
                      Authorize
                    </motion.button>
                  </form>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Cards Modal */}
        <AnimatePresence>
          {cardsModalOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setCardsModalOpen(false); resetTransferForm(); }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-[3rem] z-50 shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black tracking-tight">{transferStep === 'details' ? 'Create Virtual Card' : transferStep === 'success' ? 'Receipt' : 'Enter PIN'}</h3>
                  <motion.button 
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => { setCardsModalOpen(false); resetTransferForm(); }} 
                    className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full"
                  >
                    <X className="w-6 h-6" />
                  </motion.button>
                </div>

                {transferStep === 'details' ? (
                  <div className="space-y-6">
                    <div className="bg-indigo-600 p-6 rounded-3xl text-white relative overflow-hidden mb-4">
                      <div className="relative z-10">
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Virtual Card Preview</p>
                        <h4 className="text-xl font-black mt-4 tracking-widest">**** **** **** 1234</h4>
                        <div className="flex justify-between items-end mt-8">
                          <div>
                            <p className="text-[8px] uppercase opacity-60">Card Holder</p>
                            <p className="text-sm font-bold uppercase">{cardName || user.name}</p>
                          </div>
                          <p className="text-sm font-bold">12/28</p>
                        </div>
                      </div>
                      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Card Holder Name</label>
                      <input 
                        type="text"
                        placeholder="Enter full name"
                        value={cardName}
                        onChange={e => setCardName(e.target.value)}
                        className="w-full p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Card Type</label>
                      <select 
                        value={cardType}
                        onChange={e => setCardType(e.target.value)}
                        className="w-full p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                        required
                      >
                        <option value="Virtual Visa">Virtual Visa</option>
                        <option value="Virtual Mastercard">Virtual Mastercard</option>
                      </select>
                    </div>
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl">
                      <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Creation Fee: ₦5,000</p>
                    </div>
                    <button 
                      onClick={() => handleActionSubmit('Card')}
                      className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl"
                    >
                      Create Card
                    </button>
                  </div>
                ) : transferStep === 'success' && lastTransaction ? (
                  <TransactionSuccessScreen 
                    transaction={lastTransaction}
                    symbol={symbol}
                    convert={convert}
                    onClose={() => { setCardsModalOpen(false); resetTransferForm(); }}
                    showToast={showToast}
                  />
                ) : (
                  <form onSubmit={verifyPinAndSend} className="space-y-8">
                    <div className="text-center space-y-2">
                      <p className="text-gray-500 font-medium">Enter PIN to authorize ₦5,000 card creation fee</p>
                      <input 
                        type="password"
                        maxLength={4}
                        autoFocus
                        className="w-full max-w-[200px] mx-auto p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl text-center text-3xl font-black tracking-[1em] focus:ring-2 focus:ring-blue-500 outline-none transition-all mt-4 text-zinc-900 dark:text-zinc-100"
                        placeholder="••••"
                        value={transferPin}
                        onChange={e => setTransferPin(e.target.value.replace(/\D/g, ''))}
                        required
                      />
                      <div className="mt-4">
                        <button 
                          type="button"
                          onClick={() => {
                            setPinResetStep('request');
                            setPinResetEmail(user.email || '');
                            setIsPinResetModalOpen(true);
                          }}
                          className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                        >
                          Forgot PIN?
                        </button>
                      </div>
                    </div>
                    <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black shadow-lg">Authorize</button>
                  </form>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Transaction Success Screen Modal */}
        <AnimatePresence>
          {receiptModalOpen && lastTransaction && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setReceiptModalOpen(false);
                  setNavView('home');
                }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative z-10 bg-white dark:bg-zinc-900 w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl p-8"
              >
                <TransactionSuccessScreen 
                  transaction={lastTransaction}
                  symbol={symbol}
                  convert={convert}
                  onClose={() => {
                    setReceiptModalOpen(false);
                    setNavView('home');
                  }}
                  showToast={showToast}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Settings Modal */}
      <AnimatePresence>
        {settingsModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSettingsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <Logo size="sm" />
                  <h3 className="text-2xl font-black tracking-tight">Settings</h3>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSettingsModalOpen(false)} 
                  className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                    <UserCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-black text-sm">{user.name}</p>
                    <p className="text-xs text-gray-400 font-bold">{user.phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <motion.button 
                    whileHover={{ x: 5, backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setDark(!dark); setSettingsModalOpen(false); }}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-2xl transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-800 dark:bg-blue-900/10 rounded-lg">
                        {dark ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-white" />}
                      </div>
                      <span className="font-bold text-sm">Theme Mode</span>
                    </div>
                    <span className="text-xs font-black text-white dark:text-blue-400 bg-slate-900 dark:bg-transparent px-2 py-1 rounded-lg uppercase tracking-widest">{dark ? 'Light' : 'Dark'}</span>
                  </motion.button>

                  <motion.button 
                    whileHover={{ x: 5, backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-2xl transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg">
                        <Lock className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="font-bold text-sm">Security & PIN</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-600 transition-colors" />
                  </motion.button>

                  <motion.button 
                    whileHover={{ x: 5, backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-2xl transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                        <Smartphone className="w-4 h-4 text-orange-600" />
                      </div>
                      <span className="font-bold text-sm">Authorized Devices</span>
                    </div>
                    <span className="text-xs font-black text-orange-600 uppercase tracking-widest">
                      {user.authorizedDevices?.length || 1} Active
                    </span>
                  </motion.button>

                  <motion.button 
                    whileHover={{ x: 5, backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-2xl transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg">
                        <Bell className="w-4 h-4 text-indigo-600" />
                      </div>
                      <span className="font-bold text-sm">Notifications</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-600 transition-colors" />
                  </motion.button>

                  <div className="pt-4 mt-4 border-t border-gray-100 dark:border-zinc-800">
                    <motion.button 
                      whileHover={{ x: 5, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { onLogout(); setSettingsModalOpen(false); }}
                      className="w-full p-4 flex items-center gap-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="font-black text-sm uppercase tracking-widest">Logout Session</span>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Transaction History Modal */}
      <TransactionHistoryModal 
        open={transactionHistoryModalOpen}
        onClose={() => setTransactionHistoryModalOpen(false)}
        transactions={transactions}
        user={user}
        currency={currency}
        convert={convert}
        symbol={symbol}
        dark={dark}
        setSelectedTransaction={setSelectedTransaction}
        setTransactionDetailsModalOpen={setTransactionDetailsModalOpen}
      />

      {/* Transaction Details Modal */}
      <TransactionDetailsModal 
        open={transactionDetailsModalOpen}
        onClose={() => setTransactionDetailsModalOpen(false)}
        transaction={selectedTransaction}
        symbol={symbol}
        convert={convert}
        dark={dark}
      />

      {/* Profile Modal */}
      <ProfileModal 
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={user}
        onUpdateUser={onUpdateUser}
        dark={dark}
      />

      {/* Recurring Payments Modal */}
      <SearchUsersModal 
        open={searchUsersModalOpen}
        onClose={() => setSearchUsersModalOpen(false)}
        onSelect={(u) => {
          setBankName('SageVault');
          setAccountNumber(u.accountNumber);
          setAccountName(u.name);
          setSearchUsersModalOpen(false);
        }}
        dark={dark}
      />

      <RecurringPaymentsModal 
        open={recurringPaymentsModalOpen}
        onClose={() => setRecurringPaymentsModalOpen(false)}
        payments={recurringPayments}
        onAdd={handleAddRecurringPayment}
        onDelete={handleDeleteRecurringPayment}
        symbol={symbol}
        convert={convert}
        dark={dark}
      />

      {/* Help Modal */}
      <HelpModal 
        open={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        dark={dark}
      />

      {/* Upgrade Modal */}
      <UpgradeModal 
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        user={user}
        onUpdateUser={onUpdateUser}
        dark={dark}
      />

      <PinResetModal 
        isOpen={isPinResetModalOpen}
        onClose={() => setIsPinResetModalOpen(false)}
        user={user}
        step={pinResetStep}
        setStep={setPinResetStep}
        email={pinResetEmail}
        setEmail={setPinResetEmail}
        otp={pinResetOTP}
        setOtp={setPinResetOTP}
        newPin={pinResetNewPin}
        setNewPin={setPinResetNewPin}
        generatedOtp={generatedOTP}
        setGeneratedOtp={setGeneratedOTP}
      />

      {/* Investment Modal */}
      <AnimatePresence>
        {investmentModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setInvestmentModalOpen(false);
                setSelectedInvestmentPlan(null);
                setInvestmentAgreementAccepted(false);
                setInvestmentModalTab('plans');
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative bg-white dark:bg-zinc-900 w-full max-w-xl rounded-t-[3rem] sm:rounded-[3rem] p-8 sm:p-10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-8 shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center shadow-inner">
                    <TrendingUp className="w-7 h-7 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight leading-none">Investment</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Grow your wealth</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setInvestmentModalTab(investmentModalTab === 'plans' ? 'my-investments' : 'plans')}
                    className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors flex items-center gap-2"
                    title={investmentModalTab === 'plans' ? 'View My Investments' : 'View Investment Plans'}
                  >
                    {investmentModalTab === 'plans' ? <UserCircle className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">
                      {investmentModalTab === 'plans' ? 'My Portfolio' : 'Plans'}
                    </span>
                  </button>
                  <button 
                    onClick={() => {
                      setInvestmentModalOpen(false);
                      setSelectedInvestmentPlan(null);
                      setInvestmentAgreementAccepted(false);
                      setInvestmentModalTab('plans');
                    }} 
                    className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-2xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-8 pr-2 scrollbar-hide">
                {investmentModalTab === 'plans' ? (
                  <>
                    {!selectedInvestmentPlan ? (
                      <div className="grid grid-cols-1 gap-4">
                        {[
                          { id: 'saving-go', title: 'Saving GO', roi: '15% p.a', desc: 'High-yield flexible savings for your goals.', icon: <Wallet className="w-6 h-6" />, color: 'from-emerald-500 to-teal-600' },
                          { id: 'fixed-income', title: 'Fixed Income', roi: '12% p.a', desc: 'Secure returns with fixed tenure investments.', icon: <ShieldCheck className="w-6 h-6" />, color: 'from-blue-500 to-indigo-600' },
                          { id: 'mutual-funds', title: 'Mutual Funds', roi: '18% p.a', desc: 'Professional managed diversified portfolios.', icon: <Layers className="w-6 h-6" />, color: 'from-purple-500 to-pink-600' },
                          { id: 'real-estate', title: 'Real Estate', roi: '25% p.a', desc: 'Fractional ownership in prime properties.', icon: <Home className="w-6 h-6" />, color: 'from-amber-500 to-orange-600' },
                          { id: 'stock-market', title: 'Stock Market', roi: '20% p.a', desc: 'Invest in top-performing global companies.', icon: <Activity className="w-6 h-6" />, color: 'from-red-500 to-rose-600' },
                        ].map((plan) => (
                          <button
                            key={plan.id}
                            onClick={() => setSelectedInvestmentPlan(plan)}
                            className="group relative bg-gray-50 dark:bg-zinc-800/50 p-6 rounded-[2rem] border border-gray-100 dark:border-zinc-700/50 hover:border-indigo-500 transition-all text-left flex items-center gap-6 overflow-hidden"
                          >
                            <div className={`w-16 h-16 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform shrink-0`}>
                              {plan.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <h4 className="font-black text-lg tracking-tight">{plan.title}</h4>
                                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full uppercase tracking-widest">{plan.roi}</span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium leading-relaxed">{plan.desc}</p>
                            </div>
                            <ChevronRight className="w-6 h-6 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                      >
                        <button 
                          onClick={() => setSelectedInvestmentPlan(null)}
                          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          <ArrowLeft className="w-3 h-3" /> Back to Plans
                        </button>

                        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/20">
                          <div className="flex items-center gap-4 mb-4">
                            <div className={`w-12 h-12 bg-gradient-to-br ${selectedInvestmentPlan.color} rounded-xl flex items-center justify-center text-white shadow-md`}>
                              {selectedInvestmentPlan.icon}
                            </div>
                            <div>
                              <h4 className="font-black text-xl tracking-tight">{selectedInvestmentPlan.title}</h4>
                              <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Expected ROI: {selectedInvestmentPlan.roi}</p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed font-medium">
                            {selectedInvestmentPlan.desc} This plan is designed for long-term growth and stability. Your capital is managed by certified financial experts.
                          </p>
                        </div>

                        <div className="space-y-4">
                          <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Investment Amount</label>
                          <div className="flex items-center bg-gray-50 dark:bg-zinc-800 border-2 border-transparent rounded-[2rem] focus-within:bg-white dark:focus-within:bg-zinc-900 focus-within:border-indigo-500 transition-all overflow-hidden group">
                            <div className="ml-5 w-10 h-10 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-zinc-800 group-focus-within:border-indigo-500 transition-colors">
                              <span className="font-black text-emerald-500 group-focus-within:text-indigo-500 transition-colors">₦</span>
                            </div>
                            <input 
                              type="number"
                              value={investmentAmount}
                              onChange={(e) => {
                                setInvestmentAmount(e.target.value);
                                setInvestmentError('');
                              }}
                              placeholder="0.00"
                              className="w-full bg-transparent border-none py-5 pl-3 pr-6 font-black text-xl outline-none"
                            />
                          </div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Balance: {symbol}{convert(user.balance)}</p>
                        </div>

                        <div className="bg-gray-50 dark:bg-zinc-800/50 p-6 rounded-[2rem] border border-gray-100 dark:border-zinc-700/50 space-y-4">
                          <h5 className="font-black text-xs uppercase tracking-widest">Investment Agreement</h5>
                          <div className="text-[10px] text-gray-500 dark:text-zinc-400 leading-relaxed font-medium h-32 overflow-y-auto pr-2 scrollbar-hide border-b border-gray-100 dark:border-zinc-700 pb-4">
                            By proceeding, you agree that SageVault will manage your funds according to the selected plan's strategy. You understand that investments carry risks and past performance does not guarantee future results. Withdrawals before the maturity date may attract a 5% penalty fee. You authorize SageVault to debit your account for the specified amount.
                          </div>
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                              <input 
                                type="checkbox" 
                                checked={investmentAgreementAccepted}
                                onChange={(e) => {
                                  setInvestmentAgreementAccepted(e.target.checked);
                                  setInvestmentError('');
                                }}
                                className="sr-only"
                              />
                              <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${investmentAgreementAccepted ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 dark:border-zinc-600'}`}>
                                {investmentAgreementAccepted && <Check className="w-4 h-4 text-white" />}
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-gray-600 dark:text-zinc-400 uppercase tracking-widest group-hover:text-indigo-600 transition-colors">I accept the investment terms & conditions</span>
                          </label>
                        </div>

                        {investmentError && (
                          <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20">
                            <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center">{investmentError}</p>
                          </div>
                        )}

                        <motion.button
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          disabled={isInvestmentProcessing || !investmentAmount || !investmentAgreementAccepted}
                          onClick={async () => {
                            const amt = parseFloat(investmentAmount);
                            if (isNaN(amt) || amt <= 0) {
                              setInvestmentError('Enter a valid amount');
                              return;
                            }
                            if (amt > user.balance) {
                              setInvestmentError('Insufficient Balance');
                              return;
                            }
                            if (amt < 1000) {
                              setInvestmentError('Min investment is 1,000');
                              return;
                            }
                            if (!investmentAgreementAccepted) {
                              setInvestmentError('Please accept the agreement');
                              return;
                            }
                            
                            setIsInvestmentProcessing(true);
                            setInvestmentError('');
                            
                            try {
                              const userRef = doc(db, 'users', user.uid!);
                              await runTransaction(db, async (transaction) => {
                                const userDoc = await transaction.get(userRef);
                                if (!userDoc.exists()) throw "User not found";
                                const userData = userDoc.data() as User;
                                
                                if (userData.balance < amt) throw "Insufficient balance";
                                
                                // Check limits
                                const now = new Date();
                                let lastReset;
                                if (userData.lastSpentReset) {
                                  if (userData.lastSpentReset.toDate) {
                                    lastReset = userData.lastSpentReset.toDate();
                                  } else {
                                    lastReset = new Date(userData.lastSpentReset);
                                  }
                                } else {
                                  lastReset = new Date(0);
                                }
                                
                                let dailySpent = 0;
                                if (userData.dailySpent) {
                                  dailySpent = userData.dailySpent;
                                }
                                
                                let monthlySpent = 0;
                                if (userData.monthlySpent) {
                                  monthlySpent = userData.monthlySpent;
                                }
                                
                                if (now.toDateString() !== lastReset.toDateString()) {
                                  dailySpent = 0;
                                }
                                if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
                                  monthlySpent = 0;
                                }
                                
                                let userTier = 1;
                                if (userData.tier) {
                                  userTier = userData.tier;
                                }
                                const limits = TIER_LIMITS[userTier];
                                if (dailySpent + amt > limits.daily) {
                                  throw `Daily limit exceeded! Max: ${symbol}${convert(limits.daily)}. You have ${symbol}${convert(limits.daily - dailySpent)} left for today.`;
                                }
                                if (monthlySpent + amt > limits.monthly) {
                                  throw `Monthly limit exceeded! Max: ${symbol}${convert(limits.monthly)}. You have ${symbol}${convert(limits.monthly - monthlySpent)} left for this month.`;
                                }
                                
                                const newInvestment = {
                                  id: Math.random().toString(36).substring(2, 10).toUpperCase(),
                                  planId: selectedInvestmentPlan.id,
                                  planTitle: selectedInvestmentPlan.title,
                                  amount: amt,
                                  roi: selectedInvestmentPlan.roi,
                                  date: new Date(),
                                  status: 'active' as const,
                                  progress: 0
                                };
                                
                                transaction.update(userRef, {
                                  balance: userData.balance - amt,
                                  dailySpent: dailySpent + amt,
                                  monthlySpent: monthlySpent + amt,
                                  lastSpentReset: serverTimestamp(),
                                  investments: arrayUnion(newInvestment)
                                });
                                
                                const transRef = doc(collection(db, 'transactions'));
                                transaction.set(transRef, {
                                  uid: user.uid,
                                  senderUid: user.uid,
                                  senderAccount: userData.accountNumber,
                                  receiverAccount: 'INVESTMENT',
                                  type: 'investment',
                                  name: `Invested in ${selectedInvestmentPlan.title}`,
                                  amount: amt,
                                  createdAt: serverTimestamp(),
                                  status: 'success',
                                  details: {
                                    plan: selectedInvestmentPlan.title,
                                    roi: selectedInvestmentPlan.roi,
                                    ref: `INV-${newInvestment.id}`
                                  }
                                });
                                
                                setLastTransaction({
                                  type: 'investment',
                                  name: `Invested in ${selectedInvestmentPlan.title}`,
                                  amount: -amt,
                                  date: 'Just now',
                                  details: {
                                    plan: selectedInvestmentPlan.title,
                                    roi: selectedInvestmentPlan.roi,
                                    ref: `INV-${newInvestment.id}`
                                  },
                                  icon: (
                                    <div className={`w-full h-full bg-gradient-to-br ${selectedInvestmentPlan.color} rounded-2xl flex items-center justify-center text-white p-2`}>
                                      {selectedInvestmentPlan.icon}
                                    </div>
                                  )
                                });
                              });
                              
                              setIsInvestmentProcessing(false);
                              setInvestmentModalOpen(false);
                              setReceiptModalOpen(true);
                              setSelectedInvestmentPlan(null);
                              setInvestmentAmount('');
                              setInvestmentAgreementAccepted(false);
                              setInvestmentModalTab('plans');
                            } catch (error: any) {
                              setIsInvestmentProcessing(false);
                              let displayError = "Investment failed. Please try again.";
                              try {
                                const parsed = JSON.parse(error.message);
                                displayError = parsed.userFriendlyMessage || displayError;
                              } catch (e) {
                                displayError = typeof error === 'string' ? error : displayError;
                              }
                              setInvestmentError(displayError);
                              console.error("Investment Error:", error);
                            }
                          }}
                          className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                        >
                          {isInvestmentProcessing ? (
                            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            <>
                              <Zap className="w-5 h-5 fill-white" />
                              Confirm & Invest Now
                            </>
                          )}
                        </motion.button>
                      </motion.div>
                    )}
                  </>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-black text-lg tracking-tight">My Portfolio</h4>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Total: {user.investments?.length || 0} Assets
                      </p>
                    </div>

                    {!user.investments || user.investments.length === 0 ? (
                      <div className="py-20 text-center bg-gray-50 dark:bg-zinc-800/50 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-zinc-700">
                        <TrendingUp className="w-12 h-12 text-gray-200 dark:text-zinc-700 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No active investments yet</p>
                        <button 
                          onClick={() => setInvestmentModalTab('plans')}
                          className="mt-4 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline"
                        >
                          Explore Plans
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {user.investments.map((inv) => (
                          <div key={inv.id} className="bg-white dark:bg-zinc-800 p-6 rounded-[2rem] border border-gray-100 dark:border-zinc-700 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center">
                                  <TrendingUp className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                  <h5 className="font-black text-base tracking-tight">{inv.planTitle}</h5>
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID: {inv.id}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-black text-base">{symbol}{convert(inv.amount)}</p>
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">ROI: {inv.roi}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                <span className="text-gray-400">Progress</span>
                                <span className="text-indigo-600">{inv.progress}%</span>
                              </div>
                              <div className="h-2 bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${inv.progress}%` }}
                                  className="h-full bg-indigo-600 rounded-full"
                                />
                              </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-gray-50 dark:border-zinc-700 flex justify-between items-center">
                              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                inv.status === 'active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-gray-100 text-gray-600 dark:bg-zinc-700'
                              }`}>
                                {inv.status}
                              </span>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                {inv.date ? (inv.date.toDate ? inv.date.toDate().toLocaleDateString() : new Date(inv.date).toLocaleDateString()) : 'Just now'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Betting Modal */}
      <AnimatePresence>
        {bettingModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBettingModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[3rem] sm:rounded-[3rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center shadow-inner">
                    <Trophy className="w-7 h-7 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight leading-none">Betting</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">Fund your wallet</p>
                  </div>
                </div>
                <button 
                  onClick={() => setBettingModalOpen(false)} 
                  className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-2xl hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-8">
                <div>
                  <div className="flex justify-between items-end mb-4 px-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Select Platform</label>
                    {bettingPlatform && (
                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Selected: {bettingPlatform}</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { name: 'SportyBet', color: 'bg-red-500' },
                      { name: 'Bet9ja', color: 'bg-green-600' },
                      { name: '1xBet', color: 'bg-blue-600' },
                      { name: 'BetKing', color: 'bg-blue-900' },
                      { name: 'MSport', color: 'bg-yellow-500' },
                      { name: 'Merrybet', color: 'bg-orange-600' }
                    ].map((p) => (
                      <button
                        key={p.name}
                        onClick={() => setBettingPlatform(p.name)}
                        className={`p-4 rounded-3xl transition-all border-2 flex items-center gap-4 text-left ${
                          bettingPlatform === p.name 
                            ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-500 shadow-md' 
                            : 'bg-gray-50 dark:bg-zinc-800/50 border-transparent hover:border-gray-200 dark:hover:border-zinc-700 text-gray-500'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-sm bg-white p-1.5 flex-shrink-0 border border-gray-100">
                          <img 
                            src={`https://picsum.photos/seed/${p.name.toLowerCase()}/100/100`} 
                            alt={p.name}
                            className="w-full h-full object-cover rounded-xl"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <span className={`text-xs font-black uppercase tracking-tight ${bettingPlatform === p.name ? 'text-amber-700 dark:text-amber-400' : ''}`}>
                          {p.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="relative">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2.5 ml-1">User ID / Account ID</label>
                    <div className="relative group">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 w-10 h-10 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-zinc-800 group-focus-within:border-amber-500 transition-colors">
                        <UserIcon className="w-5 h-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                      </div>
                      <input 
                        type="text"
                        value={bettingUserId}
                        onChange={(e) => setBettingUserId(e.target.value)}
                        placeholder="Enter your betting ID"
                        className="w-full bg-gray-50 dark:bg-zinc-800 border-2 border-transparent rounded-[2rem] py-5 pl-18 pr-6 font-bold text-sm focus:bg-white dark:focus:bg-zinc-900 focus:border-amber-500 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2.5 ml-1">Amount to Fund</label>
                    <div className="flex items-center bg-gray-50 dark:bg-zinc-800 border-2 border-transparent rounded-[2rem] focus-within:bg-white dark:focus-within:bg-zinc-900 focus-within:border-amber-500 transition-all overflow-hidden group">
                      <div className="ml-5 w-10 h-10 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center shadow-sm border border-gray-100 dark:border-zinc-800 group-focus-within:border-amber-500 transition-colors">
                        <span className="font-black text-emerald-500 group-focus-within:text-amber-500 transition-colors">₦</span>
                      </div>
                      <input 
                        type="number"
                        value={bettingAmount}
                        onChange={(e) => setBettingAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-transparent border-none py-5 pl-3 pr-6 font-black text-xl outline-none"
                      />
                    </div>
                  </div>
                </div>

                {bettingError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20"
                  >
                    <p className="text-red-500 text-[10px] font-black uppercase tracking-widest text-center">{bettingError}</p>
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isBettingProcessing || !bettingPlatform || !bettingUserId || !bettingAmount}
                  onClick={async () => {
                    const amt = parseFloat(bettingAmount);
                    if (amt > user.balance) {
                      setBettingError('Insufficient Balance');
                      return;
                    }
                    if (amt < 100) {
                      setBettingError('Min amount is 100');
                      return;
                    }
                    
                    setIsBettingProcessing(true);
                    setBettingError('');
                    
                    // Simulate processing
                    await new Promise(r => setTimeout(r, 2000));
                    
                    const updatedUser = { ...user, balance: user.balance - amt };
                    const transaction = {
                      type: 'betting',
                      title: `${bettingPlatform} Top-up`,
                      amount: -amt,
                      icon: (
                        <div className="w-full h-full p-1 overflow-hidden rounded-2xl">
                          <img 
                            src={`https://picsum.photos/seed/${bettingPlatform.toLowerCase()}/80/80`} 
                            alt={bettingPlatform}
                            className="w-full h-full object-cover rounded-lg"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ),
                      date: 'Just now',
                      ref: `BET-${Math.random().toString(36).substring(7).toUpperCase()}`,
                      bettingPlatform,
                      bettingUserId
                    };
                    
                    setLastTransaction(transaction);
                    onUpdateUser(updatedUser);
                    
                    setIsBettingProcessing(false);
                    setBettingModalOpen(false);
                    setReceiptModalOpen(true);
                    setBettingPlatform('');
                    setBettingUserId('');
                    setBettingAmount('');
                  }}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl shadow-amber-500/25 disabled:opacity-50 disabled:grayscale transition-all flex items-center justify-center gap-3"
                >
                  {isBettingProcessing ? (
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 fill-white" />
                      Confirm & Fund Wallet
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Card Top Up Modal */}
      <AnimatePresence>
        {cardTopUpModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCardTopUpModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-2xl uppercase tracking-tight">Top Up Card</h3>
                <button onClick={() => {
                  setCardTopUpModalOpen(false);
                  setCardTopUpStep('amount');
                  setCardTopUpAmount('');
                  setCardTopUpPin('');
                  setCardTopUpError('');
                }} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                {cardTopUpStep === 'amount' ? (
                  <>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Enter Amount</label>
                      <div className="flex items-center bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl focus-within:ring-2 focus-within:ring-emerald-500 transition-all overflow-hidden">
                        <span className="pl-5 font-black text-2xl text-emerald-500">₦</span>
                        <input 
                          type="number"
                          value={cardTopUpAmount}
                          onChange={e => setCardTopUpAmount(e.target.value)}
                          className="w-full bg-transparent border-none py-5 pl-2 pr-5 text-2xl font-black outline-none text-zinc-900 dark:text-zinc-100"
                          placeholder="0.00"
                          autoFocus
                        />
                      </div>
                      <p className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Available: {symbol}{convert(user.balance)}</p>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setCardTopUpStep('pin')}
                      disabled={!cardTopUpAmount || parseFloat(cardTopUpAmount) <= 0 || parseFloat(cardTopUpAmount) > user.balance}
                      className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/20 disabled:opacity-50"
                    >
                      Continue
                    </motion.button>
                  </>
                ) : (
                  <>
                    <div className="text-center space-y-4">
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl inline-block mx-auto">
                        <p className="text-emerald-600 font-black text-2xl">₦{parseFloat(cardTopUpAmount).toLocaleString()}</p>
                      </div>
                      <p className="text-gray-500 font-medium">Enter PIN to authorize card top up</p>
                      
                      <input 
                        type="password"
                        maxLength={4}
                        autoFocus
                        value={cardTopUpPin}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setCardTopUpPin(val);
                          if (val.length === 4) {
                            handleTopUpCard(cardTopUpAmount, val);
                          }
                        }}
                        className="w-full max-w-[200px] mx-auto p-4 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl text-center text-3xl font-black tracking-[1em] outline-none focus:ring-2 focus:ring-emerald-500"
                      />

                      <div className="mt-4">
                        <button 
                          type="button"
                          onClick={() => {
                            setPinResetStep('request');
                            setPinResetEmail(user.email || '');
                            setIsPinResetModalOpen(true);
                            setCardTopUpModalOpen(false);
                          }}
                          className="text-xs font-black text-emerald-600 uppercase tracking-widest hover:underline"
                        >
                          Forgot PIN?
                        </button>
                      </div>

                      {cardTopUpError && (
                        <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{cardTopUpError}</p>
                      )}

                      <div className="flex gap-3 pt-4">
                        <button 
                          onClick={() => setCardTopUpStep('amount')}
                          className="flex-1 py-4 bg-gray-100 dark:bg-zinc-800 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                        >
                          Back
                        </button>
                        <button 
                          onClick={() => handleTopUpCard(cardTopUpAmount, cardTopUpPin)}
                          disabled={cardTopUpPin.length !== 4 || isCardTopUpProcessing}
                          className="flex-2 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                        >
                          {isCardTopUpProcessing ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          ) : (
                            'Confirm Top Up'
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        {/* Floating AI Customer Service Button */}
        <motion.button
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.1}
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setChatOpen(true)}
          className="fixed bottom-24 right-6 z-50 w-16 h-16 bg-blue-600 text-white rounded-2xl shadow-2xl shadow-blue-600/40 flex items-center justify-center group cursor-grab active:cursor-grabbing"
        >
          <MessageSquare className="w-8 h-8" />
          <span className="absolute right-full mr-3 px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none">
            AI Support
          </span>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-zinc-950 animate-pulse"></div>
        </motion.button>

        {/* AI Chat Drawer */}
        <AnimatePresence>
          {chatOpen && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setChatOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              />
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-[3rem] z-50 shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
              >
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Logo size="md" />
                    <div>
                      <h4 className="font-black text-xl tracking-tight">Sage AI</h4>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Online & Ready</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setChatOpen(false)} 
                    className="bg-gray-100 dark:bg-zinc-800 p-3 rounded-2xl text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                  {messages.map((m, i) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={i} 
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-medium leading-relaxed shadow-sm ${
                        m.role === 'user' 
                          ? 'bg-purple-600 text-white rounded-tr-none' 
                          : 'bg-gray-100 dark:bg-zinc-800 text-slate-800 dark:text-gray-200 rounded-tl-none'
                      }`}>
                        <Markdown>{m.content}</Markdown>
                      </div>
                    </motion.div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-zinc-800 p-4 rounded-3xl rounded-tl-none flex gap-1">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-6 bg-gray-50 dark:bg-zinc-800/50">
                  <form onSubmit={sendMessage} className="flex gap-3">
                    <input 
                      value={input} 
                      onChange={e => setInput(e.target.value)} 
                      className="flex-1 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium" 
                      placeholder="Ask Sage anything..."
                    />
                    <button 
                      type="submit" 
                      disabled={isTyping}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white p-4 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Send className="w-6 h-6" />
                    </button>
                  </form>
                  <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-4">
                    Powered by SageVault Intelligence
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Testimonials Section */}
        {navView === 'home' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Slim Sponsored Ads - Now on Top */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 border border-blue-100 dark:border-blue-800/30 rounded-2xl p-3 flex items-center justify-between overflow-hidden relative group shadow-sm"
            >
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                  <Zap className="w-4 h-4 animate-pulse" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">Sponsored Ad</span>
                    <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                    <span className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">SageVault Partners</span>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={adIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="text-sm font-black tracking-tight text-zinc-900 dark:text-zinc-100"
                    >
                      {ads[adIndex]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
              
              {/* Animated Background Elements */}
              <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-blue-600/5 to-transparent pointer-events-none"></div>
              <motion.div 
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"
              />
            </motion.div>

            {/* Balance Card */}
            <motion.div 
              whileHover={{ scale: 1.01, y: -2 }}
              whileTap={{ scale: 0.99 }}
              className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-blue-600/20"
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Total Balance</p>
                    <h3 className="text-4xl sm:text-5xl font-black tracking-tighter">
                      {symbol}{convert(user.balance)}
                    </h3>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                    <Wallet className="w-6 h-6" />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-6 border-t border-white/10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Account Details</p>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="text-xl font-mono font-bold tracking-wider">{user.accountNumber}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{user.name}</span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(user.accountNumber);
                          showToast('Account number copied!');
                        }}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                    <div className="flex flex-wrap gap-3">
                      <motion.button 
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => { e.stopPropagation(); setTransferModalOpen(true); }}
                        className="flex-1 sm:flex-none px-6 py-3 bg-white text-blue-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                      >
                        <ArrowUpRight className="w-4 h-4" /> Send Money
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => { e.stopPropagation(); setReceiveModalOpen(true); }}
                        className="flex-1 sm:flex-none px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                      >
                        <ArrowDownLeft className="w-4 h-4" /> Receive Money
                      </motion.button>
                    </div>
                </div>
              </div>

              {/* Decorative Circles */}
              <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-[-20%] left-[-10%] w-48 h-48 bg-blue-400/20 rounded-full blur-2xl"></div>
            </motion.div>

            {/* Random Advert Section */}

            {/* Quick Actions Grid - 3 Horizontal, 2 Vertical */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Airtime', icon: <Smartphone className="w-6 h-6" />, color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600', action: () => setAirtimeModalOpen(true) },
                { label: 'Data', icon: <Globe className="w-6 h-6" />, color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600', action: () => setDataModalOpen(true) },
                { label: 'TV', icon: <Tv className="w-6 h-6" />, color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600', action: () => setTvModalOpen(true) },
                { label: 'Investment', icon: <TrendingUp className="w-6 h-6" />, color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600', action: () => setInvestmentModalOpen(true) },
                { label: 'Betting', icon: <Trophy className="w-6 h-6" />, color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600', action: () => setBettingModalOpen(true) },
                { label: 'History', icon: <History className="w-6 h-6" />, color: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600', action: () => setTransactionHistoryModalOpen(true) },
              ].map((action, i) => (
                <motion.button 
                  key={i}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={action.action}
                  className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-gray-100 dark:border-zinc-800 flex flex-col items-center gap-4 hover:shadow-md transition-all group"
                >
                  <div className={`w-14 h-14 ${action.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors">{action.label}</span>
                </motion.button>
              ))}
            </div>

            {/* Recent Transactions Section */}
            <div className="space-y-6 relative bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
              <div className="flex justify-between items-center px-1">
                <div>
                  <h3 className="font-black text-xl tracking-tight">Recent Transactions</h3>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-400 uppercase tracking-widest">Your latest activity</p>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setNavView('transactions')}
                  className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl transition-all"
                >
                  See All
                </motion.button>
              </div>

              <div className="space-y-3">
                {transactions.length === 0 ? (
                  <div className="py-8 text-center">
                    <History className="w-10 h-10 text-gray-200 dark:text-zinc-800 mx-auto mb-3" />
                    <p className="text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-widest text-[10px]">No transactions yet</p>
                  </div>
                ) : (
                  [...transactions]
                    .sort((a, b) => {
                      const dateA = a.createdAt ? (a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt.seconds * 1000)) : new Date(0);
                      const dateB = b.createdAt ? (b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt.seconds * 1000)) : new Date(0);
                      return dateB.getTime() - dateA.getTime();
                    })
                    .slice(0, 3)
                    .map((tx, i) => (
                      <TransactionItem 
                        key={tx.id || i}
                        transaction={tx}
                        symbol={symbol}
                        convert={convert}
                        onClick={() => {
                          setSelectedTransaction(tx);
                          setTransactionDetailsModalOpen(true);
                        }}
                      />
                    ))
                )}
              </div>
            </div>

            {/* Post Testimony Form (Moved Up) */}
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full -ml-16 -mt-16 group-hover:bg-purple-500/10 transition-all"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                    <Heart className="w-5 h-5 text-purple-600" />
                  </div>
                  <h4 className="font-black text-lg tracking-tight">Share Your Experience</h4>
                </div>
                <form onSubmit={handlePostTestimony} className="space-y-4">
                  <textarea 
                    value={newTestimony}
                    onChange={e => setNewTestimony(e.target.value)}
                    placeholder="How has SageVault helped you today?"
                    className="w-full p-5 bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-purple-500 text-sm min-h-[120px] resize-none transition-all font-medium text-zinc-900 dark:text-zinc-100"
                    required
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your feedback helps us grow</p>
                    <motion.button 
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={isSubmittingTestimony}
                      className="bg-purple-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-500/20 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSubmittingTestimony ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      {isSubmittingTestimony ? 'Posting...' : 'Post Experience'}
                    </motion.button>
                  </div>
                </form>
              </div>
            </div>

            {/* Testimonials (Moved Down) */}
            <div className="space-y-6 relative bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
              <div className="flex justify-between items-center px-1">
                <div>
                  <h3 className="font-black text-xl tracking-tight">Community Voices</h3>
                  <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-400 uppercase tracking-widest">Real stories from real users</p>
                </div>
                {testimonials.length > 0 && (
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAllTestimonials(true)}
                    className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-xl transition-all"
                  >
                    See All ({testimonials.length})
                  </motion.button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {testimonials.length === 0 ? (
                  <div className="col-span-full py-12 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-200 dark:text-zinc-800 mx-auto mb-4" />
                    <p className="text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-widest text-xs">Be the first to share your experience!</p>
                  </div>
                ) : (
                  (testimonials || []).slice(0, 3).map((t) => (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={t.id} 
                      className="bg-gray-50 dark:bg-zinc-800/50 p-6 rounded-[2rem] border border-gray-100 dark:border-zinc-700/50 shadow-sm flex flex-col justify-between h-full group hover:shadow-md transition-all"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xs">
                              {t.name.charAt(0)}
                            </div>
                            <h4 className="font-bold text-sm">{t.name}</h4>
                          </div>
                          <Quote className="w-5 h-5 text-purple-200 dark:text-purple-900/40" />
                        </div>
                        <p className="text-gray-500 dark:text-zinc-400 text-sm leading-relaxed italic line-clamp-4">"{t.text}"</p>
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold mt-6 uppercase tracking-widest">
                        {t.createdAt ? (t.createdAt.toDate ? t.createdAt.toDate().toLocaleDateString() : new Date(t.createdAt).toLocaleDateString()) : 'Just now'}
                      </p>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Footer License */}
            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-zinc-800 text-center space-y-4">
              <div className="flex justify-center items-center gap-3 opacity-50 grayscale hover:grayscale-0 transition-all">
                <ShieldCheck className="w-8 h-8 text-emerald-600" />
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-tighter leading-none">Licensed by the</p>
                  <p className="text-sm font-black uppercase tracking-tight">Central Bank of Nigeria</p>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                SageVault Fintech Ltd © 2026 • RC: 1234567
              </p>
            </div>
          </motion.div>
        )}

        {/* Card View */}
        {navView === 'card' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex justify-between items-center px-1">
              <h3 className="font-black text-2xl uppercase tracking-tight">My Virtual Cards</h3>
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-emerald-500" />
              </div>
            </div>

            {user.virtualCard ? (
              <div className="space-y-8">
                {/* Virtual Card Display */}
                <motion.div 
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCardsModalOpen(true)}
                  className={`cursor-pointer relative aspect-[1.586/1] w-full bg-gradient-to-br ${user.virtualCard.isFrozen ? 'from-zinc-600 to-zinc-500' : 'from-zinc-900 to-zinc-800'} rounded-[2rem] p-8 text-white shadow-2xl overflow-hidden border border-white/10 transition-all duration-500`}
                >
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <Logo size="sm" />
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Virtual Card</p>
                        <p className="text-xs font-black uppercase tracking-tight">{user.virtualCard.cardType}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-2xl font-mono tracking-[0.2em] font-bold">
                        {user.virtualCard.cardNumber}
                      </p>
                      <div className="flex gap-8 mt-4">
                        <div>
                          <p className="text-[8px] font-bold uppercase tracking-widest opacity-50">Expiry</p>
                          <p className="text-sm font-bold">{user.virtualCard.expiry}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold uppercase tracking-widest opacity-50">CVV</p>
                          <p className="text-sm font-bold">***</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold uppercase tracking-widest opacity-50">Balance</p>
                          <p className="text-sm font-bold">{symbol}{convert(user.virtualCard.cardBalance)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-end">
                      <p className="text-sm font-black uppercase tracking-widest">{user.virtualCard.cardName}</p>
                      <div className="w-12 h-8 bg-white/10 rounded-lg backdrop-blur-md flex items-center justify-center">
                        <div className="w-6 h-6 bg-red-500/80 rounded-full -mr-2"></div>
                        <div className="w-6 h-6 bg-yellow-500/80 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  {user.virtualCard.isFrozen && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-20 flex items-center justify-center">
                      <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/30 flex items-center gap-3">
                        <Lock className="w-5 h-5 text-white" />
                        <span className="text-sm font-black uppercase tracking-widest">Frozen</span>
                      </div>
                    </div>
                  )}
                  {/* Decorative */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                </motion.div>

                {/* Card Actions */}
                <div className="grid grid-cols-2 gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleFreezeCard}
                    className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 flex flex-col items-center gap-3 shadow-sm hover:bg-gray-50 transition-all"
                  >
                    <div className={`w-12 h-12 ${user.virtualCard.isFrozen ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'} rounded-2xl flex items-center justify-center`}>
                      {user.virtualCard.isFrozen ? <ShieldCheck className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                    </div>
                    <span className="text-sm font-bold">{user.virtualCard.isFrozen ? 'Unfreeze' : 'Freeze'} Card</span>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCardTopUpModalOpen(true)}
                    className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 flex flex-col items-center gap-3 shadow-sm hover:bg-gray-50 transition-all"
                  >
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                      <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold">Top Up</span>
                  </motion.button>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-3xl border border-amber-100 dark:border-amber-900/20 flex gap-4">
                  <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm text-amber-900 dark:text-amber-400">Security Tip</h4>
                    <p className="text-xs text-amber-800/70 dark:text-amber-400/60 mt-1 leading-relaxed">
                      Never share your card CVV or PIN with anyone. SageVault will never ask for these details.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 p-12 rounded-[3rem] border border-gray-100 dark:border-zinc-800 text-center space-y-6 shadow-sm">
                <div className="w-24 h-24 bg-purple-50 text-purple-600 rounded-[2rem] flex items-center justify-center mx-auto">
                  <CreditCard className="w-12 h-12" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-black text-2xl tracking-tight">No Active Card</h4>
                  <p className="text-gray-400 text-sm font-medium px-4">
                    Request a virtual card to start making secure online payments globally.
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCardsModalOpen(true)}
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl"
                >
                  Request Virtual Card
                </motion.button>
              </div>
            )}
          </motion.div>
        )}

        {/* Me View */}
        {navView === 'me' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Profile Header */}
            <motion.div 
              whileHover={{ scale: 1.01, y: -2 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setProfileModalOpen(true)}
              className="cursor-pointer bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col items-center text-center relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-all"></div>
              <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-[2.5rem] flex items-center justify-center text-white text-3xl font-black shadow-xl mb-4">
                {user.name.charAt(0)}
              </div>
              <h3 className="font-black text-2xl tracking-tight">{user.name}</h3>
              
              <div className="mt-4 flex items-center gap-2">
                <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3 text-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Tier {user.tier || 1} Verified</span>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => { e.stopPropagation(); setProfileModalOpen(true); }}
                  className="bg-emerald-50 text-emerald-600 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest"
                >
                  Edit Profile
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => { e.stopPropagation(); /* Share logic */ }}
                  className="bg-gray-50 dark:bg-zinc-800 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest"
                >
                  Share ID
                </motion.button>
              </div>
            </motion.div>

            {/* Management Section */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 ml-4 mb-2">Management</h3>
              <div className="grid grid-cols-1 gap-4">
                {[
                  { label: 'Saved Beneficiaries', icon: <Users />, count: 12, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', action: () => {} },
                  { label: 'Scheduled Payments', icon: <Calendar />, count: recurringPayments.length, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', action: () => setRecurringPaymentsModalOpen(true) },
                ].map((item, i) => (
                  <motion.button 
                    key={i}
                    whileHover={{ x: 5 }}
                    onClick={item.action}
                    className="w-full p-6 bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 rounded-[2rem] flex items-center justify-between hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 ${item.bg} rounded-2xl flex items-center justify-center transition-all group-hover:scale-110`}>
                        {React.cloneElement(item.icon as React.ReactElement<any>, { className: `w-6 h-6 ${item.color}` })}
                      </div>
                      <span className="text-sm font-black tracking-tight">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.count && (
                        <span className="px-3 py-1 bg-gray-50 dark:bg-zinc-800 rounded-xl text-[10px] font-black text-gray-400">{item.count}</span>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Recurring Payments Section (Moved from home) */}
            <div className="space-y-6">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-black text-lg uppercase tracking-tight text-gray-400">Recurring Payments</h3>
                <motion.button 
                  whileHover={{ scale: 1.05, x: 2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setRecurringPaymentsModalOpen(true)}
                  className="text-xs font-black text-purple-600 uppercase tracking-widest hover:underline"
                >
                  Manage
                </motion.button>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-1 px-1">
                {recurringPayments.map((p) => (
                  <motion.div 
                    key={p.id}
                    whileHover={{ y: -5 }}
                    className="min-w-[160px] bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col items-center gap-3"
                  >
                    <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-purple-600">
                      {p.icon}
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-sm tracking-tight">{p.name}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{symbol}{convert(p.amount)}</p>
                    </div>
                  </motion.div>
                ))}
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setRecurringPaymentsModalOpen(true)}
                  className="min-w-[160px] bg-gray-50 dark:bg-zinc-800/50 p-6 rounded-[2rem] border border-dashed border-gray-200 dark:border-zinc-700 flex flex-col items-center justify-center gap-3 group"
                >
                  <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-purple-600 transition-colors">
                    <Plus className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Add New</span>
                </motion.button>
              </div>
            </div>

            {/* Upgrade Section */}
            <div className="space-y-4">
              <div className="p-8 bg-white dark:bg-zinc-900 rounded-[3rem] border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-all"></div>
                <div className="flex justify-between items-center mb-8 relative z-10">
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Account Limits</h3>
                    <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-400 uppercase tracking-widest">Tier {user.tier || 1} Verification</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Daily Limit</p>
                        <p className="text-lg font-black">{symbol}{convert(user.dailySpent || 0)} <span className="text-gray-400 dark:text-zinc-500 text-xs font-bold">/ {symbol}{convert(TIER_LIMITS[user.tier || 1].daily)}</span></p>
                      </div>
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                        {Math.round(((user.dailySpent || 0) / TIER_LIMITS[user.tier || 1].daily) * 100)}% Used
                      </p>
                    </div>
                    <div className="h-3 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, ((user.dailySpent || 0) / TIER_LIMITS[user.tier || 1].daily) * 100)}%` }}
                        className="h-full bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                      ></motion.div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Monthly Limit</p>
                        <p className="text-lg font-black">{symbol}{convert(user.monthlySpent || 0)} <span className="text-gray-400 dark:text-zinc-500 text-xs font-bold">/ {symbol}{convert(TIER_LIMITS[user.tier || 1].monthly)}</span></p>
                      </div>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                        {Math.round(((user.monthlySpent || 0) / TIER_LIMITS[user.tier || 1].monthly) * 100)}% Used
                      </p>
                    </div>
                    <div className="h-3 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, ((user.monthlySpent || 0) / TIER_LIMITS[user.tier || 1].monthly) * 100)}%` }}
                        className="h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                      ></motion.div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-50 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
                  <p className="text-xs text-gray-400 dark:text-zinc-400 font-medium text-center sm:text-left">
                    Upgrade your tier to increase your transaction limits and unlock more features.
                  </p>
                  <motion.button 
                    whileHover={{ scale: 1.05, x: 5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setUpgradeModalOpen(true)}
                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all whitespace-nowrap"
                  >
                    Upgrade Tier
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Menu Options */}
            <div className="bg-white dark:bg-zinc-900 rounded-[3rem] border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden">
              {[
                { label: 'Transaction History', icon: <History className="w-5 h-5" />, color: 'text-blue-500', action: () => setTransactionHistoryModalOpen(true) },
                { label: 'Account Analytics', icon: <TrendingUp className="w-5 h-5" />, color: 'text-emerald-500', action: () => setTransactionHistoryModalOpen(true) },
                { label: 'Invitation', icon: <UserPlus className="w-5 h-5" />, color: 'text-pink-500', action: () => setNavView('invitation') },
                { label: 'Customer Service Centre', icon: <MessageSquare className="w-5 h-5" />, color: 'text-indigo-500', action: () => setChatOpen(true) },
                { label: 'Profile Settings', icon: <Settings className="w-5 h-5" />, color: 'text-purple-500', action: () => setProfileModalOpen(true) },
                { label: 'Help & Support', icon: <HelpCircle className="w-5 h-5" />, color: 'text-orange-500', action: () => setHelpModalOpen(true) },
              ].map((item, i) => (
                <button 
                  key={i}
                  onClick={item.action}
                  className="w-full p-6 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-all border-b border-gray-50 dark:border-zinc-800 last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <div className={`${item.color} opacity-80`}>{item.icon}</div>
                    <span className="font-bold text-sm tracking-tight">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              ))}
            </div>

            {/* Sign Out */}
            <button 
              onClick={onLogout}
              className="w-full p-6 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 border border-red-100 dark:border-red-900/20"
            >
              <LogOut className="w-5 h-5" />
              Sign Out Account
            </button>
          </motion.div>
        )}

        {/* Invitation View */}
        {navView === 'invitation' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setNavView('me')} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-black text-2xl uppercase tracking-tight">Invite Friends</h3>
            </div>

            <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-2">Your Invitation Code</p>
                <div className="flex items-center justify-between bg-white/20 backdrop-blur-md p-6 rounded-3xl border border-white/30">
                  <span className="text-3xl font-black tracking-widest">{user.invitationCode}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(user.invitationCode || '');
                    }}
                    className="p-3 bg-white text-rose-600 rounded-2xl shadow-lg active:scale-90 transition-all"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-gray-100 dark:border-zinc-800 shadow-sm text-center">
                <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <p className="text-3xl font-black">{user.referralsCount}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Invited Friends</p>
              </div>
              <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-gray-100 dark:border-zinc-800 shadow-sm text-center">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <p className="text-3xl font-black">{symbol}{convert(user.referralsCount! * 500)}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Total Earned</p>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[3rem] border border-gray-100 dark:border-zinc-800 shadow-sm">
              <h4 className="font-black text-sm uppercase tracking-widest text-gray-400 mb-6">How it works</h4>
              <div className="space-y-6">
                {[
                  { title: 'Share Code', desc: 'Share your unique invitation code with friends.' },
                  { title: 'Friends Join', desc: 'They sign up and verify their identity on SageVault.' },
                  { title: 'Get Rewarded', desc: 'Earn rewards for every successful referral.' }
                ].map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center font-black text-xs shrink-0">
                      0{i+1}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{step.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-8 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3">
                <Share2 className="w-4 h-4" />
                Share Invitation Link
              </button>
            </div>
          </motion.div>
        )}
            </motion.div>
          </AnimatePresence>

        {/* Bottom Navigation */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border-t border-gray-100 dark:border-zinc-800 px-6 py-3 flex justify-between items-center z-40 pb-safe">
            {[
              { id: 'home', label: 'Dashboard', icon: <Home className="w-6 h-6" /> },
              { id: 'transactions', label: 'Transactions', icon: <History className="w-6 h-6" /> },
              { id: 'cards', label: 'Cards', icon: <CreditCard className="w-6 h-6" /> },
              { id: 'me', label: 'Me', icon: <UserIcon className="w-6 h-6" /> },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setNavView(item.id as any)}
                className={`flex flex-col items-center gap-1.5 py-1 px-3 rounded-2xl transition-all relative ${navView === item.id ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <div className={`transition-all duration-300 ${navView === item.id ? 'scale-110' : 'scale-100'}`}>
                  {item.icon}
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest transition-all ${navView === item.id ? 'opacity-100' : 'opacity-70'}`}>
                  {item.label}
                </span>
                {navView === item.id && (
                  <motion.div 
                    layoutId="activeNav"
                    className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-full shadow-[0_0_12px_rgba(37,99,235,0.6)]"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
</div>
  );
}

function PinResetModal({ 
  isOpen, 
  onClose, 
  user, 
  step, 
  setStep, 
  email, 
  setEmail, 
  otp, 
  setOtp, 
  newPin, 
  setNewPin, 
  generatedOtp, 
  setGeneratedOtp 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  user: User, 
  step: 'request' | 'verify' | 'reset', 
  setStep: (s: 'request' | 'verify' | 'reset') => void,
  email: string,
  setEmail: (e: string) => void,
  otp: string,
  setOtp: (o: string) => void,
  newPin: string,
  setNewPin: (p: string) => void,
  generatedOtp: string,
  setGeneratedOtp: (o: string) => void
}) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    setLoading(true);
    setError('');
    try {
      // Simulate sending OTP
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setGeneratedOtp(code);
      console.log(`[DEBUG] PIN Reset OTP for ${email}: ${code}`);
      // In a real app, you'd call a backend service here
      setTimeout(() => {
        setStep('verify');
        setLoading(false);
      }, 1500);
    } catch (err) {
      setError('Failed to send reset code');
      setLoading(false);
    }
  };

  const handleVerify = () => {
    if (otp === generatedOtp || otp === '1234') { // 1234 as master bypass for demo
      setStep('reset');
      setError('');
    } else {
      setError('Invalid verification code');
    }
  };

  const handleReset = async () => {
    if (newPin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { pin: newPin });
      setLoading(false);
      onClose();
      // Show success toast or alert if possible
    } catch (err) {
      setError('Failed to update PIN');
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-zinc-800"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-blue-600" />
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              {step === 'request' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">Reset Transaction PIN</h3>
                    <p className="text-sm font-medium text-gray-400 mt-1">We'll send a verification code to your registered email.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input 
                      type="email"
                      value={email}
                      readOnly
                      className="w-full p-5 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl outline-none font-bold text-gray-400"
                    />
                  </div>
                  <button 
                    onClick={handleRequest}
                    disabled={loading}
                    className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send Reset Code'}
                  </button>
                </div>
              )}

              {step === 'verify' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">Verify Identity</h3>
                    <p className="text-sm font-medium text-gray-400 mt-1">Enter the 4-digit code sent to {email}</p>
                  </div>
                  <div className="flex justify-center gap-4">
                    <input 
                      type="text"
                      maxLength={4}
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="0000"
                      className="w-32 p-5 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black text-2xl text-center tracking-[0.5em]"
                    />
                  </div>
                  {error && <p className="text-center text-xs font-bold text-red-500 uppercase tracking-widest">{error}</p>}
                  <button 
                    onClick={handleVerify}
                    className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all active:scale-95"
                  >
                    Verify Code
                  </button>
                  <button 
                    onClick={() => setStep('request')}
                    className="w-full text-center text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-600"
                  >
                    Resend Code
                  </button>
                </div>
              )}

              {step === 'reset' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">Set New PIN</h3>
                    <p className="text-sm font-medium text-gray-400 mt-1">Choose a secure 4-digit transaction PIN.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New 4-Digit PIN</label>
                    <input 
                      type="password"
                      maxLength={4}
                      value={newPin}
                      onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="w-full p-5 bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black text-2xl text-center tracking-[0.5em]"
                    />
                  </div>
                  {error && <p className="text-center text-xs font-bold text-red-500 uppercase tracking-widest">{error}</p>}
                  <button 
                    onClick={handleReset}
                    disabled={loading}
                    className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update PIN'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// -------- ROOT APP -------- 
function TransactionSuccessScreen({ 
  transaction, 
  symbol, 
  convert, 
  onClose,
  showToast
}: { 
  transaction: any, 
  symbol: string, 
  convert: (amt: number) => string, 
  onClose: () => void,
  showToast: (m: string, t?: 'success' | 'error') => void
}) {
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8 py-4"
    >
      <div className="text-center space-y-4">
        <motion.div 
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 12, stiffness: 200 }}
          className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-600 mx-auto shadow-inner"
        >
          <CheckCircle2 className="w-12 h-12" />
        </motion.div>
        <div>
          <h4 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">Success!</h4>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">Transaction processed successfully</p>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-zinc-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-zinc-700 space-y-6 shadow-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Amount</span>
          <span className="text-2xl font-black text-emerald-500">{symbol}{convert(transaction.amount)}</span>
        </div>
        
        {(transaction.details?.accountName || transaction.receiverName) && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Recipient</span>
            <span className="font-black text-sm text-zinc-900 dark:text-zinc-100">{transaction.details?.accountName || transaction.receiverName}</span>
          </div>
        )}

        {(transaction.details?.bankName || transaction.bankName) && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Bank</span>
            <span className="font-black text-sm text-zinc-900 dark:text-zinc-100">{transaction.details?.bankName || transaction.bankName}</span>
          </div>
        )}

        {transaction.details?.phoneNumber && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Phone</span>
            <span className="font-black text-sm text-zinc-900 dark:text-zinc-100">{transaction.details.phoneNumber}</span>
          </div>
        )}

        {transaction.details?.network && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Network</span>
            <span className="font-black text-sm text-zinc-900 dark:text-zinc-100">{transaction.details.network}</span>
          </div>
        )}

        {transaction.details?.billType && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Bill Type</span>
            <span className="font-black text-sm text-zinc-900 dark:text-zinc-100">{transaction.details.billType}</span>
          </div>
        )}

        {transaction.details?.customerRef && (
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Customer Ref</span>
            <span className="font-black text-sm text-zinc-900 dark:text-zinc-100">{transaction.details.customerRef}</span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Type</span>
          <span className="font-black text-sm uppercase tracking-widest text-zinc-900 dark:text-zinc-100">{transaction.type}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Status</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="font-black text-sm uppercase tracking-widest text-emerald-500">Completed</span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Reference</span>
          <span className="font-mono font-bold text-xs tracking-wider text-zinc-500">{transaction.ref || transaction.id?.slice(0, 12).toUpperCase()}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Date</span>
          <div className="text-right">
            <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 block">
              {transaction.createdAt ? (transaction.createdAt.toDate ? transaction.createdAt.toDate().toLocaleDateString() : new Date(transaction.createdAt).toLocaleDateString()) : new Date().toLocaleDateString()}
            </span>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
              {currentTime.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex gap-4">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 py-5 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 dark:hover:bg-zinc-700 transition-all"
          >
            Done
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: '#1d4ed8' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              showToast("Receipt saved to device!");
            }}
            className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Receipt
          </motion.button>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={async () => {
            try {
              const txRef = doc(db, 'transactions', transaction.id);
              await updateDoc(txRef, { isFavorite: true });
              showToast("Transaction saved to favorites!");
            } catch (err) {
              console.error("Error saving favorite:", err);
            }
          }}
          className="w-full py-4 bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-400 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 border border-amber-100 dark:border-amber-900/20"
        >
          <Star className="w-4 h-4 fill-current" /> Save to Favorites
        </motion.button>
      </div>
    </motion.div>
  );
}

function App() {
  const [deviceId] = useState(() => {
    let id = localStorage.getItem('sagevault-device-id');
    if (!id) {
      id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('sagevault-device-id', id);
    }
    return id;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [view, setView] = useState<'login' | 'signup' | 'pin-setup' | 'otp' | 'home'>('login');
  const [tempUser, setTempUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('sagevault-dark');
    if (saved) {
      return JSON.parse(saved);
    } else {
      return false;
    }
  });
  const [loading, setLoading] = useState(true);
  const [adIndex, setAdIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAdIndex((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const [globalError, setGlobalError] = useState<FirestoreErrorInfo | null>(null);

  useEffect(() => {
    const handleError = (e: any) => {
      setGlobalError(e.detail);
    };
    window.addEventListener('sagevault-error', handleError);
    return () => window.removeEventListener('sagevault-error', handleError);
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setCurrentUser(null);
        setView('login');
        setAuthLoading(false);
        setTransactions([]);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;

    const userRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data() as User;
        setCurrentUser(userData);
        setView('home' as any);
      } else {
        setCurrentUser(null);
        setView('signup');
      }
      setAuthLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
      setAuthLoading(false);
    });

    const q = query(
      collection(db, 'transactions'),
      or(
        where('senderUid', '==', auth.currentUser.uid),
        where('receiverUid', '==', auth.currentUser.uid)
      ),
      orderBy('createdAt', 'desc')
    );
    const unsubscribeTransactions = onSnapshot(q, (txSnap) => {
      const txs = txSnap.docs.map(doc => {
        const data = doc.data() as any;
        const isCredit = data.receiverUid === auth.currentUser?.uid || data.receiverAccount === currentUser?.accountNumber;
        return { 
          id: doc.id, 
          ...data,
          isCredit
        };
      });
      setTransactions(txs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });

    return () => {
      unsubscribeUser();
      unsubscribeTransactions();
    };
  }, [auth.currentUser?.uid]);

  useEffect(() => {
    const timer = setInterval(() => {
      setAdIndex((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (currentUser && auth.currentUser) {
      const checkPublicProfile = async () => {
        try {
          const publicProfileRef = doc(db, 'public_profiles', auth.currentUser!.uid);
          const snap = await withRetry(() => getDoc(publicProfileRef));
          if (!snap.exists()) {
            await withRetry(() => setDoc(publicProfileRef, {
              uid: currentUser.uid,
              name: currentUser.name,
              accountNumber: currentUser.accountNumber,
              phone: currentUser.phone
            }));
          }
        } catch (error) {
          console.error("Error checking public profile:", error);
        }
      };
      checkPublicProfile();
    }
  }, [currentUser]);

  const generateAccountNumber = () => {
    const digits = Math.floor(10000000 + Math.random() * 90000000);
    return `SV${digits}`;
  };

  const handleSignUp = (newUser: any) => {
    setTempUser({
      ...newUser,
      accountNumber: generateAccountNumber(),
      balance: 100000, // Initial balance
      invitationCode: `SV-${(newUser.name || 'USER').split(' ')[0].toUpperCase()}-${Math.floor(100 + Math.random() * 899)}`,
      referralsCount: 0,
    });
    setView('pin-setup');
  };

  const handlePinComplete = async (pin: string) => {
    if (tempUser) {
      const userData = { ...tempUser, pin, authorizedDevices: [deviceId] };
      setTempUser(userData);
      
      try {
        let authUser = auth.currentUser;
        
        if (!authUser) {
          // If no auth user, it's a manual signup or Google wasn't pre-authed
          // If they have a password, use email/password auth to avoid popups
          if (userData.password) {
            const email = userData.email || `${userData.phone}@sagevault.com`;
            try {
              const result = await withRetry(() => createUserWithEmailAndPassword(auth, email, userData.password));
              authUser = result.user;
            } catch (error: any) {
              if (error.code === 'auth/email-already-in-use') {
                const result = await withRetry(() => signInWithEmailAndPassword(auth, email, userData.password));
                authUser = result.user;
              } else {
                throw error;
              }
            }
          } else {
            // Fallback to Google Popup if no password (shouldn't happen in manual flow)
            const result = await withRetry(() => signInWithPopup(auth, googleProvider));
            authUser = result.user;
          }
        }
        
        if (authUser) {
          const userRef = doc(db, 'users', authUser.uid);
          const finalUserData = {
            ...userData,
            uid: authUser.uid,
            email: authUser.email || userData.email,
            createdAt: serverTimestamp(),
          };
          
          try {
            await withRetry(() => setDoc(userRef, finalUserData));
            
            // Create public profile for search/resolution
            const publicProfileRef = doc(db, 'public_profiles', authUser.uid);
            await withRetry(() => setDoc(publicProfileRef, {
              uid: authUser.uid,
              name: finalUserData.name,
              accountNumber: finalUserData.accountNumber,
              phone: finalUserData.phone
            }));

            setCurrentUser(finalUserData as User);
            setView('home' as any);
          } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, 'users');
          }
        }
      } catch (error: any) {
        if (error.code === 'auth/popup-closed-by-user') {
          console.log("User closed the auth popup.");
          return;
        }
        console.error("Signup completion error:", error);
        setTempUser(null);
      }
    }
  };

  const handleLogin = async (loginData: any, remember: boolean) => {
    try {
      let authUser = null;
      
      // If loginData has phone and password, it's a manual login
      if (loginData.phone && loginData.password) {
        const email = loginData.email || `${loginData.phone}@sagevault.com`;
        const result = await withRetry(() => signInWithEmailAndPassword(auth, email, loginData.password));
        authUser = result.user;
      } else {
        // Otherwise use Google Login
        const result = await withRetry(() => signInWithPopup(auth, googleProvider));
        authUser = result.user;
      }

      if (authUser) {
        const userRef = doc(db, 'users', authUser.uid);
        try {
          const docSnap = await withRetry(() => getDoc(userRef));
          
          if (docSnap.exists()) {
            setCurrentUser(docSnap.data() as User);
            setView('home' as any);
          } else {
            // If user exists in Auth but not Firestore, they need to sign up
            setTempUser({
              name: authUser.displayName || '',
              email: authUser.email || '',
              phone: loginData.phone || '',
              password: loginData.password || '',
            });
            setView('signup');
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, 'users');
        }
      }
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.log("User closed the login popup.");
        return;
      }
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        alert("Invalid credentials. Please try again.");
        return;
      }
      console.error("Login error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setView('login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    setCurrentUser(updatedUser);
    if (auth.currentUser) {
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const publicProfileRef = doc(db, 'public_profiles', auth.currentUser.uid);
        
        await Promise.all([
          withRetry(() => setDoc(userRef, updatedUser)),
          withRetry(() => setDoc(publicProfileRef, {
            uid: updatedUser.uid,
            name: updatedUser.name,
            accountNumber: updatedUser.accountNumber,
            phone: updatedUser.phone
          }))
        ]);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'users');
      }
    }
  };

  return (
    <ErrorBoundary>
    <div className={`${dark ? 'dark bg-zinc-950' : 'bg-slate-50'} min-h-screen transition-colors duration-500 text-slate-900 dark:text-white`}>
      <GlobalErrorModal error={globalError} onClose={() => setGlobalError(null)} />
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-gradient-to-br from-purple-700 via-indigo-600 to-emerald-500 dark:from-slate-900 dark:via-purple-950 dark:to-slate-900"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="relative"
            >
              <div className="absolute -inset-8 bg-white/20 blur-3xl rounded-full animate-pulse"></div>
              <Logo size="xl" className="shadow-2xl relative z-10" />
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mt-8 text-center"
            >
              <h1 className="text-4xl font-black text-white tracking-tighter mb-2">SageVault</h1>
              <div className="flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"></div>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen"
          >
            {currentUser ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="min-h-screen"
              >
                <Dashboard 
                  user={currentUser} 
                  transactions={transactions}
                  onLogout={handleLogout} 
                  onUpdateUser={handleUpdateUser} 
                  dark={dark}
                  setDark={setDark}
                  adIndex={adIndex}
                />
              </motion.div>
            ) : view === 'pin-setup' ? (
              <motion.div
                key="pin-setup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <PinSetup 
                  onComplete={handlePinComplete} 
                  dark={dark}
                  setDark={setDark}
                />
              </motion.div>
            ) : view === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Login 
                  users={[]} 
                  onLogin={handleLogin} 
                  onGoToSignUp={() => setView('signup')} 
                  dark={dark}
                  setDark={setDark}
                />
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <SignUp 
                  onSignUp={handleSignUp} 
                  onGoogleSignUp={() => handleLogin({} as any, false)}
                  onBackToLogin={() => setView('login')} 
                  dark={dark}
                  setDark={setDark}
                />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </ErrorBoundary>
  );
}

export default App;
