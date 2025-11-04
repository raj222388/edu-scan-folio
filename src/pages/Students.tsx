import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { StudentCard } from '@/components/student/StudentCard';
import { StudentForm } from '@/components/student/StudentForm';
import { QRScanner } from '@/components/student/QRScanner';
import { useToast } from '@/hooks/use-toast';
import { Plus, QrCode, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Students() {
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editingStudent, setEditingStudent] = useState<string | undefined>();
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [classes, setClasses] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (selectedClass === 'all') {
      setFilteredStudents(students);
    } else {
      setFilteredStudents(students.filter((s) => s.class === selectedClass));
    }
  }, [selectedClass, students]);

  const loadStudents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('class', { ascending: true })
      .order('roll_number', { ascending: true });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load students',
        variant: 'destructive',
      });
    } else {
      setStudents(data || []);
      const uniqueClasses = Array.from(new Set(data?.map((s) => s.class) || []));
      setClasses(uniqueClasses as string[]);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase.from('students').delete().eq('id', deleteId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete student',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Student deleted successfully',
      });
      loadStudents();
    }
    setDeleteId(null);
  };

  const handleScan = (data: string) => {
    const student = students.find((s) => s.qr_code.includes(data));
    if (student) {
      navigate(`/student/${student.id}`);
    } else {
      toast({
        title: 'Not found',
        description: 'No student found with this QR code',
        variant: 'destructive',
      });
    }
  };

  if (showForm) {
    return (
      <div className="container mx-auto p-6">
        <StudentForm
          studentId={editingStudent}
          onSuccess={() => {
            setShowForm(false);
            setEditingStudent(undefined);
            loadStudents();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingStudent(undefined);
          }}
        />
      </div>
    );
  }

  if (showScanner) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
        <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Student Management
            </h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowScanner(true)} variant="outline">
              <QrCode className="mr-2 h-4 w-4" />
              Scan QR
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Filter by Class:</label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls} value={cls}>
                  {cls}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No students found. Add your first student to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                onEdit={() => {
                  setEditingStudent(student.id);
                  setShowForm(true);
                }}
                onDelete={() => setDeleteId(student.id)}
              />
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the student record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}