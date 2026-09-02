"use client";

import React, { useState } from "react";
import MerchantLayout from "@/components/MerchantLayout";
import AbandonedCheckoutsSection from "@/components/AbandonedCheckoutsSection";
import AbandonedCaseDrawer, { AbandonedSession } from "@/components/AbandonedCaseDrawer";

export default function AbandonmentsPage() {
  const [selectedAbandonedSession, setSelectedAbandonedSession] = useState<AbandonedSession | null>(null);
  const [analyzingSessionId, setAnalyzingSessionId] = useState<string | null>(null);
  const [abandonmentAnalysisError, setAbandonmentAnalysisError] = useState<string | null>(null);

  // AI Abandonment Analysis API trigger
  const handleAnalyzeAbandonment = async (
    sessionId: string,
    getHeaders: Function,
    setAbandonedSessions: React.Dispatch<React.SetStateAction<AbandonedSession[]>>
  ) => {
    try {
      setAnalyzingSessionId(sessionId);
      setAbandonmentAnalysisError(null);

      const res = await fetch("/api/recovery/abandonment-analyze", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ session_id: sessionId }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Abandonment analysis failed");
      }

      setAbandonedSessions((prev) =>
        prev.map((s) => (s.sessionId === sessionId ? { ...s, analysis: data.analysis } : s))
      );

      if (selectedAbandonedSession && selectedAbandonedSession.sessionId === sessionId) {
        setSelectedAbandonedSession((prev) => (prev ? { ...prev, analysis: data.analysis } : null));
      }
    } catch (err: any) {
      console.error("Abandonment analysis error:", err);
      setAbandonmentAnalysisError(err.message || "Failed to analyze abandonment");
    } finally {
      setAnalyzingSessionId(null);
    }
  };

  return (
    <MerchantLayout pageTitle="Checkout Abandonment Recovery Engine">
      {({ abandonedSessions, setAbandonedSessions, getHeaders }) => (
        <div className="space-y-8">
          {/* 1. Abandoned Checkouts Section */}
          <AbandonedCheckoutsSection
            sessions={abandonedSessions}
            onSelectSession={(session) => setSelectedAbandonedSession(session)}
            onAnalyzeSession={(sessionId) =>
              handleAnalyzeAbandonment(sessionId, getHeaders, setAbandonedSessions)
            }
            analyzingId={analyzingSessionId}
          />

          {/* 2. Abandoned Session Details Drawer & Recovery Link Action Generator */}
          <AbandonedCaseDrawer
            session={selectedAbandonedSession}
            onClose={() => {
              setSelectedAbandonedSession(null);
              setAbandonmentAnalysisError(null);
            }}
            onAnalyze={(sessionId) => handleAnalyzeAbandonment(sessionId, getHeaders, setAbandonedSessions)}
            isAnalyzing={analyzingSessionId === selectedAbandonedSession?.sessionId}
            analysisError={abandonmentAnalysisError}
          />
        </div>
      )}
    </MerchantLayout>
  );
}
