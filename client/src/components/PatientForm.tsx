
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { CreatePatientInput, Patient } from '../../../server/src/schema';

interface PatientFormProps {
  onSubmit: (patient: Patient) => void;
  onCancel: () => void;
  usingFallbackData?: boolean;
}

export function PatientForm({ onSubmit, onCancel, usingFallbackData = false }: PatientFormProps) {
  const [formData, setFormData] = useState<CreatePatientInput>({
    name: '',
    weight_kg: 0,
    age_years: undefined
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Patient name is required');
      return;
    }
    
    if (formData.weight_kg <= 0 || formData.weight_kg > 200) {
      setError('Please enter a valid weight (0.1 - 200 kg)');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let patient: Patient;
      
      if (usingFallbackData) {
        // Create patient locally in demo mode
        patient = {
          id: Date.now(), // Simple ID for demo
          name: formData.name.trim(),
          weight_kg: formData.weight_kg,
          age_years: formData.age_years || undefined,
          created_at: new Date()
        };
      } else {
        // Try backend creation
        patient = await trpc.createPatient.mutate({
          name: formData.name.trim(),
          weight_kg: formData.weight_kg,
          age_years: formData.age_years || undefined
        });
      }
      
      onSubmit(patient);
      
      // Reset form
      setFormData({
        name: '',
        weight_kg: 0,
        age_years: undefined
      });
    } catch (error) {
      console.error('Failed to create patient:', error);
      setError('Failed to create patient. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {usingFallbackData && (
        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
          💾 Demo Mode: Patient will be stored locally (not persisted)
        </div>
      )}
      
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="patient-name" className="text-sm font-medium">
          Patient Name *
        </Label>
        <Input
          id="patient-name"
          type="text"
          placeholder="Enter patient name"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreatePatientInput) => ({ ...prev, name: e.target.value }))
          }
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="patient-weight" className="text-sm font-medium">
          Weight (kg) *
        </Label>
        <Input
          id="patient-weight"
          type="number"
          placeholder="Enter weight in kg"
          value={formData.weight_kg || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreatePatientInput) => ({ 
              ...prev, 
              weight_kg: parseFloat(e.target.value) || 0 
            }))
          }
          step="0.1"
          min="0.1"
          max="200"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="patient-age" className="text-sm font-medium">
          Age (years, optional)
        </Label>
        <Input
          id="patient-age"
          type="number"
          placeholder="Enter age in years"
          value={formData.age_years || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreatePatientInput) => ({ 
              ...prev, 
              age_years: parseInt(e.target.value) || undefined 
            }))
          }
          min="0"
          max="120"
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? 'Creating...' : '✓ Create Patient'}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
