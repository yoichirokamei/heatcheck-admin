import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

interface ImprovementFeedback {
  title: string;
  problem: string;
  solution: string;
  feedback?: {
    rating: "good" | "bad";
    reason?: string;
  };
}

interface AnalysisResultData {
  inputs: {
    clientName: string;
    siteType: string;
    goal: string;
    designerComment: string;
    aiData: Record<string, string>;
  };
  ai_output_raw: Record<string, unknown>;
  final_report_data: {
    score: number;
    summary: string;
    improvements: ImprovementFeedback[];
  };
}

export async function addAnalysisResult(data: AnalysisResultData) {
  // Remove undefined values (Firestore does not support undefined)
  const sanitized = JSON.parse(JSON.stringify(data));

  try {
    const docRef = await addDoc(collection(db, "reports"), {
      ...sanitized,
      timestamp: serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    console.error("addAnalysisResult failed:", err, "\nData:", sanitized);
    throw err;
  }
}
