import { appendFile, readFile } from "node:fs/promises";
import path from "node:path";

export type SurveyResponse = {
  id: string;
  province: string;
  district: string | null;
  otherLocation: string | null;
  notificationOptIn: boolean;
  source: "first_visit" | "location_change";
  createdAt: string;
};

const surveyPath = path.join(process.cwd(), "data", "survey-responses.jsonl");

export async function saveSurveyResponse(response: SurveyResponse) {
  await appendFile(surveyPath, `${JSON.stringify(response)}\n`, "utf8");
}

export async function readSurveyResponses() {
  try {
    const contents = await readFile(surveyPath, "utf8");
    return contents
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as SurveyResponse);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}
