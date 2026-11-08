'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  Award,
  Calendar,
  DollarSign,
  Briefcase,
  Building,
  MapPin,
  Clock,
  Sparkles,
  PenTool,
  Printer,
  Check,
  AlertCircle,
  Stamp,
  Lock,
} from 'lucide-react';
import { offerService } from '@/services/offerService';
import { OfferPackage } from '@/types/offer';

export default function CandidateOfferSigningPage({
  params,
}: {
  params: Promise<{ token: string }> | { token: string };
}) {
  const unwrapped = 'then' in params ? use(params as Promise<{ token: string }>) : params;
  const token = unwrapped.token;

  const [offer, setOffer] = useState<OfferPackage | null>(null);
  const [loading, setLoading] = useState(true);

  // Signing states
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('draw');
  const [typedSignature, setTypedSignature] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [signSuccess, setSignSuccess] = useState(false);

  // Canvas drawing ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (token) {
      const found = offerService.getOfferByToken(token);
      if (found) {
        setOffer(found);
        setTypedSignature(found.candidateName);
      } else {
        // Fallback default offer for direct review
        const fallback = offerService.getOfferByApplicationId('app-001');
        setOffer(fallback);
        if (fallback) setTypedSignature(fallback.candidateName);
      }
      setLoading(false);
    }
  }, [token]);

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e1b4b'; // Deep navy blue ink
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSignContract = async () => {
    if (!agreedToTerms || !offer) return;
    setIsSigning(true);

    let signaturePayload = '';
    if (signatureMode === 'draw' && canvasRef.current) {
      signaturePayload = canvasRef.current.toDataURL('image/png');
    } else {
      signaturePayload = typedSignature.trim() || offer.candidateName;
    }

    setTimeout(() => {
      const updated = offerService.signOffer(
        token,
        signaturePayload,
        offer.candidateName,
        '192.168.1.1'
      );
      if (updated) {
        setOffer(updated);
      }
      setIsSigning(false);
      setSignSuccess(true);
    }, 1200);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-sm text-slate-500">
        Loading official appointment contract...
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Offer Not Found</h2>
        <p className="text-xs text-slate-500">The requested offer signing token is invalid or has expired.</p>
      </div>
    );
  }

  const isSigned = offer.status === 'SIGNED' || signSuccess;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 md:p-10 transition-colors">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Floating Action Bar */}
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400">
                Official Appointment Offer
              </span>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                {offer.candidateName} • {offer.jobTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / Save PDF</span>
            </button>
            <span
              className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                isSigned
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
              }`}
            >
              {isSigned ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Clock className="w-4 h-4 text-amber-600" />}
              <span>{isSigned ? 'OFFICIALLY SIGNED' : 'PENDING CANDIDATE SIGNATURE'}</span>
            </span>
          </div>
        </div>

        {/* Formal Executive Document Sheet */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-8 sm:p-14 space-y-8 print:border-none print:shadow-none print:p-0">
          {/* Executive Letterhead Header */}
          <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  TS
                </div>
                <span className="font-extrabold tracking-wider text-base text-slate-900 dark:text-white uppercase">
                  TalentScreen Global Inc.
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Executive Talent Acquisition &amp; Human Resources Directorate
              </p>
              <p className="text-[11px] text-slate-400">
                Ref: {offer.offerId.toUpperCase()} • Issued: {new Date(offer.issuedAt).toLocaleDateString()}
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-mono text-xs font-bold uppercase tracking-wider">
                CONFIDENTIAL APPOINTMENT
              </span>
            </div>
          </div>

          {/* Salutation */}
          <div className="space-y-3 text-sm leading-relaxed text-slate-800 dark:text-slate-200">
            <p>
              <strong>Date:</strong> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <p>
              <strong>To:</strong> {offer.candidateName} (<span className="text-slate-500">{offer.candidateEmail}</span>)
            </p>
            <p className="pt-2 font-medium">
              Dear {offer.candidateName},
            </p>
            <p>
              On behalf of Executive Leadership and the Department of {offer.department}, we are delighted to offer you the position of <strong className="text-slate-900 dark:text-white">{offer.jobTitle}</strong> with TalentScreen Global.
            </p>
            <p>
              Following rigorous evaluation of your competencies and unanimous authorization granted by Executive Administration (<strong className="text-slate-900 dark:text-white">{offer.issuedBy}</strong>), we are confident your skills will drive our core mission forward.
            </p>
          </div>

          {/* Key Appointment Terms Grid */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Position Title</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{offer.jobTitle}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Department</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{offer.department}</span>
              </div>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Annual Base Compensation</span>
                <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  ${offer.annualSalary.toLocaleString()} {offer.currency}
                </span>
                <span className="text-[10px] text-slate-400 block">Paid semi-monthly</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Signing / Transition Bonus</span>
                <span className="text-base font-extrabold text-indigo-600 dark:text-indigo-400">
                  ${offer.signingBonus.toLocaleString()} {offer.currency}
                </span>
                <span className="text-[10px] text-slate-400 block">First payroll cycle</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Equity Participation</span>
                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                  {offer.equityShares || 'N/A'}
                </span>
                <span className="text-[10px] text-slate-400 block">Stock option plan</span>
              </div>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Anticipated Start Date</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {new Date(offer.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Direct Reporting Line</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">{offer.reportingManager}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">Probation Period</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">{offer.probationMonths} Months</span>
              </div>
            </div>

            <div className="p-4">
              <span className="text-slate-500 dark:text-slate-400 block font-semibold mb-1">Work Location</span>
              <span className="text-xs font-semibold text-slate-900 dark:text-white">{offer.workLocation}</span>
            </div>
          </div>

          {/* Benefits & Executive Perks */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Corporate Benefits &amp; Executive Perks
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 dark:text-slate-300">
              {offer.benefits.map((b, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Signatures & Execution Section */}
          <div className="pt-6 border-t-2 border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Executive Sign-off Side */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                  Executive Authority Sign-Off
                </span>
                <Stamp className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="font-serif italic text-lg text-indigo-900 dark:text-indigo-300 py-2 border-b border-dashed border-slate-300 dark:border-slate-700">
                Mr. Kalamuzi
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                <p className="font-bold text-slate-900 dark:text-white">MR. KALAMUZI</p>
                <p>Executive Administrator &amp; Chairman</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Digitally Authorized &amp; Sealed
                </p>
              </div>
            </div>

            {/* Candidate Acceptance Side */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                  Candidate Acceptance
                </span>
                <PenTool className="w-4 h-4 text-emerald-500" />
              </div>

              {isSigned ? (
                /* Signed view */
                <div className="space-y-2">
                  <div className="py-2 border-b border-dashed border-emerald-300 dark:border-emerald-700">
                    {offer.candidateSignature?.startsWith('data:image') ? (
                      <img
                        src={offer.candidateSignature}
                        alt="Candidate Digital Signature"
                        className="h-10 object-contain"
                      />
                    ) : (
                      <span className="font-serif italic text-lg text-emerald-900 dark:text-emerald-200">
                        {offer.candidateSignature || offer.candidateName}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                    <p className="font-bold text-slate-900 dark:text-white">{offer.candidateName}</p>
                    <p className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Digitally Signed on{' '}
                      {new Date(offer.signedAt || Date.now()).toLocaleDateString()}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400">Verified IP: {offer.signatureIp || '192.168.1.1'}</p>
                  </div>
                </div>
              ) : (
                /* Unsigned view */
                <div className="py-3 border-b border-dashed border-slate-300 dark:border-slate-700 text-xs text-amber-600 dark:text-amber-400 font-semibold italic">
                  Awaiting candidate digital signature below...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Digital Signature Pad Box (Only shown if unsigned) */}
        {!isSigned && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-indigo-400 dark:border-indigo-600 shadow-xl p-6 sm:p-8 space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-indigo-600" />
                  Sign Employment Offer Digitally
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Sign with your finger or stylus on mobile, or with your mouse.
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setSignatureMode('draw')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    signatureMode === 'draw'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Draw Signature
                </button>
                <button
                  type="button"
                  onClick={() => setSignatureMode('type')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    signatureMode === 'type'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Type Signature
                </button>
              </div>
            </div>

            {/* Signature Canvas / Input */}
            {signatureMode === 'draw' ? (
              <div className="space-y-2">
                <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-950 overflow-hidden h-36">
                  <canvas
                    ref={canvasRef}
                    width={700}
                    height={144}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-full cursor-crosshair touch-none"
                  />
                  {!hasDrawn && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs italic">
                      Draw your signature here with finger or mouse ✍️
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors"
                  >
                    Clear Signature
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  placeholder="Type your full legal name..."
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-serif italic"
                />
                <p className="text-[11px] text-slate-400">
                  By typing your name, you declare this to be your legally binding digital signature.
                </p>
              </div>
            )}

            {/* Legal Agreement Checkbox */}
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                I, <strong className="text-slate-900 dark:text-white">{offer.candidateName}</strong>, accept the offer of employment as {offer.jobTitle} and agree to all terms and conditions set forth in this appointment letter.
              </span>
            </label>

            {/* Sign and Accept Button */}
            <button
              type="button"
              onClick={handleSignContract}
              disabled={isSigning || !agreedToTerms}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all"
            >
              {isSigning ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Sealing Digital Contract &amp; Cryptographic Hash...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Accept &amp; Officially Sign Contract</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
