-- Create reminder type enum
CREATE TYPE public.reminder_type AS ENUM ('time_based', 'interval_based', 'schedule_pattern');

-- Create medication reminders table
CREATE TABLE public.medication_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  created_by UUID NOT NULL,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  reminder_type reminder_type NOT NULL DEFAULT 'time_based',
  reminder_times TEXT[] DEFAULT '{}',
  interval_hours INTEGER,
  schedule_pattern TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medication_reminders ENABLE ROW LEVEL SECURITY;

-- Patients can view their own reminders
CREATE POLICY "Patients can view their own reminders"
ON public.medication_reminders
FOR SELECT
USING (auth.uid() = patient_id);

-- Patients can create their own reminders
CREATE POLICY "Patients can create their own reminders"
ON public.medication_reminders
FOR INSERT
WITH CHECK (auth.uid() = patient_id AND auth.uid() = created_by);

-- Patients can update their own reminders
CREATE POLICY "Patients can update their own reminders"
ON public.medication_reminders
FOR UPDATE
USING (auth.uid() = patient_id);

-- Patients can delete their own reminders
CREATE POLICY "Patients can delete their own reminders"
ON public.medication_reminders
FOR DELETE
USING (auth.uid() = patient_id);

-- Doctors can view all patient reminders
CREATE POLICY "Doctors can view all reminders"
ON public.medication_reminders
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid() AND profiles.role = 'doctor'
));

-- Doctors can create reminders for patients
CREATE POLICY "Doctors can create reminders for patients"
ON public.medication_reminders
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid() AND profiles.role = 'doctor'
) AND auth.uid() = created_by);

-- Doctors can update reminders they created
CREATE POLICY "Doctors can update reminders they created"
ON public.medication_reminders
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.user_id = auth.uid() AND profiles.role = 'doctor'
) AND auth.uid() = created_by);

-- Create trigger for updated_at
CREATE TRIGGER update_medication_reminders_updated_at
BEFORE UPDATE ON public.medication_reminders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();