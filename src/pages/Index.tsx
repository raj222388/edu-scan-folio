import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Users, BookOpen, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                School Management System
              </h1>
              <p className="text-muted-foreground">Manage students, teachers, and more</p>
            </div>
          </div>
          {user && (
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mt-12">
          <Card
            className="group cursor-pointer hover:shadow-[var(--shadow-hover)] transition-all duration-300 overflow-hidden"
            onClick={() => navigate('/students')}
          >
            <div className="h-2 bg-gradient-to-r from-primary to-secondary" />
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Students</CardTitle>
              <CardDescription>
                Manage student records, view profiles, and generate QR codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Add and edit student information</li>
                <li>• Upload student and parent photos</li>
                <li>• Auto-generate unique QR codes</li>
                <li>• View students by class</li>
                <li>• Track previous class marks</li>
              </ul>
            </CardContent>
          </Card>

          <Card
            className="group cursor-pointer hover:shadow-[var(--shadow-hover)] transition-all duration-300 overflow-hidden"
            onClick={() => navigate('/teachers')}
          >
            <div className="h-2 bg-gradient-to-r from-secondary to-accent" />
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6 text-secondary" />
              </div>
              <CardTitle className="text-2xl">Teachers</CardTitle>
              <CardDescription>
                View and manage teacher information and assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Manage teacher profiles</li>
                <li>• Track subject assignments</li>
                <li>• Contact information</li>
                <li>• Coming soon...</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="max-w-4xl mx-auto bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Quick Start Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <p className="text-sm">
                <strong>Add Students:</strong> Click on the Students section to add student records
                with all details including photos and previous marks.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <p className="text-sm">
                <strong>QR Codes:</strong> Each student automatically gets a unique QR code that can
                be scanned to view their complete profile.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <p className="text-sm">
                <strong>Scan & View:</strong> Use the QR scanner to quickly access student
                information by scanning their QR code.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
