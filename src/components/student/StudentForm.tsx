import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';
import { Loader2 } from 'lucide-react';

interface StudentFormProps {
  studentId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function StudentForm({ studentId, onSuccess, onCancel }: StudentFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    class: '',
    roll_number: '',
    phone_number: '',
    father_name: '',
    father_phone: '',
    mother_name: '',
    mother_phone: '',
    previous_marks: '',
  });

  const [images, setImages] = useState({
    student: null as File | null,
    father: null as File | null,
    mother: null as File | null,
  });

  useEffect(() => {
    if (studentId) {
      loadStudent();
    }
  }, [studentId]);

  const loadStudent = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load student data',
        variant: 'destructive',
      });
      return;
    }

    setFormData({
      name: data.name,
      class: data.class,
      roll_number: data.roll_number,
      phone_number: data.phone_number || '',
      father_name: data.father_name || '',
      father_phone: data.father_phone || '',
      mother_name: data.mother_name || '',
      mother_phone: data.mother_phone || '',
      previous_marks: data.previous_marks ? JSON.stringify(data.previous_marks) : '',
    });
  };

  const uploadImage = async (file: File, path: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('student-images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from('student-images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUploading(true);

    try {
      let studentImageUrl = null;
      let fatherImageUrl = null;
      let motherImageUrl = null;

      if (images.student) {
        studentImageUrl = await uploadImage(images.student, 'students');
      }
      if (images.father) {
        fatherImageUrl = await uploadImage(images.father, 'parents');
      }
      if (images.mother) {
        motherImageUrl = await uploadImage(images.mother, 'parents');
      }

      setUploading(false);

      const qrData = studentId || `student-${Date.now()}`;
      const qrCode = await QRCode.toDataURL(qrData);

      const studentData = {
        ...formData,
        student_image_url: studentImageUrl,
        father_image_url: fatherImageUrl,
        mother_image_url: motherImageUrl,
        previous_marks: formData.previous_marks ? JSON.parse(formData.previous_marks) : null,
        qr_code: qrCode,
      };

      if (studentId) {
        const { error } = await supabase
          .from('students')
          .update(studentData)
          .eq('id', studentId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('students').insert([studentData]);
        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: `Student ${studentId ? 'updated' : 'added'} successfully`,
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{studentId ? 'Edit Student' : 'Add New Student'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Student Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class">Class *</Label>
              <Input
                id="class"
                value={formData.class}
                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roll_number">Roll Number *</Label>
              <Input
                id="roll_number"
                value={formData.roll_number}
                onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_number">Student Phone</Label>
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="student_image">Student Image</Label>
            <Input
              id="student_image"
              type="file"
              accept="image/*"
              onChange={(e) =>
                setImages({ ...images, student: e.target.files?.[0] || null })
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="father_name">Father's Name</Label>
              <Input
                id="father_name"
                value={formData.father_name}
                onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="father_phone">Father's Phone</Label>
              <Input
                id="father_phone"
                value={formData.father_phone}
                onChange={(e) => setFormData({ ...formData, father_phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="father_image">Father's Image</Label>
            <Input
              id="father_image"
              type="file"
              accept="image/*"
              onChange={(e) =>
                setImages({ ...images, father: e.target.files?.[0] || null })
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mother_name">Mother's Name</Label>
              <Input
                id="mother_name"
                value={formData.mother_name}
                onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mother_phone">Mother's Phone</Label>
              <Input
                id="mother_phone"
                value={formData.mother_phone}
                onChange={(e) => setFormData({ ...formData, mother_phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mother_image">Mother's Image</Label>
            <Input
              id="mother_image"
              type="file"
              accept="image/*"
              onChange={(e) =>
                setImages({ ...images, mother: e.target.files?.[0] || null })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="previous_marks">Previous Marks (JSON format)</Label>
            <Input
              id="previous_marks"
              placeholder='{"math": 85, "science": 90}'
              value={formData.previous_marks}
              onChange={(e) =>
                setFormData({ ...formData, previous_marks: e.target.value })
              }
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploading ? 'Uploading...' : 'Saving...'}
                </>
              ) : (
                studentId ? 'Update Student' : 'Add Student'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}