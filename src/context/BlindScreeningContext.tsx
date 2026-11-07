'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface BlindScreeningContextType {
  isBlindMode: boolean;
  toggleBlindMode: () => void;
  maskName: (fullName: string, id?: string) => string;
  maskEmail: (email: string) => string;
  maskPhone: (phone?: string) => string;
  maskInstitution: (institution: string) => string;
}

const BlindScreeningContext = createContext<BlindScreeningContextType>({
  isBlindMode: false,
  toggleBlindMode: () => {},
  maskName: (name) => name,
  maskEmail: (email) => email,
  maskPhone: (phone) => phone || '',
  maskInstitution: (inst) => inst,
});

export function BlindScreeningProvider({ children }: { children: React.ReactNode }) {
  const [isBlindMode, setIsBlindMode] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem('hireagent_blind_screening');
    if (saved !== null) {
      setIsBlindMode(saved === 'true');
    }
  }, []);

  const toggleBlindMode = () => {
    setIsBlindMode((prev) => {
      const next = !prev;
      localStorage.setItem('hireagent_blind_screening', String(next));
      return next;
    });
  };

  const maskName = (fullName: string, id = '') => {
    if (!isBlindMode) return fullName;
    // Generate deterministic identifier like "Candidate #A-42"
    let hash = 0;
    const str = id || fullName;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const letter = String.fromCharCode(65 + (Math.abs(hash) % 26));
    const number = 100 + (Math.abs(hash) % 900);
    return `Candidate #${letter}-${number}`;
  };

  const maskEmail = (email: string) => {
    if (!isBlindMode) return email;
    const [user, domain] = email.split('@');
    if (!domain) return 'c***@candidate.io';
    return `${user.slice(0, 1)}***@blind-candidate.io`;
  };

  const maskPhone = (phone?: string) => {
    if (!isBlindMode || !phone) return phone || '';
    return '+***-***-****';
  };

  const maskInstitution = (institution: string) => {
    if (!isBlindMode) return institution;
    return 'Accredited Higher Education Institution';
  };

  return (
    <BlindScreeningContext.Provider
      value={{
        isBlindMode,
        toggleBlindMode,
        maskName,
        maskEmail,
        maskPhone,
        maskInstitution,
      }}
    >
      {children}
    </BlindScreeningContext.Provider>
  );
}

export const useBlindScreening = () => useContext(BlindScreeningContext);
