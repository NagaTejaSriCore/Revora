"use client";

import React, { useState } from "react";
import MerchantLayout, { RecoveryCase } from "@/components/MerchantLayout";
import FailureAnalytics from "@/components/FailureAnalytics";
import CasesTable from "@/components/CasesTable";
import CaseDetailsDrawer from "@/components/CaseDetailsDrawer";

export default function PaymentFailuresPage() {
  const [selectedCase, setSelectedCase] = useState<RecoveryCase | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // AI Analysis API trigger for Payment Failures
  const handleAnalyzeCase = async (caseId: string, getHeaders: Function, fetchDashboardData: Function) => {
    try {
      setIsAnalyzing(true);
      setAnalysisError(null);

      const response = await fetch("/api/recovery/analyze", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ recovery_case_id: caseId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Analysis failed");
      }

      await fetchDashboardData();
      if (selectedCase && selectedCase.id === caseId) {
        setSelectedCase((prev) => (prev ? { ...prev, ...result.data } : null));
      }
    } catch (err: any) {
      console.error("Failure analysis error:", err);
      setAnalysisError(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Recovery Action API trigger
  const handleExecuteAction = async (caseId: string, actionType: string, getHeaders: Function, fetchDashboardData: Function) => {
    try {
      setIsExecutingAction(true);
      setActionError(null);

      const response = await fetch("/api/recovery/action", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ recovery_case_id: caseId, action_type: actionType }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to execute recovery action");
      }

      await fetchDashboardData();
      if (selectedCase && selectedCase.id === caseId) {
        const updatedCase = result.case || result.data;
        if (updatedCase) {
          setSelectedCase((prev) => (prev ? { ...prev, ...updatedCase } : null));
        }
      }
    } catch (err: any) {
      console.error("Recovery action execution error:", err);
      setActionError(err.message || "An error occurred while executing the recovery action.");
    } finally {
      setIsExecutingAction(false);
    }
  };

  return (
    <MerchantLayout pageTitle="Payment Failure Recovery Engine">
      {({ cases, analyticsData, analyticsError, loadingCases, getHeaders, fetchDashboardData }) => (
        <div className="space-y-8">
          {/* 1. Failure Category Analytics Section */}
          <FailureAnalytics
            analytics={analyticsData}
            isLoading={loadingCases}
            error={analyticsError}
          />

          {/* 2. Payment Failure Cases Table */}
          <CasesTable
            cases={cases}
            onSelectCase={(caseItem) => setSelectedCase(caseItem)}
          />

          {/* 3. Case Details Drawer for Payment Failure Recovery */}
          <CaseDetailsDrawer
            recoveryCase={selectedCase}
            onClose={() => {
              setSelectedCase(null);
              setAnalysisError(null);
              setActionError(null);
            }}
            onAnalyze={(caseId) => handleAnalyzeCase(caseId, getHeaders, fetchDashboardData)}
            isAnalyzing={isAnalyzing}
            analysisError={analysisError}
            onExecuteAction={(caseId, actionType) =>
              handleExecuteAction(caseId, actionType, getHeaders, fetchDashboardData)
            }
            isExecutingAction={isExecutingAction}
            actionError={actionError}
          />
        </div>
      )}
    </MerchantLayout>
  );
}
