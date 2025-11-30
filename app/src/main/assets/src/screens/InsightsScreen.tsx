import React from 'react';
import { Brain, Sparkles, Cpu, LayoutGrid, XCircle, CheckCircle, AlertTriangle, Info, Download } from 'lucide-react';
import { GlassCard, NeonButton } from '../components/Common';
import { useNexus } from '../context/NexusContext';

export default function InsightsScreen() {
    const { isAnalyzing, aiSuggestions, runTrafficAnalysis, exportAnalysis } = useNexus();

    return (
        <div className="space-y-6">
            <GlassCard borderColor="purple">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center">
                    <Brain size={20} className="mr-2 text-purple-400"/> AI-Powered Insights
                  </h3>
                  <p className="text-purple-300/60 text-sm">Heuristic analysis of network traffic.</p>
                </div>
                <NeonButton
                    label={isAnalyzing ? "Analyzing..." : "Run Analysis"}
                    onClick={runTrafficAnalysis}
                    icon={Sparkles}
                    color="purple"
                    loading={isAnalyzing}
                    size="sm"
                    fullWidth={false}
                />
              </div>

              <div className="mt-6 space-y-3">
                 {/* ... Logic for displaying analysis status/results ... */}
              </div>
               {aiSuggestions.length > 0 && <NeonButton label="Export Analysis" onClick={exportAnalysis} icon={Download} color="purple" fullWidth={true} />}
            </GlassCard>
        </div>
    );
}