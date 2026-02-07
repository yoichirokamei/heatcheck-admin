"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Activity,
  Download,
  Loader2,
  RefreshCw,
  Eye,
  X,
  ChevronsLeftRight,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Calculator,
  Printer,
  ArrowLeft,
  Mail,
  Globe,
  Plus,
  Trash2,
  MessageSquare,
} from "lucide-react";

// --- Global Constants ---
const COMPANY_NAME = "合同会社WEBでええじゃないか";
const COMPANY_URL = "https://webdeeejanaika.net/";
const COMPANY_EMAIL = "info@webdeeejanaika.net";
const SERVICE_NAME = "HeatCheck";
const APP_NAME = "HeatCheck Admin";
const LOGO_PATH = "/website_logo_rgb.jpg";
const STAMP_PATH = "/kaisha-in.png";

// --- サイト種別とCVゴールのマッピング ---
const SITE_TYPES = [
  { value: "LP", label: "LP" },
  { value: "HP", label: "HP" },
  { value: "EC", label: "EC" },
  { value: "広告画像", label: "広告画像" },
  { value: "各種サムネイル", label: "各種サムネイル" },
];

const CV_GOALS_BY_SITE_TYPE: Record<string, string[]> = {
  LP: [
    "お問い合わせ獲得",
    "資料請求",
    "資料ダウンロード",
    "申し込み",
    "会員登録",
    "アプリDL",
    "来店予約",
    "商品購入",
    "その他",
  ],
  HP: [
    "お問い合わせ獲得",
    "申し込み",
    "資料請求",
    "資料ダウンロード",
    "会社認知向上",
    "採用応募",
    "来店予約",
    "その他",
  ],
  EC: [
    "商品購入",
    "カート追加",
    "会員登録",
    "リピート購入促進",
    "レビュー投稿",
    "その他",
  ],
  広告画像: [
    "クリック率向上",
    "ブランド認知",
    "商品訴求",
    "キャンペーン告知",
    "その他",
  ],
  各種サムネイル: [
    "クリック率向上",
    "視認性向上",
    "ブランド統一",
    "情報伝達",
    "その他",
  ],
};

// --- Gemini API Configuration ---
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

// --- Helper Components ---
const AutoResizeTextarea = ({
  value,
  onChange,
  className,
  placeholder,
  readOnly = false,
}: any) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      className={className}
      placeholder={placeholder}
      rows={3}
      readOnly={readOnly}
      style={{ overflow: "hidden" }}
    />
  );
};

// A4 Page Container Wrapper (no border-radius)
const A4Page = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`w-[210mm] h-[297mm] mx-auto bg-white shadow-lg print:shadow-none p-[15mm] relative mb-8 print:mb-0 print:break-after-page overflow-hidden flex flex-col ${className}`}
  >
    {children}
  </div>
);

// Common Header for PDF Pages (no border-radius)
const PDFHeader = ({
  title,
  date,
  pageNum,
}: {
  title: string;
  date: string;
  pageNum?: string;
}) => (
  <header className="border-b-2 border-orange-500 pb-4 mb-6 flex justify-between items-end shrink-0">
    <div>
      <div className="flex items-center gap-2 mb-2">
        <img
          src={LOGO_PATH}
          alt={SERVICE_NAME}
          className="h-12 w-auto object-contain"
        />
      </div>
      <h1 className="text-lg font-bold text-slate-700">{title}</h1>
    </div>
    <div className="text-right text-xs text-slate-500">
      <p>{date}</p>
      {pageNum && <p>Page {pageNum}</p>}
    </div>
  </header>
);

// Common Footer for PDF Pages
const PDFFooter = () => (
  <footer className="mt-auto pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 shrink-0">
    <p>
      {SERVICE_NAME} Analysis Report | {COMPANY_NAME}
    </p>
  </footer>
);

