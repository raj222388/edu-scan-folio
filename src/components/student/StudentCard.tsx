import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StudentCardProps {
  student: {
    id: string;
    name: string;
    class: string;
    roll_number: string;
    phone_number: string | null;
    student_image_url: string | null;
    qr_code: string;
  };
  onEdit: () => void;
  onDelete: () => void;
}

export function StudentCard({ student, onEdit, onDelete }: StudentCardProps) {
  const navigate = useNavigate();

  return (
    <Card className="overflow-hidden hover:shadow-[var(--shadow-hover)] transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
            {student.student_image_url ? (
              <img
                src={student.student_image_url}
                alt={student.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                {student.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{student.name}</h3>
            <p className="text-sm text-muted-foreground">Class: {student.class}</p>
            <p className="text-sm text-muted-foreground">Roll No: {student.roll_number}</p>
            {student.phone_number && (
              <p className="text-sm text-muted-foreground">Phone: {student.phone_number}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/student/${student.id}`)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}