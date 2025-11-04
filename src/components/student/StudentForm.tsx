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

// Helper function to convert Data URL (from QR) to a Blob for upload
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

  // FIX: Changed to <any> to flexibly hold the entire student object
  const [formData, setFormData] = useState<any>({});

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
    if (!studentId) return;
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

    // FIX: Set the entire data object to preserve image URLs
    setFormData({
      ...data,
      // Convert JSON marks back to a string for the input field
      previous_marks: data.previous_marks ? JSON.stringify(data.previous_marks) : '',
    });
  };

  const uploadImage = async (file: File, path: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    // Use a more unique file name
    const fileName = `${path}/${Date.now()}-${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('student-images') // Make sure 'student-images' is your bucket name
      .upload(fileName, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from('student-images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  /**
   * ✅ THIS IS THE CORRECTED HANDLE SUBMIT FUNCTION
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // --- Part 1: Handle Image Uploads ---
      setUploading(true);
      
      // FIX: Start with existing image URLs from formData to prevent deletion
      let studentImageUrl = formData.student_image_url || null;
      let fatherImageUrl = formData.father_image_url || null;
      let motherImageUrl = formData.mother_image_url || null;

      // Upload new images if they exist
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

      // --- Part 2: Prepare Student Data Payload ---
      const studentPayload = {
        ...formData,
        student_image_url: studentImageUrl,
        father_image_url: fatherImageUrl,
        mother_image_url: motherImageUrl,
        previous_marks: formData.previous_marks ? JSON.parse(formData.previous_marks) : null,
      };

      // Remove properties that aren't columns or should not be copied
      delete studentPayload.qr_code; // Will be regenerated
      delete studentPayload.id; // Not needed in payload
      delete studentPayload.created_at; // Not needed in payload

      // --- Part 3: Handle Create vs. Update (The QR Fix) ---

      if (studentId) {
        // --- A. UPDATE (EDIT) LOGIC ---
        
        // 1. Build the correct URL using the *existing* studentId
        const studentPageUrl = `${window.location.origin}/students/${studentId}`;
        // 2. Generate QR from that URL
        const qrDataUrl = await QRCode.toDataURL(studentPageUrl);
        // 3. Add the new QR code (as a Data URL) to the payload
        (studentPayload as any).qr_code = qrDataUrl;

        // 4. Update in Supabase
        const { error } = await supabase
          .from('students')
          .update(studentPayload)
          .eq('id', studentId);
        if (error) throw error;

      } else {
        // --- B. CREATE (NEW) LOGIC ---
        
        // 1. Insert student *without* QR code to get the new ID
        const { data: newStudent, error: insertError } = await supabase
          .from('students')
          .insert([studentPayload])
          .select() // Need to get the new ID back
          .single();
        
        if (insertError) throw insertError;

        const newStudentId = newStudent.id;

        // 2. Now, build the URL with the *new* ID
        const studentPageUrl = `${window.location.origin}/students/${newStudentId}`;
        // 3. Generate QR from that URL
        const qrDataUrl = await QRCode.toDataURL(studentPageUrl);
        
        // 4. Update the new record with *only* the QR code
        // We save the base64 string, which your <img> tag in StudentDetail can render
        const { error: updateError } = await supabase
          .from('students')
          .update({ qr_code: qrDataUrl })
          .eq('id', newStudentId);

        if (updateError) throw updateError;
      }

      // --- Part 4: Finish ---
      toast({
        title: 'Success',
        description: `Student ${studentId ? 'updated' : 'added'} successfully`,
      });
      onSuccess(); // Close the modal or navigate away

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
