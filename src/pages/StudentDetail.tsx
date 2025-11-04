import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudent();
  }, [id]);

  const loadStudent = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load student details',
        variant: 'destructive',
      });
      navigate('/students');
    } else {
      setStudent(data);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="container mx-auto p-6 text-center">Loading...</div>;
  }

  if (!student) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/students')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-4xl font-bold">Student Details</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="text-lg font-semibold">{student.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Class</label>
                  <p className="text-lg font-semibold">{student.class}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Roll Number</label>
                  <p className="text-lg font-semibold">{student.roll_number}</p>
                </div>
                {student.phone_number && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="text-lg font-semibold">{student.phone_number}</p>
                  </div>
                )}
              </div>

              {student.student_image_url && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground block mb-2">
                    Student Photo
                  </label>
                  <img
                    src={student.student_image_url}
                    alt={student.name}
                    className="w-32 h-32 rounded-lg object-cover"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>QR Code</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={student.qr_code}
                alt="Student QR Code"
                className="w-full max-w-[256px] mx-auto"
              />
            </CardContent>
          </Card>

          {(student.father_name || student.mother_name) && (
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Parent Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {student.father_name && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Father's Information</h3>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Name</label>
                        <p className="text-lg">{student.father_name}</p>
                      </div>
                      {student.father_phone && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Phone</label>
                          <p className="text-lg">{student.father_phone}</p>
                        </div>
                      )}
                      {student.father_image_url && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground block mb-2">
                            Photo
                          </label>
                          <img
                            src={student.father_image_url}
                            alt="Father"
                            className="w-32 h-32 rounded-lg object-cover"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {student.mother_name && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Mother's Information</h3>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Name</label>
                        <p className="text-lg">{student.mother_name}</p>
                      </div>
                      {student.mother_phone && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Phone</label>
                          <p className="text-lg">{student.mother_phone}</p>
                        </div>
                      )}
                      {student.mother_image_url && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground block mb-2">
                            Photo
                          </label>
                          <img
                            src={student.mother_image_url}
                            alt="Mother"
                            className="w-32 h-32 rounded-lg object-cover"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {student.previous_marks && (
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Previous Class Marks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(student.previous_marks).map(([subject, marks]) => (
                    <div key={subject} className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground capitalize">{subject}</p>
                      <p className="text-2xl font-bold text-primary">{marks as number}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}