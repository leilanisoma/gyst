import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export type CourseWithAssignments = {
  id: string;
  title: string;
  course_code: string | null;
  term: string | null;
  assignments: {
    id: string;
    title: string;
    due_at: string | null;
    submitted: boolean;
    html_url: string | null;
  }[];
};

function formatDue(dueAt: string | null): string {
  if (!dueAt) return "No due date";
  return new Date(dueAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function CoursesSection({ courses }: { courses: CourseWithAssignments[] }) {
  if (courses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-2 py-4">
          <h2 className="text-sm font-semibold">Courses</h2>
          <p className="text-muted-foreground text-sm">
            No courses synced yet. Connect Canvas above and sync.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {courses.map((course) => {
        const upcoming = course.assignments
          .filter((a) => !a.submitted)
          .sort((a, b) => {
            if (!a.due_at) return 1;
            if (!b.due_at) return -1;
            return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
          });

        return (
          <Card key={course.id}>
            <CardContent className="flex flex-col gap-2 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  {course.title}
                  {course.course_code ? (
                    <span className="text-muted-foreground font-normal"> — {course.course_code}</span>
                  ) : null}
                </h3>
                {course.term ? <Badge variant="secondary">{course.term}</Badge> : null}
              </div>
              {upcoming.length === 0 ? (
                <p className="text-muted-foreground text-sm">No open assignments.</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {upcoming.map((assignment) => (
                    <li
                      key={assignment.id}
                      className="flex items-center justify-between text-sm"
                    >
                      {assignment.html_url ? (
                        <a
                          href={assignment.html_url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline"
                        >
                          {assignment.title}
                        </a>
                      ) : (
                        <span>{assignment.title}</span>
                      )}
                      <span className="text-muted-foreground">{formatDue(assignment.due_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
