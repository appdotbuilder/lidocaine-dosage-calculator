
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { PatientForm } from './components/PatientForm';
import { DosageResult } from './components/DosageResult';
import { DosageHistory } from './components/DosageHistory';
import type { Patient, Anesthetic, DosageCalculationResult } from '../../server/src/schema';

// Fallback data for when backend is not implemented
const FALLBACK_ANESTHETICS: Anesthetic[] = [
  {
    id: 1,
    name: 'Lidocaine',
    max_dose_mg_per_kg: 4.5,
    common_concentrations: [5, 10, 20],
    created_at: new Date()
  },
  {
    id: 2,
    name: 'Lidocaine with Epinephrine',
    max_dose_mg_per_kg: 7.0,
    common_concentrations: [5, 10, 20],
    created_at: new Date()
  },
  {
    id: 3,
    name: 'Bupivacaine',
    max_dose_mg_per_kg: 2.0,
    common_concentrations: [2.5, 5.0],
    created_at: new Date()
  }
];

function App() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [anesthetics, setAnesthetics] = useState<Anesthetic[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [selectedAnesthetic, setSelectedAnesthetic] = useState<string>('');
  const [concentration, setConcentration] = useState<string>('');
  const [calculationResult, setCalculationResult] = useState<DosageCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string>('');
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [usingFallbackData, setUsingFallbackData] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [patientsData, anestheticsData] = await Promise.all([
        trpc.getPatients.query(),
        trpc.getAnesthetics.query()
      ]);
      setPatients(patientsData);
      setAnesthetics(anestheticsData);
      
      // If no anesthetics exist, try to seed with defaults
      if (anestheticsData.length === 0) {
        try {
          await trpc.seedDefaultAnesthetics.mutate();
          const updatedAnesthetics = await trpc.getAnesthetics.query();
          setAnesthetics(updatedAnesthetics);
        } catch {
          console.warn('Failed to seed anesthetics, using fallback data');
          setAnesthetics(FALLBACK_ANESTHETICS);
          setUsingFallbackData(true);
        }
      }
    } catch (error) {
      console.warn('Backend not available, using fallback data:', error);
      setAnesthetics(FALLBACK_ANESTHETICS);
      setUsingFallbackData(true);
      // Don't show error message for fallback mode
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCalculate = async () => {
    if (!selectedPatient || !selectedAnesthetic || !concentration) {
      setError('Please fill in all required fields');
      return;
    }

    const concentrationNum = parseFloat(concentration);
    if (concentrationNum <= 0) {
      setError('Please enter a valid concentration');
      return;
    }

    setIsCalculating(true);
    setError('');

    try {
      // If using fallback data, calculate locally
      if (usingFallbackData) {
        const patientData = patients.find(p => p.id.toString() === selectedPatient);
        const anestheticData = anesthetics.find(a => a.id.toString() === selectedAnesthetic);
        
        if (!patientData || !anestheticData) {
          throw new Error('Invalid selection');
        }

        // Calculate safe dosage
        const maxSafeDoseMg = patientData.weight_kg * anestheticData.max_dose_mg_per_kg;
        const maxSafeVolumeMl = maxSafeDoseMg / concentrationNum;

        const result: DosageCalculationResult = {
          patient_name: patientData.name,
          patient_weight_kg: patientData.weight_kg,
          anesthetic_name: anestheticData.name,
          concentration_mg_per_ml: concentrationNum,
          max_safe_dose_mg: maxSafeDoseMg,
          max_safe_volume_ml: maxSafeVolumeMl,
          calculation_id: Date.now(), // Simple ID for demo
          calculated_at: new Date()
        };
        
        setCalculationResult(result);
      } else {
        // Try backend calculation
        const result = await trpc.calculateDosage.mutate({
          patient_id: parseInt(selectedPatient),
          anesthetic_id: parseInt(selectedAnesthetic),
          concentration_mg_per_ml: concentrationNum
        });
        
        setCalculationResult(result);
      }
    } catch (error) {
      console.error('Calculation failed:', error);
      setError('Failed to calculate dosage. Please try again.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handlePatientCreated = (patient: Patient) => {
    setPatients((prev: Patient[]) => [...prev, patient]);
    setSelectedPatient(patient.id.toString());
    setShowPatientForm(false);
  };

  const selectedAnestheticData = anesthetics.find(a => a.id.toString() === selectedAnesthetic);
  const selectedPatientData = patients.find(p => p.id.toString() === selectedPatient);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            🏥 Anesthesia Dosage Calculator
          </h1>
          <p className="text-lg text-slate-600">
            Safe Local Anesthetic Dosing for Circumcision Procedures
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Medical Professional Tool
            </Badge>
            {usingFallbackData && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                Demo Mode
              </Badge>
            )}
          </div>
        </div>

        {usingFallbackData && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-700">
              📋 <strong>Demo Mode:</strong> Backend database not available. Using sample anesthetic data for demonstration. 
              Patient data must be added manually and calculations are performed client-side.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Calculator Form */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                🧮 Dosage Calculator
              </CardTitle>
              <CardDescription>
                Calculate safe anesthetic dosages based on patient weight and drug concentration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Patient Selection */}
              <div className="space-y-2">
                <Label htmlFor="patient-select" className="text-sm font-medium text-slate-700">
                  Patient *
                </Label>
                <div className="flex gap-2">
                  <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.length === 0 ? (
                        <SelectItem value="no-patients" disabled>
                          No patients added yet
                        </SelectItem>
                      ) : (
                        patients.map((patient: Patient) => (
                          <SelectItem key={patient.id} value={patient.id.toString()}>
                            {patient.name} ({patient.weight_kg}kg)
                            {patient.age_years && `, ${patient.age_years}y`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowPatientForm(true)}
                    className="shrink-0"
                  >
                    + Add
                  </Button>
                </div>
                {patients.length === 0 && (
                  <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                    👤 Click "Add" to create your first patient
                  </div>
                )}
              </div>

              {/* Anesthetic Selection */}
              <div className="space-y-2">
                <Label htmlFor="anesthetic-select" className="text-sm font-medium text-slate-700">
                  Anesthetic *
                </Label>
                <Select value={selectedAnesthetic} onValueChange={setSelectedAnesthetic}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select anesthetic (e.g., Lidocaine)" />
                  </SelectTrigger>
                  <SelectContent>
                    {anesthetics.map((anesthetic: Anesthetic) => (
                      <SelectItem key={anesthetic.id} value={anesthetic.id.toString()}>
                        {anesthetic.name} (max: {anesthetic.max_dose_mg_per_kg}mg/kg)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedAnestheticData && (
                  <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
                    Common concentrations: {selectedAnestheticData.common_concentrations.join(', ')} mg/mL
                  </div>
                )}
              </div>

              {/* Concentration Input */}
              <div className="space-y-2">
                <Label htmlFor="concentration" className="text-sm font-medium text-slate-700">
                  Concentration (mg/mL) *
                </Label>
                <Input
                  id="concentration"
                  type="number"
                  placeholder="e.g., 10"
                  value={concentration}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConcentration(e.target.value)}
                  step="0.1"
                  min="0.1"
                  max="50"
                />
              </div>

              <Separator />

              {/* Calculate Button */}
              <Button 
                onClick={handleCalculate}
                disabled={isCalculating || !selectedPatient || !selectedAnesthetic || !concentration}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                {isCalculating ? (
                  <>⏳ Calculating...</>
                ) : (
                  <>🔬 Calculate Safe Dosage</>
                )}
              </Button>

              {/* Quick Patient Info */}
              {selectedPatientData && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-800">
                    <strong>Selected:</strong> {selectedPatientData.name}
                    <br />
                    <strong>Weight:</strong> {selectedPatientData.weight_kg} kg
                    {selectedPatientData.age_years && (
                      <>
                        <br />
                        <strong>Age:</strong> {selectedPatientData.age_years} years
                      </>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-6">
            {calculationResult ? (
              <DosageResult result={calculationResult} />
            ) : (
              <Card className="shadow-lg border-0 bg-white/60 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-slate-600">📊 Calculation Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center text-slate-500 py-8">
                    {patients.length === 0 ? (
                      <div className="space-y-2">
                        <div>👤 Add a patient to get started</div>
                        <div className="text-xs">Create patient records to calculate safe dosages</div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div>Select patient, anesthetic, and concentration</div>
                        <div className="text-xs">to calculate safe dosage</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedPatientData && !usingFallbackData && (
              <DosageHistory patientId={selectedPatientData.id} />
            )}

            {usingFallbackData && selectedPatientData && (
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
                  <div className="text-center text-slate-500 py-4">
                    💾 History unavailable in demo mode
                    <div className="text-xs mt-1">Calculations are not persisted without backend database</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Patient Form Modal */}
        {showPatientForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>👤 Add New Patient</CardTitle>
                <CardDescription>
                  Enter patient information for dosage calculations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PatientForm 
                  onSubmit={handlePatientCreated}
                  onCancel={() => setShowPatientForm(false)}
                  usingFallbackData={usingFallbackData}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Medical Disclaimer */}
        <Card className="mt-8 border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <span className="text-amber-600 text-xl">⚠️</span>
              <div className="text-sm text-amber-800">
                <strong>Medical Disclaimer:</strong> This calculator is a clinical aid only. 
                Always verify dosages independently and consider individual patient factors, 
                contraindications, and institutional protocols. The healthcare provider 
                remains solely responsible for patient care decisions.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;
