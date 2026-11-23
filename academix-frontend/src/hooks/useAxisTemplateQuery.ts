import { useQuery } from "@tanstack/react-query";
import { axisTemplateKeys } from "../api/queryKeys";
import { getTemplateByAxisId } from "../services/ApiServices";
import { AxisTemplate } from "../types/types";

// Template of an axis (which task fields are required), shared by NewTaskModal (reads it) and
// EditTemplateAxisModal (edits it). `null` = the axis has no template yet; `undefined` = not
// loaded. Saving a template invalidates axisTemplateKeys.byAxis(axisId).
export const useAxisTemplateQuery = (axisId: number | undefined) =>
  useQuery({
    queryKey: axisTemplateKeys.byAxis(axisId),
    queryFn: async (): Promise<AxisTemplate | null> => {
      const data = await getTemplateByAxisId(axisId!);
      return data && data.length > 0 ? data[0] : null;
    },
    enabled: !!axisId,
    staleTime: 0, // refetch on every mount, like the former effects
  });

// What the modals used when the axis has no template: nothing required.
export const emptyAxisTemplate = (axisId: number): AxisTemplate => ({
  axisId,
  files: false,
  checklist: false,
  link: false,
  gradeStage: false,
  duration: false,
  feedBack: false,
  Form: false,
  FileResponse: false,
  SolutionFile: false,
  exposureEnabled: false,
  color: false,
  tags: false,
});
