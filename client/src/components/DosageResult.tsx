
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { DosageCalculationResult } from '../../../server/src/schema';

interface DosageResultProps {
  result: DosageCalculationResult;
}

export function DosageResult({ result }: DosageResultProps) {
  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          ✅ Safe Dosage Calculated
        </CardTitle>
        <CardDescription>
          Maximum safe dosage for {result.patient_name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Patient Info */}
        <div className="bg-white/70 p-3 rounded-lg">
          <div className="text-sm text-slate-600 mb-1">Patient Information</div>
          <div className="font-medium text-slate-800">
            {result.patient_name} • {result.patient_weight_kg} kg
          </div>
        </div>

        {/* Anesthetic Info */}
        <div className="bg-white/70 p-3 rounded-lg">
          <div className="text-sm text-slate-600 mb-1">Anesthetic Details</div>
          <div className="font-medium text-slate-800">
            {result.anesthetic_name} • {result.concentration_mg_per_ml} mg/mL
          </div>
        </div>

        <Separator />

        {/* Results */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <div className="text-sm text-blue-600 font-medium">Maximum Safe Dose</div>
              <div className="text-xs text-blue-500">Total medication amount</div>
            </div>
            <Badge className="bg-blue-600 text-white text-lg px-3 py-1">
              {result.max_safe_dose_mg.toFixed(1)} mg
            </Badge>
          </div>

          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div>
              <div className="text-sm text-purple-600 font-medium">Maximum Safe Volume</div>
              <div className="text-xs text-purple-500">Solution to inject</div>
            </div>
            <Badge className="bg-purple-600 text-white text-lg px-3 py-1">
              {result.max_safe_volume_ml.toFixed(2)} mL
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Calculation Details */}
        <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded">
          <div className="flex justify-between items-center">
            <span>Calculation ID: #{result.calculation_id}</span>
            <span>Calculated: {result.calculated_at.toLocaleString()}</span>
          </div>
        </div>

        {/* Safety Warning */}
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-amber-600">⚠️</span>
            <div className="text-xs text-amber-700">
              <strong>Safety Reminder:</strong> Do not exceed these maximum values. 
              Consider patient-specific factors, allergies, and concurrent medications. 
              Always follow institutional protocols.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
