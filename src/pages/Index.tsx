import { useAuth } from '@/hooks/useAuth';
import PatientDashboard from './PatientDashboard';
import DoctorDashboard from './DoctorDashboard';

export default function Index() {
  const { profile } = useAuth();
  const isDoctor = profile?.role === 'doctor';

  if (isDoctor) {
    return <DoctorDashboard />;
  }

  return <PatientDashboard />;
}