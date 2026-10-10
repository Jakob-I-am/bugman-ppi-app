import type { Answers } from "@/lib/report/fields";
import type { FindingCategory } from "@/lib/report/findings";
import type { PhotoItem } from "@/components/PhotoField";

export type EditorFinding = {
  id: string;
  category: FindingCategory;
  element: string;
  location: string;
  description: string;
  recommendation: string;
  detail: string;
  photos: PhotoItem[];
};

export type EditorSection = {
  id: string;
  templateKey: string;
  title: string;
  answers: Answers;
  photos: PhotoItem[];
  findings: EditorFinding[];
};
