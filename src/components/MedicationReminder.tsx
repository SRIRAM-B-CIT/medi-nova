import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/apiClient';
import { 
  Pill, 
  Clock, 
  Plus, 
  Bell, 
  Calendar,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface MedicationReminder {
  id: string;
  patient_id: string;
  created_by: string;
  medication_name: string;
  dosage: string;
  reminder_type: 'time_based' | 'interval_based' | 'schedule_pattern';
  reminder_times: string[];
  interval_hours: number | null;
  schedule_pattern: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

interface MedicationReminderProps {
  patientId?: string; // For doctors to set reminders for specific patients
  isDoctor?: boolean;
}

export default function MedicationReminder({ patientId, isDoctor = false }: MedicationReminderProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [reminders, setReminders] = useState<MedicationReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<MedicationReminder | null>(null);

  const [formData, setFormData] = useState({
    medication_name: '',
    dosage: '',
    reminder_type: 'time_based' as 'time_based' | 'interval_based' | 'schedule_pattern',
    reminder_times: ['08:00'],
    interval_hours: 6,
    schedule_pattern: 'daily',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    notes: '',
    is_active: true
  });

  const targetPatientId = patientId || user?.id;

  useEffect(() => {
    if (targetPatientId) {
      fetchReminders();
    }
  }, [targetPatientId]);

  const fetchReminders = async () => {
    if (!targetPatientId) return;
    
    setIsLoading(true);
    try {
      const data = await apiClient.getMedicationReminders();
      setReminders(data || []);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      toast({
        title: "Error",
        description: "Failed to load medication reminders",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.medication_name || !formData.dosage) {
      toast({
        title: "Error",
        description: "Please fill in medication name and dosage",
        variant: "destructive"
      });
      return;
    }

    const reminderData = {
      patient_id: targetPatientId,
      created_by: user?.id,
      medication_name: formData.medication_name,
      dosage: formData.dosage,
      reminder_type: formData.reminder_type,
      reminder_times: formData.reminder_type === 'time_based' ? formData.reminder_times : [],
      interval_hours: formData.reminder_type === 'interval_based' ? formData.interval_hours : null,
      schedule_pattern: formData.reminder_type === 'schedule_pattern' ? formData.schedule_pattern : null,
      start_date: formData.start_date,
      end_date: formData.end_date || null,
      notes: formData.notes || null,
      is_active: formData.is_active
    };

    try {
      if (editingReminder) {
        await apiClient.updateMedicationReminder(editingReminder.id, reminderData);
      } else {
        await apiClient.createMedicationReminder(reminderData);
      }

      toast({
        title: "Success",
        description: editingReminder ? "Reminder updated successfully" : "Reminder created successfully"
      });
      setIsDialogOpen(false);
      resetForm();
      fetchReminders();
    } catch (error) {
      console.error('Error saving reminder:', error);
      toast({
        title: "Error",
        description: "Failed to save medication reminder",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteMedicationReminder(id);
      toast({
        title: "Success",
        description: "Reminder deleted successfully"
      });
      fetchReminders();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete reminder",
        variant: "destructive"
      });
    }
  };

  const toggleActive = async (reminder: MedicationReminder) => {
    try {
      await apiClient.updateMedicationReminder(reminder.id, { is_active: !reminder.is_active });
      fetchReminders();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update reminder",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      medication_name: '',
      dosage: '',
      reminder_type: 'time_based',
      reminder_times: ['08:00'],
      interval_hours: 6,
      schedule_pattern: 'daily',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      notes: '',
      is_active: true
    });
    setEditingReminder(null);
  };

  const openEditDialog = (reminder: MedicationReminder) => {
    setEditingReminder(reminder);
    setFormData({
      medication_name: reminder.medication_name,
      dosage: reminder.dosage,
      reminder_type: reminder.reminder_type,
      reminder_times: reminder.reminder_times || ['08:00'],
      interval_hours: reminder.interval_hours || 6,
      schedule_pattern: reminder.schedule_pattern || 'daily',
      start_date: reminder.start_date,
      end_date: reminder.end_date || '',
      notes: reminder.notes || '',
      is_active: reminder.is_active
    });
    setIsDialogOpen(true);
  };

  const addTimeSlot = () => {
    setFormData(prev => ({
      ...prev,
      reminder_times: [...prev.reminder_times, '12:00']
    }));
  };

  const removeTimeSlot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      reminder_times: prev.reminder_times.filter((_, i) => i !== index)
    }));
  };

  const updateTimeSlot = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      reminder_times: prev.reminder_times.map((t, i) => i === index ? value : t)
    }));
  };

  const getReminderTypeLabel = (type: string) => {
    switch (type) {
      case 'time_based': return 'Time-based';
      case 'interval_based': return 'Interval';
      case 'schedule_pattern': return 'Schedule';
      default: return type;
    }
  };

  const formatReminderInfo = (reminder: MedicationReminder) => {
    if (reminder.reminder_type === 'time_based' && reminder.reminder_times?.length) {
      return reminder.reminder_times.join(', ');
    }
    if (reminder.reminder_type === 'interval_based' && reminder.interval_hours) {
      return `Every ${reminder.interval_hours} hours`;
    }
    if (reminder.reminder_type === 'schedule_pattern' && reminder.schedule_pattern) {
      return reminder.schedule_pattern.charAt(0).toUpperCase() + reminder.schedule_pattern.slice(1);
    }
    return 'Not set';
  };

  return (
    <Card className="medical-card border-0">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center">
              <Pill className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Medication Reminders</CardTitle>
              <CardDescription>
                {isDoctor ? 'Prescribe medication schedules for patients' : 'Manage your medication schedule'}
              </CardDescription>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                <Plus className="h-4 w-4 mr-1" />
                Add Reminder
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingReminder ? 'Edit Medication Reminder' : 'Add Medication Reminder'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="medication_name">Medication Name</Label>
                  <Input
                    id="medication_name"
                    value={formData.medication_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, medication_name: e.target.value }))}
                    placeholder="e.g., Metformin"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input
                    id="dosage"
                    value={formData.dosage}
                    onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                    placeholder="e.g., 500mg"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Reminder Type</Label>
                  <Select
                    value={formData.reminder_type}
                    onValueChange={(value: 'time_based' | 'interval_based' | 'schedule_pattern') => 
                      setFormData(prev => ({ ...prev, reminder_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="time_based">Time-based (specific times)</SelectItem>
                      <SelectItem value="interval_based">Interval-based (every X hours)</SelectItem>
                      <SelectItem value="schedule_pattern">Schedule pattern (daily/weekly)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.reminder_type === 'time_based' && (
                  <div className="space-y-2">
                    <Label>Reminder Times</Label>
                    {formData.reminder_times.map((time, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={time}
                          onChange={(e) => updateTimeSlot(index, e.target.value)}
                        />
                        {formData.reminder_times.length > 1 && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeTimeSlot(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addTimeSlot}>
                      <Plus className="h-4 w-4 mr-1" /> Add Time
                    </Button>
                  </div>
                )}

                {formData.reminder_type === 'interval_based' && (
                  <div className="space-y-2">
                    <Label htmlFor="interval">Interval (hours)</Label>
                    <Input
                      id="interval"
                      type="number"
                      min="1"
                      max="24"
                      value={formData.interval_hours}
                      onChange={(e) => setFormData(prev => ({ ...prev, interval_hours: parseInt(e.target.value) }))}
                    />
                  </div>
                )}

                {formData.reminder_type === 'schedule_pattern' && (
                  <div className="space-y-2">
                    <Label>Pattern</Label>
                    <Select
                      value={formData.schedule_pattern}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, schedule_pattern: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="twice_daily">Twice Daily</SelectItem>
                        <SelectItem value="every_other_day">Every Other Day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date (optional)</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any special instructions..."
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Active</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>

                <Button onClick={handleSubmit} className="w-full">
                  {editingReminder ? 'Update Reminder' : 'Create Reminder'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading reminders...</div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No medication reminders set</p>
            <p className="text-sm text-muted-foreground">Click "Add Reminder" to create one</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div 
                key={reminder.id} 
                className={`p-4 rounded-lg border transition-all ${
                  reminder.is_active 
                    ? 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800' 
                    : 'bg-muted/50 border-muted'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      reminder.is_active ? 'bg-orange-500' : 'bg-muted-foreground'
                    }`}>
                      <Pill className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{reminder.medication_name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {reminder.dosage}
                        </Badge>
                        {reminder.is_active ? (
                          <Badge className="bg-green-500 text-white text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Paused
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatReminderInfo(reminder)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {getReminderTypeLabel(reminder.reminder_type)}
                        </span>
                      </div>
                      {reminder.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{reminder.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => toggleActive(reminder)}
                      title={reminder.is_active ? 'Pause reminder' : 'Activate reminder'}
                    >
                      <Bell className={`h-4 w-4 ${reminder.is_active ? 'text-orange-500' : 'text-muted-foreground'}`} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => openEditDialog(reminder)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDelete(reminder.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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