
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { DosageCalculation } from '../../../server/src/schema';

interface DosageHistoryProps {
  patientId: number;
}

export function DosageHistory({ patientId }: DosageHistoryProps) {
  const [history, setHistory] = useState<DosageCalculation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const historyData = await trpc.getDosageHistory.query({ patientId });
      setHistory(historyData);
    } catch (error) {
      console.error('Failed to load dosage history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <Card className="shadow-lg border-0 bg-white/60 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-700">
          📋 Previous Calculations
        </CardTitle>
        <CardDescription>
          Dosage calculation history for this patient
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center text-slate-500 py-4">
            Loading history...
          </div>
        ) : history.length === 0 ? (
          <div className="text-center text-slate-500 py-4">
            No previous calculations for this patient
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((calculation: DosageCalculation) => (
              <div 
                key={calculation.id} 
                className="bg-slate-50 p-3 rounded-lg border border-slate-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    #{calculation.id}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    {calculation.calculated_at.toLocaleDateString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-600">Concentration:</span>
                    <div className="font-medium">
                      {calculation.concentration_mg_per_ml} mg/mL
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-600">Max Volume:</span>
                    <div className="font-medium text-purple-600">
                      {calculation.max_safe_volume_ml.toFixed(2)} mL
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
