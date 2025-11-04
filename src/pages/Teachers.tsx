import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Teachers() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('name', { ascending: true });

    if (!error) {
      setTeachers(data || []);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Teachers
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Teacher Management</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Teacher management features coming soon. This section will allow you to manage teacher
              profiles, subjects, and schedules.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}