export default function HeatCheckAdmin() {
  // --- State Management ---
  const [step, setStep] = useState("input");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Data
  const [clientName, setClientName] = useState("");
  const [siteType, setSiteType] = useState("LP");
  const [goal, setGoal] = useState("お問い合わせ獲得");

  // Optional AI Data inputs
  const [aiData, setAiData] = useState({
    conversion: "",
    distribution: "",
    consistency: "",
    colors: "",
  });
  const [showOptionalInputs, setShowOptionalInputs] = useState(false);

  // CSV Data
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string>("");

  // Images
  const [orgImage, setOrgImage] = useState<File | null>(null);
  const [orgPreview, setOrgPreview] = useState<string | null>(null);
  const [heatImage, setHeatImage] = useState<File | null>(null);
  const [heatPreview, setHeatPreview] = useState<string | null>(null);
  // true = 縦長 (height > width * 1.2), false = 横長・正方形
  const [isVertical, setIsVertical] = useState(true);
  // 画像のアスペクト比 (width / height)
  const [imageAspectRatio, setImageAspectRatio] = useState(1);

  // Analysis Result
  const [result, setResult] = useState<any>(null);
  const [editedImprovements, setEditedImprovements] = useState<any[]>([]);

  // Manual designer notes (editing state)
  const [manualImprovements, setManualImprovements] = useState<any[]>([]);
  // Manual designer notes (saved / committed to report)
  const [savedManualImprovements, setSavedManualImprovements] = useState<any[]>(
    [],
  );
  const [manualSaved, setManualSaved] = useState(false);
  const [designerComment, setDesignerComment] = useState("");

  // UI State
  const [sliderPos, setSliderPos] = useState(50);

  // --- Helpers ---
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "org" | "heat",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);

    // Detect orientation from image dimensions
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const ratio = w / h;
      setImageAspectRatio(ratio);
      // 縦長判定: height > width * 1.2
      setIsVertical(h > w * 1.2);
    };
    img.src = url;

    if (type === "org") {
      setOrgImage(file);
      setOrgPreview(url);
    } else {
      setHeatImage(file);
      setHeatPreview(url);
    }
  };

  // --- Manual Improvement Handlers ---
  const addManualImprovement = () => {
    setManualImprovements([
      ...manualImprovements,
      {
        id: Date.now(),
        title: "",
        problem: "",
        solution: "",
        category: "Level 1 (Text/Color)",
        estimated_price: 5000,
        source: "manual",
        selected: true,
      },
    ]);
  };

  const updateManualImprovement = (
    index: number,
    field: string,
    value: string,
  ) => {
    const updated = [...manualImprovements];
    updated[index][field] = value;
    setManualImprovements(updated);
  };

  const removeManualImprovement = (index: number) => {
    setManualImprovements(manualImprovements.filter((_, i) => i !== index));
  };

  // Save manual improvements
  const saveManualImprovements = () => {
    setSavedManualImprovements([...manualImprovements]);
    setManualSaved(true);
    setTimeout(() => setManualSaved(false), 2000);
  };

  // Combined improvements (AI + saved manual)
  const allImprovements = [...editedImprovements, ...savedManualImprovements];

  // --- AI Analysis Logic ---
  const runAnalysis = async () => {
    if (!orgImage || !heatImage) {
      alert("元画像とヒートマップ画像をアップロードしてください。");
      return;
    }

    setLoading(true);
    setError(null);
    setStep("analyzing");

    try {
      const orgBase64 = await fileToBase64(orgImage);
      const heatBase64 = await fileToBase64(heatImage);

      const systemPrompt = `
        あなたはWeb制作会社「${COMPANY_NAME}」の、**コンバージョン獲得に特化した**Webマーケティング・コンサルタントです。
        クライアント（${clientName || "顧客"}様）の${siteType}のヒートマップ解析を行い、売上アップのための実践的な提案を行います。

        【最重要：デザイナー（人間のプロ）による事前所感】
        今回の解析にあたり、担当デザイナーから以下のコメントが寄せられています。
        このコメントの「温度感（肯定的か否定的か）」と「指摘ポイント」を最優先のコンテキストとして解析してください。

        """
        ${designerComment || "特になし（フラットな視点で解析してください）"}
        """

        **スコアリング・改善案抽出の指針:**
        1. **デザイナーが「良い」と評価している場合:**
           - 基本的に高得点（80〜95点）のレンジで評価してください。
           - 「なぜ良いのか」をヒートマップのデータ（赤色エリアなど）を用いて理論的に補強してください。
           - 改善案は「さらによくするための微調整」レベルに留めてください。
        2. **デザイナーが「懸念がある」「悪い」と評価している場合:**
           - 厳しめの点数（40〜60点）をつけてください。
           - デザイナーが懸念している箇所が、実際にヒートマップ上でどうなっているか（見られていない青色エリアなど）を指摘してください。
        3. **コメントがない場合:**
           - 通常通り、客観的なコンバージョン視点で採点してください（標準60〜70点スタート）。

        【重要：プロフェッショナルな評価基準】
        教科書的なデザイン理論ではなく、**「実際のユーザー行動（ヒートマップ）」に基づいた成果重視の採点**を行ってください。

        1. **人物写真の評価（バンパイア効果の真偽）**:
           - 顔に視線が集まるのは本能であり、必ずしも悪くありません。
           - **OKパターン:** 顔が注目され、かつ「隣接するキャッチコピーやCTA」も赤/黄色になっている → **「信頼獲得に成功」として高評価**。
           - **NGパターン:** 顔だけが真っ赤で、キャッチコピーやCTAが青色（無視） → 「バンパイア効果」として減点。

        2. **情報量と密度の評価**:
           - LPにおいて情報量が多いことは、説得材料として正義の場合があります。
           - **OKパターン:** 情報が詰め込まれていても、テキスト部分が赤/黄色で表示されている → **「熟読されている（高い関心）」として高評価**。
           - **NGパターン:** 情報が多いが、視線が散漫（緑や青ばかり）でどこも読まれていない → 「ノイズ過多」として減点。

        3. **CTA（コンバージョンエリア）**:
           - 最も重要なのはボタンやフォームへの視線です。ここが寒色（青）の場合は厳しく減点してください。

        【スコアリングロジック (100点満点)】
        - **基本点:** デザインが機能していれば **60点** をベースラインとします。
        - **加点要素 (+):** CTAが赤い(+10)、キャッチコピーが熟読されている(+10)、視線誘導がスムーズ(+10)、信頼性要素（顔/権威性）が見られている(+10)。
        - **減点要素 (-):** CTAが見られていない(-20)、ファーストビューで離脱（全体が青い）(-20)、全く読まれていないセクションがある(-10)。
        ※「なんとなく30点」のような極端に低い点数は、CTAが完全に無視されている場合のみにつけてください。

        【改善提案リスト (improvements) の作成ルール】
        - **課題の数は固定ではありません。** デザインの状態に合わせて可変させてください。
        - 良いデザインで課題が少ない場合は1〜2個でも構いません。
        - 悪いデザインの場合は、重要な順に3〜5個以上列挙してください。
        - 各課題は「具体的」かつ「専門的」に指摘してください。
        - 「無理に課題を作らない」かつ「問題点は見逃さず全て列挙する」方針。

        【Attention Insight AI Reference Data】
        Use these hints if available:
        1. Conversion: ${aiData.conversion}
        2. Distribution: ${aiData.distribution}
        3. Consistency: ${aiData.consistency}
        4. Colors: ${aiData.colors}

        ${csvData ? `【Attention Insight AOI解析データ (CSV)】:\n${csvData}` : ""}

        【解析プロセス】
        解析は以下の2ステップで行ってください：

        **ステップ1: 定量分析 (quantitative_analysis)**
        - CSVデータやAttention Insightの数値データに基づき、客観的な事実のみを抽出します。
        - 各要素（CTA、ヘッダー、画像等）の注目度(%)、AOI面積比、視線集中度などの数値を用いて評価します。
        - 主観的な解釈は含めず、データが示す事実のみを記述します。

        **ステップ2: 定性分析 (qualitative_analysis)**
        - デザインの専門的な視点から、定量データでは測れない評価を行います。
        - 配色・レイアウト・タイポグラフィ・視線誘導・ブランド一貫性などのデザイン要素を評価します。
        - プロのWebデザイナー/UXコンサルタントとしての考察を記述します。

        【見積もり算出ロジック】
        1. Level 1 (Text/Color): 5000 〜 10000
        2. Level 2 (Image): 10000 〜 30000
        3. Level 3 (Layout): 30000 〜 50000
        4. Renewal (LP): 200000〜
        5. Renewal (HP): 300000〜

        【サマリー生成の絶対ルール（Tone & Manner）】
        - **「デザイナーの指摘通り」「ご入力いただいた懸念の通り」等のメタな発言は禁止です。** 入力された所感は、あくまで「解析のヒント」として内部的に使い、出力文には含めないでください。
        - 全ての分析結果は、あくまで「HeatCheckのAI解析とヒートマップデータに基づいた客観的な事実」として、**「私（HeatCheck）の言葉」**で語ってください。
        - デザイナーの懸念点が的中していた場合も、「解析データからも、〇〇という課題が顕著に表れています」という表現に変換してください。

        【出力フォーマット (JSONのみ)】
        {
          "score": (0-100の整数),
          "score_reason": "プロの視点で評価理由を解説（「顔が見られているため信頼性が高い」など現場レベルの分析を含める）。デザイナーへの言及は禁止。",
          "quantitative_analysis": {
            "summary": "数値データに基づいた客観的な分析サマリー（CSVデータやAttention Insightの数値を引用）",
            "details": [
              {
                "element": "要素名（例: CTA、ヘッダー、メイン画像）",
                "value": "数値（例: 1.7%、32%）",
                "assessment": "High / Medium / Low",
                "comment": "この数値が意味すること"
              }
            ]
          },
          "qualitative_analysis": {
            "summary": "デザイン視点での分析サマリー（配色、レイアウト、視線誘導等の専門的考察）",
            "design_points": ["配色に関する考察", "レイアウトに関する考察", "視線誘導に関する考察"]
          },
          "summary": "クライアントへの総合提案メッセージ。良い点は「勝ちパターン」として認め、改善点は「さらにCVRを上げるための施策」としてポジティブに提案。HeatCheck主体の一人称で語ること。",
          "improvements": [
            {
              "id": 1,
              "title": "改善提案タイトル",
              "problem": "現状の課題（ヒートマップの事実に基づく）",
              "solution": "具体的な修正内容",
              "category": "Level 1 (Text/Color)",
              "estimated_price": (数値のみ)
            }
          ]
        }
      `;

      const contentParts = [
        { text: `分析対象: ${siteType}, ゴール: ${goal}` },
        { inlineData: { mimeType: orgImage.type, data: orgBase64 } },
        { inlineData: { mimeType: heatImage.type, data: heatBase64 } },
      ];

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: contentParts }],
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0,
            },
          }),
        },
      );

      if (!response.ok) throw new Error("API Request Failed");

      const data = await response.json();
      const textResponse = data.candidates[0].content.parts[0].text;
      const jsonResult = JSON.parse(textResponse);

      setResult(jsonResult);
      setEditedImprovements(
        jsonResult.improvements.map((imp: any) => ({
          ...imp,
          selected: true,
          source: "ai",
        })),
      );
      setStep("diagnosis");
    } catch (err) {
      console.error(err);
      setError("解析中にエラーが発生しました。");
      setStep("input");
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers ---
  const handlePriceChange = (index: number, newPrice: string) => {
    const updated = [...editedImprovements];
    updated[index].estimated_price = Number(newPrice);
    setEditedImprovements(updated);
  };

  const handleTextChange = (index: number, field: string, newValue: string) => {
    const updated = [...editedImprovements];
    updated[index][field] = newValue;
    setEditedImprovements(updated);
  };

  const toggleSelection = (index: number) => {
    const updated = [...editedImprovements];
    updated[index].selected = !updated[index].selected;
    setEditedImprovements(updated);
  };

  const handleSavedManualTextChange = (
    index: number,
    field: string,
    value: string,
  ) => {
    const updated = [...savedManualImprovements];
    updated[index][field] = value;
    setSavedManualImprovements(updated);
  };

  const handleManualPriceChange = (index: number, newPrice: string) => {
    const updated = [...savedManualImprovements];
    updated[index].estimated_price = Number(newPrice);
    setSavedManualImprovements(updated);
  };

  const toggleManualSelection = (index: number) => {
    const updated = [...savedManualImprovements];
    updated[index].selected = !updated[index].selected;
    setSavedManualImprovements(updated);
  };

  const calculateTotal = () => {
    return allImprovements
      .filter((item) => item.selected)
      .reduce((acc, curr) => acc + curr.estimated_price, 0);
  };

  const handlePrint = () => {
    window.print();
  };

  // --- Pagination Helper ---
  const chunkItems = (items: any[], perPage: number) => {
    const pages: any[][] = [];
    for (let i = 0; i < items.length; i += perPage) {
      pages.push(items.slice(i, i + perPage));
    }
    return pages;
  };

  // --- PDF Content Views ---

  // 1. Diagnosis Report
  const DiagnosisReportView = () => {
    const date = new Date().toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    // Paginate improvements (3 per page)
    const improvementPages = chunkItems(allImprovements, 3);
    let pageCounter = 1;

    return (
      <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white font-sans text-slate-800">
        {/* Actions (Hidden on Print) */}
        <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
          <button
            onClick={() => setStep("diagnosis")}
            className="flex items-center gap-2 text-slate-600 font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> 戻る
          </button>
          <button
            onClick={handlePrint}
            className="bg-slate-900 text-white px-6 py-3 shadow flex items-center gap-2 font-bold"
          >
            <Printer className="w-4 h-4" /> 印刷 / PDF保存
          </button>
        </div>

        {/* --- Page 1: Title Page --- */}
        <A4Page>
          <PDFHeader
            title="Webサイト アテンション解析レポート"
            date={date}
            pageNum={String(pageCounter++)}
          />

          <div className="flex-1 flex flex-col items-center">
            <div className="flex-[4]"></div>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-slate-800 mb-6 tracking-tight">
                Webサイト<br />アテンション解析レポート
              </h2>
              <div className="w-24 h-1 bg-orange-500 mx-auto mb-8"></div>
              <p className="text-lg text-slate-500">
                Attention Insight ヒートマップ解析に基づく診断結果
              </p>
            </div>
            <div className="flex-[6]"></div>

            <div className="mb-24 text-center">
              <p className="text-lg text-slate-600 mb-1">
                {clientName || "お客様"} 御中
              </p>
              <div className="text-xs text-slate-400 space-y-0.5 mt-2">
                <p>対象サイト: {siteType}　／　解析目的: {goal}</p>
                <p>発行日: {date}</p>
              </div>
            </div>
          </div>
          <PDFFooter />
        </A4Page>

        {/* --- Page 2: Score & Qualitative Analysis --- */}
        <A4Page>
          <PDFHeader
            title="総合得点・デザイン定性分析"
            date={date}
            pageNum={String(pageCounter++)}
          />

          <div className="flex-1">
            {/* Score */}
            <div className="border border-slate-200 p-10 mb-10">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">
                Web Health Score
              </h3>
              <div className="flex items-center justify-center gap-4">
                <span
                  className={`text-8xl font-black ${result.score < 50 ? "text-red-600" : "text-orange-500"}`}
                >
                  {result.score}
                </span>
                <span className="text-3xl text-slate-300 font-bold mt-8">
                  /100
                </span>
              </div>
              <div className="mt-6 px-6 py-2 border border-slate-200 text-slate-600 font-bold text-left">
                判定: {result.score_reason}
              </div>
            </div>

            {/* Qualitative Analysis */}
            {result.qualitative_analysis && (
              <div className="mb-6">
                <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-600" />
                  デザイン定性分析（プロの考察）
                </h4>
                <div className="text-sm leading-relaxed text-slate-700 p-4 border-l-4 border-purple-500 mb-3">
                  {result.qualitative_analysis.summary}
                </div>
                {result.qualitative_analysis.design_points && result.qualitative_analysis.design_points.length > 0 && (
                  <ul className="space-y-1 pl-4">
                    {result.qualitative_analysis.design_points.map((point: string, i: number) => (
                      <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                        <span className="text-purple-500 mt-1 shrink-0">&#9654;</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          <PDFFooter />
        </A4Page>

        {/* --- Page 3: Quantitative Analysis & Summary --- */}
        <A4Page>
          <PDFHeader
            title="定量データ分析・総合提案"
            date={date}
            pageNum={String(pageCounter++)}
          />

          <div className="flex-1">
            {/* Quantitative Analysis */}
            {result.quantitative_analysis && (
              <div className="mb-8">
                <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  定量データ分析（数値の事実）
                </h4>
                <div className="text-sm leading-relaxed text-slate-700 p-4 border-l-4 border-blue-500 mb-3">
                  {result.quantitative_analysis.summary}
                </div>
                {result.quantitative_analysis.details && result.quantitative_analysis.details.length > 0 && (
                  <table className="w-full text-xs border border-slate-200">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="p-2 text-left">要素</th>
                        <th className="p-2 text-center">数値</th>
                        <th className="p-2 text-center">評価</th>
                        <th className="p-2 text-left">コメント</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {result.quantitative_analysis.details.map((d: any, i: number) => (
                        <tr key={i}>
                          <td className="p-2 font-medium">{d.element}</td>
                          <td className="p-2 text-center font-mono">{d.value}</td>
                          <td className="p-2 text-center">
                            <span className={`px-2 py-0.5 text-xs font-bold ${d.assessment === "High" ? "bg-green-100 text-green-700" : d.assessment === "Medium" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                              {d.assessment}
                            </span>
                          </td>
                          <td className="p-2 text-slate-600">{d.comment}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Summary */}
            <div className="mb-8">
              <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-600" />
                総合提案メッセージ
              </h4>
              <div className="text-sm leading-relaxed text-slate-700 p-6 border-l-4 border-orange-500">
                {result.summary}
              </div>
            </div>
          </div>
          <PDFFooter />
        </A4Page>

        {/* --- Page 2: Visual Data --- */}
        <A4Page>
          <PDFHeader
            title="視覚解析データ詳細"
            date={date}
            pageNum={String(pageCounter++)}
          />

          {/* Main content area: flex-1 で残り高さを全て占有 */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Title: 固定高さ */}
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <Eye className="w-5 h-5 text-orange-600" />
              <h3 className="font-bold text-lg text-slate-700">
                アテンション・ヒートマップ分析
              </h3>
            </div>

            {/* Image Container: flex-1 + min-h-0 で残り高さを占有し、はみ出さない */}
            <div
              className={`flex-1 min-h-0 ${isVertical ? "grid grid-cols-2" : "flex flex-col"} gap-3`}
            >
              {/* Original Design */}
              <div className="flex flex-col min-h-0 overflow-hidden">
                <div className="bg-slate-100 text-slate-600 text-center text-xs font-bold py-1.5 shrink-0">
                  Original Design
                </div>
                <div className="flex-1 min-h-0 border border-slate-200 p-1 overflow-hidden">
                  {orgPreview && (
                    <img
                      src={orgPreview}
                      alt="Original"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              </div>

              {/* Attention Heatmap */}
              <div className="flex flex-col min-h-0 overflow-hidden">
                <div className="bg-red-100 text-red-600 text-center text-xs font-bold py-1.5 shrink-0">
                  Attention Heatmap
                </div>
                <div className="flex-1 min-h-0 border border-red-200 p-1 overflow-hidden">
                  {heatPreview && (
                    <img
                      src={heatPreview}
                      alt="Heatmap"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Note: 固定高さ */}
            <p className="text-xs text-slate-400 mt-2 shrink-0">
              ※赤色が濃い箇所ほど、ユーザーの視線が集中していることを示します（Attention
              Insight予測モデルによる解析）。
            </p>
          </div>

          <PDFFooter />
        </A4Page>

        {/* --- Page 3+: Issues & Improvements (paginated) --- */}
        {improvementPages.map((pageItems, pageIdx) => (
          <A4Page key={`imp-page-${pageIdx}`}>
            <PDFHeader
              title="検出された課題と改善方針"
              date={date}
              pageNum={String(pageCounter++)}
            />

            <div className="flex-1">
              <div className="space-y-4">
                {pageItems.map((item: any, idx: number) => {
                  const globalIdx = pageIdx * 3 + idx;
                  return (
                    <div
                      key={globalIdx}
                      className="border border-slate-200 p-5"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <span className="bg-slate-800 text-white text-xs font-bold px-3 py-1">
                          {item.source === "manual" ? "Designer" : "AI"} Issue{" "}
                          {String(globalIdx + 1).padStart(2, "0")}
                        </span>
                        <h4 className="font-bold text-lg text-slate-800">
                          {item.title}
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        <div className="border-l-4 border-red-400 pl-4">
                          <p className="text-xs font-bold text-red-500 mb-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> 現状の課題
                          </p>
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {item.problem}
                          </p>
                        </div>
                        <div className="border-l-4 border-blue-400 pl-4">
                          <p className="text-xs font-bold text-blue-600 mb-2 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> 改善の方針
                          </p>
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {item.solution}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <PDFFooter />
          </A4Page>
        ))}

        {/* --- Last Page: Company Info --- */}
        <A4Page>
          <PDFHeader
            title="運営企業・お問い合わせ"
            date={date}
            pageNum={String(pageCounter++)}
          />

          <div className="flex-1 flex flex-col items-center text-center pt-8">
            <div className="w-full max-w-lg p-10 mb-12">
              <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-200 pb-4">
                本レポートに関するご相談・お問い合わせ
              </h3>
              <p className="text-sm text-slate-600 mb-8 leading-relaxed">
                本レポートで検出された課題の具体的な改修、または詳細な分析については、
                <br />
                下記までお気軽にご相談ください。
              </p>

              <div className="space-y-4 text-left inline-block">
                <div className="flex items-center gap-4 p-4 border border-slate-200">
                  <div className="text-orange-600">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">
                      お問い合わせメール
                    </p>
                    <p className="font-bold text-slate-700">{COMPANY_EMAIL}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 border border-slate-200">
                  <div className="text-blue-600">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">
                      公式ウェブサイト
                    </p>
                    <p className="font-bold text-slate-700">{COMPANY_URL}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-slate-500 text-sm">
              <p className="font-bold text-lg text-slate-700 mb-1">
                {COMPANY_NAME}
              </p>
              <p className="text-xs text-slate-400 mb-4">
                Webマーケティング / UIUX改善 / サイト制作
              </p>
            </div>
          </div>
          <PDFFooter />
        </A4Page>
      </div>
    );
  };

  // 2. Estimate Report
  const EstimateReportView = () => {
    const date = new Date().toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const selectedItems = allImprovements.filter((i: any) => i.selected);
    const total = selectedItems.reduce(
      (acc: number, curr: any) => acc + curr.estimated_price,
      0,
    );
    const tax = Math.floor(total * 0.1);

    // Paginate detail items (3 per page)
    const detailPages = chunkItems(selectedItems, 3);
    let pageCounter = 1;

    return (
      <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white font-sans text-slate-800">
        {/* Actions */}
        <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
          <button
            onClick={() => setStep("estimate")}
            className="flex items-center gap-2 text-slate-600 font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> 戻る
          </button>
          <button
            onClick={handlePrint}
            className="bg-slate-900 text-white px-6 py-3 shadow flex items-center gap-2 font-bold"
          >
            <Printer className="w-4 h-4" /> 印刷 / PDF保存
          </button>
        </div>

        {/* --- Page 1: Estimate Summary --- */}
        <A4Page>
          <PDFHeader
            title="Webサイト改善提案・御見積書"
            date={date}
            pageNum={String(pageCounter++)}
          />

          <div className="flex-1">
            {/* Addresses */}
            <div className="flex justify-between items-start mb-12 mt-4">
              <div className="w-3/5">
                <h2 className="text-3xl font-bold border-b-2 border-slate-800 pb-2 mb-4 inline-block pr-12">
                  {clientName || "お客様"} 御中
                </h2>
                <p className="text-sm text-slate-600">
                  件名: {siteType} 改善・改修工事のお見積り
                  <br />
                  有効期限: 発行日より1ヶ月
                </p>
              </div>
              <div className="w-2/5 text-right text-sm">
                <p className="font-bold text-lg mb-1">{COMPANY_NAME}</p>
                <p className="text-slate-500 mb-4">{COMPANY_EMAIL}</p>
                <div className="inline-block relative">
                  <img
                    src={STAMP_PATH}
                    alt="社印"
                    className="w-20 h-20 object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Grand Total Box - white bg + gray border */}
            <div className="border-2 border-slate-300 bg-white p-8 mb-12">
              <div className="flex justify-between items-end border-b border-slate-200 pb-4 mb-4">
                <span className="text-lg font-bold text-slate-800">
                  御見積合計金額 (税込)
                </span>
                <span className="text-5xl font-bold tracking-tight text-slate-800">
                  ¥{(total + tax).toLocaleString()}
                </span>
              </div>
              <div className="text-right text-sm text-slate-500">
                <span className="ml-6">
                  税抜価格: ¥{total.toLocaleString()}
                </span>
                <span className="ml-6">
                  消費税(10%): ¥{tax.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Breakdown Summary */}
            <div className="mb-8">
              <h3 className="font-bold text-slate-700 mb-2 border-l-4 border-orange-500 pl-3">
                概算見積もり内訳
              </h3>
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="p-3 text-left">主な改善内容</th>
                    <th className="p-3 text-right">金額 (税抜)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedItems.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-3 font-medium text-slate-600">
                        {item.title}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-800">
                        ¥{item.estimated_price.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold">
                    <td className="p-3 text-slate-800">合計</td>
                    <td className="p-3 text-right text-slate-800">
                      ¥{total.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <PDFFooter />
        </A4Page>

        {/* --- Page 2+: Details (paginated) --- */}
        {detailPages.map((pageItems, pageIdx) => (
          <A4Page key={`est-page-${pageIdx}`}>
            <PDFHeader
              title="改善提案・作業明細"
              date={date}
              pageNum={String(pageCounter++)}
            />

            <div className="flex-1">
              <table className="w-full text-sm text-left">
                {pageIdx === 0 && (
                  <thead className="bg-slate-100 text-slate-700 border-b-2 border-slate-300">
                    <tr>
                      <th className="p-3 w-12 text-center">No.</th>
                      <th className="p-3">項目 / 施策内容</th>
                      <th className="p-3 w-32 text-right">単価 (税抜)</th>
                    </tr>
                  </thead>
                )}
                <tbody className="divide-y divide-slate-200">
                  {pageItems.map((item: any, idx: number) => {
                    const globalIdx = pageIdx * 3 + idx;
                    return (
                      <tr key={globalIdx}>
                        <td className="p-4 align-top text-center text-slate-500 font-bold">
                          {globalIdx + 1}
                        </td>
                        <td className="p-4 align-top">
                          <p className="font-bold text-slate-800 text-base mb-2">
                            {item.title}
                          </p>
                          <div className="grid grid-cols-1 gap-2 text-xs">
                            <div className="text-slate-500 p-2 border-l-2 border-slate-300">
                              <span className="font-bold mr-1">現状:</span>{" "}
                              {item.problem}
                            </div>
                            <div className="text-slate-700 p-2 border-l-2 border-blue-400">
                              <span className="font-bold text-blue-700 mr-1">
                                施策:
                              </span>{" "}
                              {item.solution}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 align-top text-right font-bold text-slate-800 text-base">
                          ¥{item.estimated_price.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <PDFFooter />
          </A4Page>
        ))}
      </div>
    );
  };

  // --- Main Render Switch ---

  if (step === "pdf_diagnosis") {
    return <DiagnosisReportView />;
  }

  if (step === "pdf_estimate") {
    return <EstimateReportView />;
  }

  // 1. Loading Screen
  if (step === "analyzing") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 shadow-xl max-w-md w-full text-center border-t-4 border-orange-500">
          <Loader2 className="w-16 h-16 text-orange-600 animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            AI解析中...
          </h2>
          <p className="text-slate-500 mb-6">
            ヒートマップおよびAttention Insightデータを統合解析し、
            <br />
            最適な改善案を算出しています。
          </p>
          <div className="w-full bg-slate-100 h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-600 h-full w-2/3 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Common Header for App Mode
  const Header = () => (
    <header className="bg-white border-b border-slate-200 p-4 shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={LOGO_PATH} alt={SERVICE_NAME} className="h-12 w-auto" />
          <div className="border-l border-slate-200 pl-3">
            <h1 className="text-sm font-bold tracking-wider text-slate-800">
              {APP_NAME}
            </h1>
            <p className="text-[10px] text-slate-400">for {COMPANY_NAME}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (
                window.confirm("現在の内容を破棄して新規案件を作成しますか？")
              ) {
                setStep("input");
                setResult(null);
                setEditedImprovements([]);
                setManualImprovements([]);
                setSavedManualImprovements([]);
                setCsvFile(null);
                setCsvData("");
                setClientName("");
                setSiteType("LP");
                setGoal("お問い合わせ獲得");
                setAiData({ conversion: "", distribution: "", consistency: "", colors: "" });
                setShowOptionalInputs(false);
                setOrgImage(null);
                setOrgPreview(null);
                setHeatImage(null);
                setHeatPreview(null);
                setDesignerComment("");
                setError(null);
              }
            }}
            className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-2 text-slate-600 flex items-center gap-2 border border-slate-200"
          >
            <RefreshCw className="w-3 h-3" /> 新規案件
          </button>
        </div>
      </div>
    </header>
  );

  // 2. Diagnosis Screen (Client Facing - NO PRICES)
  if (step === "diagnosis" && result) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20 font-sans">
        <Header />

        <main className="max-w-6xl mx-auto p-8 space-y-16">
          {/* Status Bar */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 shadow-sm flex justify-between items-center">
            <div>
              <h2 className="font-bold text-blue-900 flex items-center gap-2">
                <Eye className="w-5 h-5" /> 診断結果プレビューモード
              </h2>
              <p className="text-sm text-blue-700">
                クライアント提示用画面です。金額は表示されていません。
              </p>
            </div>
            <button
              onClick={() => setStep("pdf_diagnosis")}
              className="bg-white border border-blue-200 text-blue-700 hover:bg-blue-100 px-4 py-2 font-bold text-sm flex items-center gap-2 shadow-sm"
            >
              <FileText className="w-4 h-4" /> 診断結果レポート発行
            </button>
          </div>

          {/* Section 1: Score & Summary */}
          <section className="bg-white shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-600" />
              <h2 className="font-bold text-slate-700">診断サマリー</h2>
            </div>
            <div className="p-8">
              <div className="flex flex-col items-center mb-8">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Web Health Score
                </h3>
                <div className="flex items-center justify-center gap-4">
                  <span
                    className={`text-8xl font-black ${result.score < 50 ? "text-red-600" : "text-orange-500"}`}
                  >
                    {result.score}
                  </span>
                  <span className="text-3xl text-slate-300 font-bold mt-8">
                    /100
                  </span>
                </div>
                <div className="mt-6 inline-block px-6 py-2 border border-slate-200 text-slate-600 font-bold">
                  判定: {result.score_reason}
                </div>
              </div>

              {/* Quantitative Analysis */}
              {result.quantitative_analysis && (
                <div className="p-6 border-l-4 border-blue-500 mb-4">
                  <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-blue-600" /> 定量データ分析（数値の事実）
                  </h4>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap mb-4">
                    {result.quantitative_analysis.summary}
                  </p>
                  {result.quantitative_analysis.details && result.quantitative_analysis.details.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border border-slate-200">
                        <thead className="bg-slate-100 text-slate-600">
                          <tr>
                            <th className="p-3 text-left">要素</th>
                            <th className="p-3 text-center">数値</th>
                            <th className="p-3 text-center">評価</th>
                            <th className="p-3 text-left">コメント</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {result.quantitative_analysis.details.map((d: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="p-3 font-medium">{d.element}</td>
                              <td className="p-3 text-center font-mono font-bold">{d.value}</td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-1 text-xs font-bold ${d.assessment === "High" ? "bg-green-100 text-green-700" : d.assessment === "Medium" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                                  {d.assessment}
                                </span>
                              </td>
                              <td className="p-3 text-slate-600">{d.comment}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Qualitative Analysis */}
              {result.qualitative_analysis && (
                <div className="p-6 border-l-4 border-purple-500 mb-4">
                  <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-purple-600" /> デザイン定性分析（プロの考察）
                  </h4>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap mb-4">
                    {result.qualitative_analysis.summary}
                  </p>
                  {result.qualitative_analysis.design_points && result.qualitative_analysis.design_points.length > 0 && (
                    <ul className="space-y-2">
                      {result.qualitative_analysis.design_points.map((point: string, i: number) => (
                        <li key={i} className="text-slate-700 flex items-start gap-2">
                          <span className="text-purple-500 mt-1 shrink-0">&#9654;</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Summary */}
              <div className="p-6 border-l-4 border-orange-500">
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-600" /> 総合提案メッセージ
                </h4>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {result.summary}
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Before/After Slider */}
          <section className="flex flex-col items-center">
            <div className="w-full text-left mb-4 flex items-center gap-2">
              <div className="w-1 h-6 bg-slate-800"></div>
              <h2 className="text-xl font-bold text-slate-800">
                視覚解析データ比較
              </h2>
              <span className="text-xs text-slate-500 ml-2 bg-slate-100 px-2 py-1">
                スライダーを左右に動かして比較
              </span>
            </div>
            <div
              className="relative shadow-2xl overflow-hidden border-4 border-slate-800 bg-slate-900 group select-none"
              style={{ width: "750px", maxWidth: "100%" }}
            >
              <img
                src={orgPreview || undefined}
                alt="Original"
                className="block w-full h-auto object-contain pointer-events-none"
              />
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPos}%` }}
              >
                <img
                  src={heatPreview || undefined}
                  alt="Heatmap"
                  className="block h-full max-w-none object-contain"
                  style={{ width: "750px" }}
                />
              </div>
              <div
                className="absolute inset-y-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-ew-resize z-20 pointer-events-none"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-2 shadow-lg border border-slate-200">
                  <ChevronsLeftRight className="w-5 h-5 text-slate-800" />
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30 m-0 p-0"
              />
            </div>
          </section>

          {/* Section 3: AI Improvements (Display Only, No Price) */}
          <section className="bg-white shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-slate-800 text-white px-8 py-5 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-bold">
                検出された課題と改善の方向性
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {editedImprovements.map((item: any, idx: number) => (
                <div key={idx} className="p-8 hover:bg-slate-50 transition">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <span className="bg-red-100 text-red-600 font-bold px-2 py-1 text-xs mt-1 shrink-0">
                          課題 {idx + 1}
                        </span>
                        <h3 className="font-bold text-xl text-slate-800">
                          {item.title}
                        </h3>
                      </div>
                      <div className="border-l-4 border-red-400 pl-4">
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {item.problem}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4 relative border-l border-slate-100 pl-0 md:pl-10">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="font-bold text-slate-700">
                          解決ソリューション
                        </span>
                      </div>
                      <div className="border-l-4 border-blue-400 pl-4">
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {item.solution}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Manual Improvements Display */}
            {manualImprovements.length > 0 && (
              <>
                <div className="bg-slate-700 text-white px-8 py-3 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-orange-300" />
                  <h3 className="text-sm font-bold">デザイナー追記項目</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {manualImprovements.map((item: any, idx: number) => (
                    <div key={idx} className="p-8 hover:bg-slate-50 transition">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                          <div className="flex items-start gap-3">
                            <span className="bg-orange-100 text-orange-600 font-bold px-2 py-1 text-xs mt-1 shrink-0">
                              追記 {idx + 1}
                            </span>
                            <h3 className="font-bold text-xl text-slate-800">
                              {item.title || "(タイトル未入力)"}
                            </h3>
                          </div>
                          <div className="border-l-4 border-red-400 pl-4">
                            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                              {item.problem || "(未入力)"}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-4 relative border-l border-slate-100 pl-0 md:pl-10">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="font-bold text-slate-700">
                              解決ソリューション
                            </span>
                          </div>
                          <div className="border-l-4 border-blue-400 pl-4">
                            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                              {item.solution || "(未入力)"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Manual Improvement Input Area */}
            <div className="bg-orange-50 p-6 border-t-2 border-orange-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-orange-800 flex items-center gap-2">
                  <Plus className="w-5 h-5" /> デザイナー所見の追加
                </h3>
                <button
                  onClick={addManualImprovement}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 text-sm font-bold flex items-center gap-2 shadow"
                >
                  <Plus className="w-4 h-4" /> 項目を追加
                </button>
              </div>
              <p className="text-xs text-orange-600 mb-4">
                ヒートマップ結果を見て気づいた課題と解決策を手動で追加できます。追加項目はレポートと見積もりに反映されます。
              </p>

              {manualImprovements.map((item: any, idx: number) => (
                <div
                  key={item.id}
                  className="bg-white border border-orange-200 p-4 mb-4"
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-orange-700">
                      追記項目 {idx + 1}
                    </span>
                    <button
                      onClick={() => removeManualImprovement(idx)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) =>
                        updateManualImprovement(idx, "title", e.target.value)
                      }
                      placeholder="課題タイトル"
                      className="w-full p-2 border border-slate-200 text-sm font-bold outline-none focus:border-orange-500"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <AutoResizeTextarea
                        value={item.problem}
                        onChange={(e: any) =>
                          updateManualImprovement(
                            idx,
                            "problem",
                            e.target.value,
                          )
                        }
                        placeholder="現状の課題を記入..."
                        className="w-full p-2 border border-slate-200 text-sm outline-none focus:border-red-400"
                      />
                      <AutoResizeTextarea
                        value={item.solution}
                        onChange={(e: any) =>
                          updateManualImprovement(
                            idx,
                            "solution",
                            e.target.value,
                          )
                        }
                        placeholder="改善ソリューションを記入..."
                        className="w-full p-2 border border-slate-200 text-sm outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Save Button */}
              {manualImprovements.length > 0 && (
                <button
                  onClick={saveManualImprovements}
                  className={`w-full py-3 text-sm font-bold flex items-center justify-center gap-2 shadow transition ${
                    manualSaved
                      ? "bg-green-600 text-white"
                      : "bg-slate-800 hover:bg-slate-700 text-white"
                  }`}
                >
                  {manualSaved ? (
                    <>
                      <CheckCircle className="w-4 h-4" /> 保存しました
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />{" "}
                      追記項目を診断結果に保存・反映
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Bottom Action Area */}
            <div className="bg-slate-50 p-8 border-t border-slate-200">
              <div className="max-w-xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setStep("pdf_diagnosis")}
                  className="w-full bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold py-4 shadow-sm transition flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  診断結果をPDFで生成
                </button>
                <button
                  onClick={() => setStep("estimate")}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-4 shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Calculator className="w-5 h-5" />
                  サイトの改善提案を行う
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <p className="text-center text-xs text-slate-500 mt-4">
                「サイトの改善提案を行う」へ進むと、項目の選択と見積もり金額の作成が行えます。
              </p>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // 3. Estimate Editor Screen (Admin/Work Mode - WITH PRICE)
  if (step === "estimate" && result) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20 font-sans">
        <Header />

        <main className="max-w-6xl mx-auto p-8 space-y-8">
          {/* Navigation Back */}
          <button
            onClick={() => setStep("diagnosis")}
            className="text-slate-500 hover:text-slate-800 flex items-center gap-1 text-sm font-bold"
          >
            <ArrowRight className="w-4 h-4 rotate-180" /> 診断結果画面に戻る
          </button>

          <div className="bg-green-50 border-l-4 border-green-500 p-4 shadow-sm">
            <h2 className="font-bold text-green-900 flex items-center gap-2">
              <Calculator className="w-5 h-5" /> 見積もり・提案書作成モード
            </h2>
            <p className="text-sm text-green-700">
              改善提案に含める項目を選択し、内容と金額を調整してください。
            </p>
          </div>

          {/* Section: AI Improvements Editor */}
          <section className="bg-white shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-8 py-5 flex justify-between items-center sticky top-0 z-40">
              <div>
                <h2 className="text-xl font-bold">改善提案 選択・編集</h2>
                <p className="text-xs text-slate-400 mt-1">
                  選択中の項目のみ提案書に含まれます
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block mb-1">
                  選択項目の合計見積
                </span>
                <span className="text-3xl font-bold text-orange-400">
                  ¥{calculateTotal().toLocaleString()}
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {editedImprovements.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className={`p-8 transition border-l-4 ${item.selected ? "bg-white border-green-500" : "bg-slate-50 border-transparent opacity-60"}`}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => toggleSelection(idx)}
                      className="w-6 h-6 text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                    <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 font-bold">
                      AI
                    </span>
                    <span
                      className={`font-bold ${item.selected ? "text-green-700" : "text-slate-400"}`}
                    >
                      {item.selected ? "提案に含める" : "提案から除外"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <span className="bg-red-100 text-red-600 font-bold px-2 py-1 text-xs mt-1 shrink-0">
                          課題 {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) =>
                            handleTextChange(idx, "title", e.target.value)
                          }
                          disabled={!item.selected}
                          className="font-bold text-xl text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-orange-500 outline-none w-full pb-1 disabled:text-slate-400"
                        />
                      </div>
                      <div className="border-l-4 border-red-400 pl-4">
                        <AutoResizeTextarea
                          value={item.problem}
                          onChange={(e: any) =>
                            handleTextChange(idx, "problem", e.target.value)
                          }
                          className="w-full bg-transparent text-base text-slate-700 border-none p-0 focus:ring-0 resize-none leading-relaxed"
                          readOnly={!item.selected}
                        />
                      </div>
                    </div>

                    <div className="space-y-4 relative border-l border-slate-100 pl-0 md:pl-10">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="font-bold text-slate-700">
                          解決ソリューション
                        </span>
                      </div>

                      <div className="border-l-4 border-blue-400 pl-4">
                        <AutoResizeTextarea
                          value={item.solution}
                          onChange={(e: any) =>
                            handleTextChange(idx, "solution", e.target.value)
                          }
                          className="w-full bg-transparent text-base text-slate-700 border-none p-0 focus:ring-0 resize-none leading-relaxed"
                          readOnly={!item.selected}
                        />
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1">
                          {item.category}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-bold">
                            概算費用
                          </span>
                          <div
                            className={`flex items-center gap-1 bg-white border border-slate-200 px-3 py-1 shadow-sm ${!item.selected && "opacity-50"}`}
                          >
                            <span className="text-slate-400 text-sm">¥</span>
                            <input
                              type="number"
                              value={item.estimated_price}
                              onChange={(e) =>
                                handlePriceChange(idx, e.target.value)
                              }
                              disabled={!item.selected}
                              className="w-24 text-right font-bold text-lg text-slate-700 outline-none disabled:text-slate-400"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Manual Improvements in Estimate (saved ones) */}
              {savedManualImprovements.map((item: any, idx: number) => (
                <div
                  key={`manual-${idx}`}
                  className={`p-8 transition border-l-4 ${item.selected ? "bg-white border-orange-500" : "bg-slate-50 border-transparent opacity-60"}`}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => toggleManualSelection(idx)}
                      className="w-6 h-6 text-orange-600 focus:ring-orange-500 cursor-pointer"
                    />
                    <span className="text-xs bg-orange-200 text-orange-700 px-2 py-0.5 font-bold">
                      Designer
                    </span>
                    <span
                      className={`font-bold ${item.selected ? "text-orange-700" : "text-slate-400"}`}
                    >
                      {item.selected ? "提案に含める" : "提案から除外"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <span className="bg-orange-100 text-orange-600 font-bold px-2 py-1 text-xs mt-1 shrink-0">
                          追記 {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) =>
                            handleSavedManualTextChange(
                              idx,
                              "title",
                              e.target.value,
                            )
                          }
                          disabled={!item.selected}
                          className="font-bold text-xl text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-orange-500 outline-none w-full pb-1 disabled:text-slate-400"
                        />
                      </div>
                      <div className="border-l-4 border-red-400 pl-4">
                        <AutoResizeTextarea
                          value={item.problem}
                          onChange={(e: any) =>
                            handleSavedManualTextChange(
                              idx,
                              "problem",
                              e.target.value,
                            )
                          }
                          className="w-full bg-transparent text-base text-slate-700 border-none p-0 focus:ring-0 resize-none leading-relaxed"
                          readOnly={!item.selected}
                        />
                      </div>
                    </div>

                    <div className="space-y-4 relative border-l border-slate-100 pl-0 md:pl-10">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="font-bold text-slate-700">
                          解決ソリューション
                        </span>
                      </div>

                      <div className="border-l-4 border-blue-400 pl-4">
                        <AutoResizeTextarea
                          value={item.solution}
                          onChange={(e: any) =>
                            handleSavedManualTextChange(
                              idx,
                              "solution",
                              e.target.value,
                            )
                          }
                          className="w-full bg-transparent text-base text-slate-700 border-none p-0 focus:ring-0 resize-none leading-relaxed"
                          readOnly={!item.selected}
                        />
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1">
                          {item.category}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-bold">
                            概算費用
                          </span>
                          <div
                            className={`flex items-center gap-1 bg-white border border-slate-200 px-3 py-1 shadow-sm ${!item.selected && "opacity-50"}`}
                          >
                            <span className="text-slate-400 text-sm">¥</span>
                            <input
                              type="number"
                              value={item.estimated_price}
                              onChange={(e) =>
                                handleManualPriceChange(idx, e.target.value)
                              }
                              disabled={!item.selected}
                              className="w-24 text-right font-bold text-lg text-slate-700 outline-none disabled:text-slate-400"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Action Area */}
            <div className="bg-slate-50 p-8 text-center border-t border-slate-200 sticky bottom-0 z-40 shadow-inner">
              <button
                onClick={() => setStep("pdf_estimate")}
                className="bg-slate-900 hover:bg-slate-800 text-white text-lg font-bold px-8 py-4 shadow-lg transition flex items-center justify-center gap-2 mx-auto"
              >
                <FileCheck className="w-5 h-5" />
                改善提案見積書を作製（PDFプレビュー）
              </button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // 4. Input Form Screen (Default)
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <Header />
      <main className="max-w-4xl mx-auto mt-10 p-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            ヒートマップから、
            <span className="text-orange-600">最強の提案書</span>を。
          </h1>
          <p className="text-slate-500">
            視線予測データ(Attention
            Insight)とデザイン画像をアップロードしてください。
            <br />
            Gemini
            1.5が解析し、見積もりロジックに基づいた提案書を自動生成します。
          </p>
        </div>

        <div className="bg-white shadow-xl border border-slate-100 overflow-hidden">
          <div className="bg-slate-50 px-8 py-4 border-b border-slate-200">
            <h2 className="font-bold text-slate-700 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-500" />
              案件エントリー
            </h2>
          </div>

          <div className="p-8 space-y-8">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">
                  クライアント名
                </label>
                <input
                  type="text"
                  className="w-full p-3 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none transition"
                  placeholder="例：株式会社〇〇"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">
                  CVゴール
                </label>
                <div className="relative">
                  <select
                    className="w-full p-3 bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none transition appearance-none"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                  >
                    {(CV_GOALS_BY_SITE_TYPE[siteType] || []).map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                    <ArrowRight className="h-4 w-4 rotate-90" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">
                サイト種別（単価基準）
              </label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                {SITE_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => {
                      setSiteType(type.value);
                      const goals = CV_GOALS_BY_SITE_TYPE[type.value] || [];
                      if (goals.length > 0 && !goals.includes(goal)) {
                        setGoal(goals[0]);
                      }
                    }}
                    className={`p-3 border font-medium text-sm transition-all ${
                      siteType === type.value
                        ? "border-orange-500 bg-orange-50 text-orange-700 ring-1 ring-orange-500"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional AI Data Section */}
            <div className="border border-slate-200 overflow-hidden">
              <button
                onClick={() => setShowOptionalInputs(!showOptionalInputs)}
                className="w-full flex justify-between items-center bg-slate-50 p-3 text-sm font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                <span>[任意] Attention Insight 解析データの追加</span>
                {showOptionalInputs ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showOptionalInputs && (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-white">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">
                      How to optimize for conversions?
                    </label>
                    <AutoResizeTextarea
                      className="w-full p-2 bg-slate-50 border border-slate-200 text-sm focus:border-orange-500 outline-none"
                      placeholder="AIからのコメントを貼り付け..."
                      value={aiData.conversion}
                      onChange={(e: any) =>
                        setAiData({ ...aiData, conversion: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">
                      Is attention distribution optimal?
                    </label>
                    <AutoResizeTextarea
                      className="w-full p-2 bg-slate-50 border border-slate-200 text-sm focus:border-orange-500 outline-none"
                      placeholder="AIからのコメントを貼り付け..."
                      value={aiData.distribution}
                      onChange={(e: any) =>
                        setAiData({ ...aiData, distribution: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">
                      Validate design consistency?
                    </label>
                    <AutoResizeTextarea
                      className="w-full p-2 bg-slate-50 border border-slate-200 text-sm focus:border-orange-500 outline-none"
                      placeholder="AIからのコメントを貼り付け..."
                      value={aiData.consistency}
                      onChange={(e: any) =>
                        setAiData({ ...aiData, consistency: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500">
                      How to improve colors & contrast?
                    </label>
                    <AutoResizeTextarea
                      className="w-full p-2 bg-slate-50 border border-slate-200 text-sm focus:border-orange-500 outline-none"
                      placeholder="AIからのコメントを貼り付け..."
                      value={aiData.colors}
                      onChange={(e: any) =>
                        setAiData({ ...aiData, colors: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            {/* CSV Upload Area */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-600" />
                Attention Insight AOI解析データ（CSV）（任意）
              </label>
              {csvFile ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200">
                  <FileCheck className="w-5 h-5 text-green-600 shrink-0" />
                  <span className="text-sm text-green-800 font-medium truncate flex-1">
                    {csvFile.name}
                  </span>
                  <button
                    onClick={() => {
                      setCsvFile(null);
                      setCsvData("");
                    }}
                    className="text-slate-400 hover:text-red-500 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative group h-20 border-2 border-dashed border-green-300 hover:bg-green-50/50 transition cursor-pointer flex items-center justify-center overflow-hidden">
                  <input
                    type="file"
                    accept=".csv"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setCsvFile(file);
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setCsvData((ev.target?.result as string) || "");
                      };
                      reader.readAsText(file);
                    }}
                  />
                  <Upload className="w-6 h-6 text-green-300 mr-2 group-hover:text-green-400 transition" />
                  <span className="text-xs text-green-500">
                    CSVファイルをアップロード
                  </span>
                </div>
              )}
            </div>

            {/* Upload Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Original Image */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-slate-400"></div>
                  元デザイン画像
                </label>
                <div className="relative group h-48 border-2 border-dashed border-slate-300 hover:bg-slate-50 transition cursor-pointer flex flex-col items-center justify-center overflow-hidden">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => handleImageUpload(e, "org")}
                  />
                  {orgPreview ? (
                    <div className="relative w-full h-full">
                      <img
                        src={orgPreview}
                        alt="Preview"
                        className="h-full w-full object-contain p-2"
                      />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setOrgImage(null);
                          setOrgPreview(null);
                        }}
                        className="absolute top-2 right-2 bg-white/80 p-1 text-slate-500 hover:text-red-500 z-20"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-300 mb-2 group-hover:text-slate-400 transition" />
                      <span className="text-xs text-slate-400">
                        ドラッグ＆ドロップ (1枚)
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Heatmap Image (Single) */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 animate-pulse"></div>
                  ヒートマップ画像
                </label>
                <div className="relative group h-48 border-2 border-dashed border-red-200 bg-red-50/30 hover:bg-red-50 transition cursor-pointer flex flex-col items-center justify-center overflow-hidden">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => handleImageUpload(e, "heat")}
                  />
                  {heatPreview ? (
                    <div className="relative w-full h-full">
                      <img
                        src={heatPreview}
                        alt="Preview"
                        className="h-full w-full object-contain p-2"
                      />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setHeatImage(null);
                          setHeatPreview(null);
                        }}
                        className="absolute top-2 right-2 bg-white/80 p-1 text-red-500 hover:bg-red-100 z-20"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-red-300 mb-2 group-hover:text-red-400 transition" />
                      <span className="text-xs text-red-400 font-medium">
                        クリックして選択 (1枚)
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-orange-500" />
                デザイナー所感・ヒートマップ考察（任意）
              </label>
              <AutoResizeTextarea
                value={designerComment}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setDesignerComment(e.target.value)
                }
                className="w-full border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="例：全体的に良いと思うが、FVでの離脱が懸念。CTAボタンの色が弱いかもしれない。"
              />
            </div>

            <button
              onClick={runAnalysis}
              disabled={loading || !orgImage || !heatImage}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white text-lg font-bold py-4 shadow-lg shadow-orange-500/30 transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" /> 解析中...
                </>
              ) : (
                <>
                  診断・見積もり作成を開始 <ArrowRight className="w-6 h-6" />
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
