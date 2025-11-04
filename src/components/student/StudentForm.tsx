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

/**
 * NEW HELPER FUNCTION
 * Converts a base64 Data URL (which QRCode.toDataURL generates)
 * into a Blob object that we can upload to Supabase Storage.
 */
function dataURLtoBlob(dataurl: string) {
  const arr = dataurl.split(',');
  const mime = (arr[0].match(/:(.*?);/) || [])[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export function StudentForm({ studentId, onSuccess, onCancel }: StudentFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState<any>({});
  const [images, setImages] = useState({
    student: null as File | null,
    father: null as File | null,
    mother: null as File | null,
  });

  // Make sure this is your correct bucket name!
  const STORAGE_BUCKET = 'student-images';

  useEffect(() => {
    if (studentId) {
      loadStudent();
    }
  }, [studentId]);

  const loadStudent = async () => {
    if (!studentId) return;
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();
    if (error) {
      toast({ title: 'Error', description: 'Failed to load student data', variant: 'destructive' });
      return;
    }
    setFormData({
      ...data,
      previous_marks: data.previous_marks ? JSON.stringify(data.previous_marks) : '',
    });
  };

  const uploadImage = async (file: File | Blob, path: string): Promise<string | null> => {
    const fileExt = file instanceof File ? file.name.split('.').pop() : 'png';
    const fileName = `${path}/${Date.now()}-${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file);
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
    return data.publicUrl;
  };

  /**
   * ✅ CORRECTED HANDLESUBMIT
   * This version now uploads the QR code to storage.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // --- Part 1: Handle Image Uploads ---
      setUploading(true);
      let studentImageUrl = formData.student_image_url || null;
      let fatherImageUrl = formData.father_image_url || null;
      let motherImageUrl = formData.mother_image_url || null;

      if (images.student) studentImageUrl = await uploadImage(images.student, 'students');
      if (images.father) fatherImageUrl = await uploadImage(images.father, 'parents');
      if (images.mother) motherImageUrl = await uploadImage(images.mother, 'parents');
      
      setUploading(false);

      // --- Part 2: Prepare Student Data Payload ---
      const studentPayload = {
        ...formData,
        student_image_url: studentImageUrl,
        father_image_url: fatherImageUrl,
        mother_image_url: motherImageUrl,
        previous_marks: formData.previous_marks ? JSON.parse(formData.previous_marks) : null,
      };
      delete studentPayload.qr_code;
      delete studentPayload.id;
      delete studentPayload.created_at;

      // --- Part 3: Handle Create vs. Update ---
      let finalStudentId = studentId;

      if (studentId) {
        // --- A. UPDATE (EDIT) LOGIC ---
        const { error } = await supabase
          .from('students')
          .update(studentPayload)
          .eq('id', studentId);
        if (error) throw error;
      } else {
        // --- B. CREATE (NEW) LOGIC ---
        // Insert student (qr_code will be null, which is fine)
        const { data: newStudent, error: insertError } = await supabase
          .from('students')
          .insert([studentPayload])
          .select()
          .single();
        if (insertError) throw insertError;
        finalStudentId = newStudent.id; // Get the new ID
      }

      // --- Part 4: ✅ GENERATE AND UPLOAD QR CODE ---
      // This now runs for BOTH create and update
      
      // 1. Build the correct, live URL
      const studentPageUrl = `${window.location.origin}/students/${finalStudentId}`;
      // 2. Generate the QR as a base64 string
      const qrDataUrl = await QRCode.toDataURL(studentPageUrl);
      // 3. Convert it to a Blob
      const qrBlob = dataURLtoBlob(qrDataUrl);
      // 4. Upload the QR Blob to storage
      const qrPublicUrl = await uploadImage(qrBlob, `qr_codes/${finalStudentId}`);

      // 5. Save the *public URL* to the student record
      const { error: qrUpdateError } = await supabase
        .from('students')
        .update({ qr_code: qrPublicUrl })
        .eq('id', finalStudentId);

      if (qrUpdateError) throw qrUpdateError;

      // --- Part 5: Finish ---
      toast({
        title: 'Success',
        description: `Student ${studentId ? 'updated' : 'added'} successfully`,
      });
      onSuccess();

    } catch (error: any) {
      console.error('Error saving student:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save student.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  // --- JSX (No changes below this line) ---
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
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class">Class *</Label>
              <Input
                id="class"
                value={formData.class || ''}
                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roll_number">Roll Number *</Label>
              <Input
                id="roll_number"
                value={formData.roll_number || ''}
                onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_number">Student Phone</Label>
              <Input
                id="phone_number"
                value={formData.phone_number || ''}
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
                value={formData.father_name || ''}
                onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="father_phone">Father's Phone</Label>
              <Input
                id="father_phone"
                value={formData.father_phone || ''}
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
                value={formData.mother_name || ''}
                onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mother_phone">Mother's Phone</Label>
              <Input
                id="mother_phone"
                value={formData.mother_phone || ''}
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
              value={formData.previous_marks || ''}
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
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
