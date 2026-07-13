"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { uploadSyllabus } from "@/app/(app)/school/documents-actions";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

export function SyllabusUploadForm({ courses }: { courses: { id: string; title: string }[] }) {
  const [open, setOpen] = useState(false);
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setTitle("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function save() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Choose a file first.");
      return;
    }
    if (!courseId) {
      toast.error("Sync Canvas courses first, or pick a course.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        toast.error("Not signed in.");
        return;
      }

      const storagePath = `${user.id}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(storagePath, file);
      if (uploadError) {
        toast.error(uploadError.message);
        return;
      }

      const result = await uploadSyllabus({
        courseId,
        title: title.trim() || file.name,
        storagePath,
        fileName: file.name,
        mimeType: file.type || null,
        sizeBytes: file.size,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Syllabus uploaded.");
      reset();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        Upload syllabus
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload syllabus</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Course</Label>
            <Select value={courseId} onValueChange={(value) => value && setCourseId(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="syllabus-title">Title</Label>
            <Input
              id="syllabus-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Syllabus — CS 101"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="syllabus-file">File</Label>
            <input
              id="syllabus-file"
              ref={fileInputRef}
              type="file"
              className="text-sm"
              accept=".pdf"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={isPending}>
            {isPending ? "Uploading…" : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
