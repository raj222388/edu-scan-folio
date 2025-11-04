-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  phone_number TEXT,
  student_image_url TEXT,
  father_name TEXT,
  father_image_url TEXT,
  father_phone TEXT,
  mother_name TEXT,
  mother_image_url TEXT,
  mother_phone TEXT,
  previous_marks JSONB,
  qr_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(class, roll_number)
);

-- Enable Row Level Security
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Create policies for students table (public read, authenticated write)
CREATE POLICY "Anyone can view students"
  ON public.students
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert students"
  ON public.students
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update students"
  ON public.students
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete students"
  ON public.students
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create storage bucket for student images
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-images', 'student-images', true);

-- Create storage policies for student images
CREATE POLICY "Anyone can view student images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'student-images');

CREATE POLICY "Authenticated users can upload student images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'student-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update student images"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'student-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete student images"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'student-images' AND auth.role() = 'authenticated');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create teachers table for future use
CREATE TABLE public.teachers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT,
  phone_number TEXT,
  email TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Create policies for teachers table
CREATE POLICY "Anyone can view teachers"
  ON public.teachers
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage teachers"
  ON public.teachers
  FOR ALL
  USING (auth.role() = 'authenticated');