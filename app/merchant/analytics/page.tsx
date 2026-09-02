"use client";

import React from "react";
import MerchantLayout from "@/components/MerchantLayout";
import MetricsOverview from "@/components/MetricsOverview";
import RecoverySourcePerformance from "@/components/RecoverySourcePerformance";
import AbandonmentAnalyticsSection from "@/components/AbandonmentAnalyticsSection";
import RecoveryPerformance from "@/components/RecoveryPerformance";
import FailureAnalytics from "@/components/FailureAnalytics";

export default function AnalyticsPage() {
  return (
    <MerchantLayout pageTitle="Revenue Analytics & Performance Intelligence">
      {({
        metrics,
        cases,
        performanceData,
        performanceError,
        analyticsData,
        analyticsError,
        abandonedSessions,
        loadingCases,
      }) => (
        <div className="space-y-8">
          {/* 1. Unified Revenue Recovery Overview */}
          <MetricsOverview metrics={metrics} cases={cases} />

          {/* 2. Recovery Source Performance Breakdown & Unified Funnel */}
          <RecoverySourcePerformance metrics={metrics} />

          {/* 3. Abandonment Recovery Analytics */}
          <AbandonmentAnalyticsSection
            metrics={metrics}
            sessions={abandonedSessions}
          />

          {/* 4. Payment Failure Recovery Performance */}
          <RecoveryPerformance
            performance={performanceData}
            isLoading={loadingCases}
            error={performanceError}
          />

          {/* 5. Failure Category Analytics Section */}
          <FailureAnalytics
            analytics={analyticsData}
            isLoading={loadingCases}
            error={analyticsError}
          />
        </div>
      )}
    </MerchantLayout>
  );
}
