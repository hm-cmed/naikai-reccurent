import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json());

// Scenario task and rubric fallback definitions for self-contained server execution
interface ServerRubric {
  id: string;
  label: string;
  points: number;
  description: string;
}

interface ServerTask {
  id: number;
  questionNumber: number;
  title: string;
  questionText: string;
  evaluationFocus: string;
  cautionNotes?: string;
  answerSlideNumber: number;
  rubrics: ServerRubric[];
}

const CKD_FALLBACK_TASKS: ServerTask[] = [
  {
    id: 1,
    questionNumber: 1,
    title: '質問1：初期問診・情報収集',
    questionText: '問診票の内容から、さらに詳しく確認すべき情報は何ですか？',
    evaluationFocus: '問診票の情報を深掘りし、急性腎障害（AKI）の初期評価に必要な四大要素（Intake, Output, Baseline, Drug）を確認できているか',
    cautionNotes: '単に病名を推測するのではなく、病態悪化の原因（脱水、薬剤性など）を特定するための具体的問診項目を評価する。',
    answerSlideNumber: 7,
    rubrics: [
      {
        id: 'intake',
        label: 'Intake（食事・水分摂取量）の確認',
        points: 2,
        description: '体調不良が始まってからの飲水量、食事摂取量、飲めない期間の具体的な確認。'
      },
      {
        id: 'output',
        label: 'Output（尿量・排泄・体重変化）の確認',
        points: 2,
        description: '尿量の減少、排尿回数、下痢・嘔吐の頻度や性状、急激な体重減少の確認。'
      },
      {
        id: 'baseline',
        label: 'Baseline（平常時のCr値・併存疾患）の確認',
        points: 2,
        description: '普段のクレアチニン値（平常時腎機能）や、通院中の併存疾患（糖尿病・心不全等）の確認。'
      },
      {
        id: 'drug',
        label: 'Drug（定期薬＋市販薬＋サプリ）の確認',
        points: 1,
        description: '処方薬の服薬状況に加え、市販の解熱鎮痛薬（NSAIDs等）やサプリメントの内服歴の確認。'
      }
    ]
  },
  {
    id: 2,
    questionNumber: 2,
    title: '質問2：追加身体所見の確認',
    questionText: '脱水や心不全増悪を評価するために、どのような身体所見を追加で確認しますか？',
    evaluationFocus: '体液量過剰（心不全増悪）と体液量減少（脱水）の両面を見極めるフィジカルイグザミネーションを想起できているか',
    answerSlideNumber: 10,
    rubrics: [
      {
        id: 'dehydration_signs',
        label: '脱水・細胞外液量減少の身体所見（口腔乾燥、皮膚ツルゴール低下など）',
        points: 3,
        description: '口腔粘膜の乾燥、腋窩乾燥、前胸部や大腿の皮膚ツルゴール低下などを確認できているか。'
      },
      {
        id: 'overload_signs',
        label: '体液量過剰・心不全徴候（頸静脈怒張の有無など）',
        points: 3,
        description: '外頸静脈の怒張、心音（奔馬調律）、肺副雑音、浮腫などの体液貯留徴候の確認。'
      }
    ]
  },
  {
    id: 3,
    questionNumber: 3,
    title: '質問3：初期診断・病態把握',
    questionText: '現時点での初期診断と、その病態として考えられる要因は何ですか？',
    evaluationFocus: '「CKDを背景としたAKI（脱水による腎前性腎障害およびNSAIDs関連腎障害）」を的確に想起できているか',
    cautionNotes: 'Cr 2.8 mg/dL（平常時1.5）の上昇度合いからAKIの診断基準に該当することを意識する。',
    answerSlideNumber: 13,
    rubrics: [
      {
        id: 'aki_diagnosis',
        label: '急性腎障害（AKI）または CKD on AKI の診断名の提示',
        points: 2,
        description: '平常時Cr 1.5から2.8への急峻な上昇を急性腎障害と判断できている。'
      },
      {
        id: 'prerenal_factor',
        label: '脱水・下痢による腎血流低下（腎前性要素）の指摘',
        points: 2,
        description: '食事水分低下と水様便による有効循環血漿量の減少を腎機能悪化の原因として捉えている。'
      },
      {
        id: 'nsaid_factor',
        label: 'NSAIDs（市販ロキソプロフェン）内服による輸入細動脈収縮の指摘',
        points: 2,
        description: '腰痛に対し内服したNSAIDsがプロスタグランジンを阻害し、腎血流障害を増悪させた点に言及している。'
      }
    ]
  },
  {
    id: 4,
    questionNumber: 4,
    title: '質問4：初期対応と休薬すべき薬剤の判断',
    questionText: '現時点でまず行うべき初期対応と、一時休薬すべき薬剤を挙げてください。',
    evaluationFocus: '初期輸液による腎血流改善と、シックデイ時の「SADMANS」休薬ルールを迅速に判断できているか',
    cautionNotes: '高K血症（5.8 mEq/L）や糖尿病用薬の正常血糖ケトアシドーシスリスクにも配慮する。',
    answerSlideNumber: 15,
    rubrics: [
      {
        id: 'fluid_therapy',
        label: '細胞外液輸液（生食または酢酸リンゲル等）による初期補液',
        points: 2,
        description: '脱水是正と腎循環改善のための速やかな補液療法の実施。'
      },
      {
        id: 'sglt2_stop',
        label: 'SGLT2阻害薬（ダパグリフロジン）の中止（正常血糖ケトアシドーシス・脱水予防）',
        points: 2,
        description: 'シックデイにおけるSGLT2阻害薬の確実な一時休薬の指示。'
      },
      {
        id: 'ras_stop',
        label: 'RAS阻害薬（カンデサルタン）の中止（輸出細動脈拡張によるGFR低下防止）',
        points: 2,
        description: '腎血流低下時のRAS阻害薬の一時休薬判断。'
      },
      {
        id: 'diuretic_stop',
        label: '利尿薬（フロセミド）の中止（脱水の進行防止）',
        points: 2,
        description: '脱水状態のループ利尿薬休薬の判断。'
      },
      {
        id: 'metformin_nsaid_stop',
        label: 'メトホルミン中止（乳酸アシドーシス防止）およびNSAIDs中止',
        points: 1,
        description: '腎機能低下時のメトホルミンおよび鎮痛薬の服用中止指示。'
      }
    ]
  },
  {
    id: 5,
    questionNumber: 5,
    title: '質問5：退院前の患者・家族へのシックデイ指導',
    questionText: '退院前に、本人・家族へシックデイ対応として何を伝えますか？',
    evaluationFocus: '医療者目線だけでなく、患者や家族が家庭で実践できる具体的かつ安全な行動指針を提示できているか',
    answerSlideNumber: 19,
    rubrics: [
      {
        id: 'symptoms_alert',
        label: '体調不良時に注意する症状（発熱・下痢・嘔吐・食欲不振）の共有',
        points: 2,
        description: 'どのような体調不良（発熱、下痢、嘔吐、飲食不良）がシックデイに該当するかを患者・家族に具体的に説明している。'
      },
      {
        id: 'medication_rule',
        label: '一時中止薬の把握と「自己判断で止めっぱなしにしない」ことの強調',
        points: 2,
        description: '体調不良時に一時休止する薬を明確にしつつ、回復後に自己判断で漫然と休薬し続けない（長期中止の不利益防止）よう指導している。'
      },
      {
        id: 'contact_criteria',
        label: '医療機関への連絡・受診・救急要請の明確な目安の提示',
        points: 2,
        description: '症状がどの程度悪化したら病院に電話するか、外来受診や救急要請を検討するかの具体的基準を定めている。'
      },
      {
        id: 'otc_guidance',
        label: '市販薬（NSAIDs等の回避と相談）についての注意喚起',
        points: 1,
        description: '市販の解熱鎮痛薬（ロキソプロフェン等のNSAIDs）を安易に自己服用せず、医師や薬剤師に相談するよう指導している。'
      }
    ]
  }
];

const MASLD_FALLBACK_TASKS: ServerTask[] = [
  {
    id: 1,
    questionNumber: 1,
    title: '質問1：健診での肝機能異常・脂肪肝の鑑別',
    questionText: '健診で肝機能異常（AST/ALT上昇）と脂肪肝を認めた場合、まず問診・情報収集すべき項目は何ですか？',
    evaluationFocus: 'アルコール摂取量、服薬歴、ウイルス性肝炎・自己免疫性肝疾患の除外、生活習慣の把握ができているか',
    cautionNotes: '課題1の段階ではMASLDと断定せず、鑑別に必要な情報の収集を評価する。',
    answerSlideNumber: 5,
    rubrics: [
      {
        id: 'alcohol',
        label: '飲酒歴（エタノール換算量）の確認',
        points: 2,
        description: '過剰飲酒の有無（男性30g/日、女性20g/日未満か）を具体的に聴取できているか。'
      },
      {
        id: 'medication',
        label: '薬剤歴（薬剤性肝障害・脂肪肝惹起薬）の確認',
        points: 2,
        description: 'ステロイド、タモキシフェン、バルプロ酸等の脂肪肝惹起薬やサプリメントの内服歴。'
      },
      {
        id: 'other_liver_diseases',
        label: 'B型・C型肝炎ウイルスマーカー等の他疾患除外項目の確認',
        points: 2,
        description: 'HBV, HCV感染や自己免疫性肝疾患などの他病因の除外を考慮できているか。'
      },
      {
        id: 'metabolic_risks',
        label: '代謝異常リスク因子（肥満、糖尿病、脂質異常、高血圧）の確認',
        points: 2,
        description: 'BMI、腹囲、HbA1c、血圧、中性脂肪などの代謝関連因子の確認。'
      }
    ]
  },
  {
    id: 2,
    questionNumber: 2,
    title: '質問2：MASLD診断基準と病態位置づけ',
    questionText: '他病因が除外され、代謝異常（肥満・2型糖尿病など）を伴う脂肪肝である場合、最新の疾患概念としてどのように診断・位置づけられますか？',
    evaluationFocus: '従来のNAFLDからMASLD（代謝異常関連脂肪性肝疾患）への概念変更と、心血管疾患リスクの重複を理解できているか',
    answerSlideNumber: 7,
    rubrics: [
      {
        id: 'masld_concept',
        label: 'MASLD（代謝異常関連脂肪性肝疾患）の診断名の提示',
        points: 3,
        description: '脂肪肝＋心血管代謝リスク（CMRF）1項目以上でMASLDと診断できることを理解している。'
      },
      {
        id: 'cardiovascular_risk',
        label: '肝疾患だけでなく心血管疾患・メタボリックシンドロームの予後リスクの認識',
        points: 3,
        description: '肝硬変・肝癌だけでなく、心血管死（動脈硬化、心筋梗塞、脳卒中）が主たる予後規定因子であることの言及。'
      }
    ]
  },
  {
    id: 3,
    questionNumber: 3,
    title: '質問3：肝線維化リスクの一次スクリーニング',
    questionText: 'MASLD患者において、肝線維化進行リスクを評価するためにプライマリ・ケアで用いる簡便な指標は何ですか？またその計算に必要な項目を挙げてください。',
    evaluationFocus: 'FIB-4 indexの計算項目（年齢、AST、ALT、血小板数）とカットオフ値の意味を理解できているか',
    answerSlideNumber: 9,
    rubrics: [
      {
        id: 'fib4_index',
        label: 'FIB-4 index（フィブフォー・インデックス）の提示',
        points: 3,
        description: '非侵襲的線維化予測スコアとしてFIB-4 indexを挙げられている。'
      },
      {
        id: 'fib4_components',
        label: '算出項目（年齢、AST、ALT、血小板数）の明記',
        points: 3,
        description: 'FIB-4 indexの計算に必要な4項目（年齢、AST、ALT、Plt）を正しく示せている。'
      }
    ]
  },
  {
    id: 4,
    questionNumber: 4,
    title: '質問4：専門医紹介基準とフォローアップ方針',
    questionText: 'FIB-4 indexで中リスク〜高リスク（例: 1.3以上）となった場合の次のアクションは何ですか？',
    evaluationFocus: '肝臓専門医への紹介基準（二次評価・エラストグラフィやM2BPGi等）と連携判断ができるか',
    answerSlideNumber: 11,
    rubrics: [
      {
        id: 'specialist_referral',
        label: '消化器・肝臓専門医への紹介の判断',
        points: 3,
        description: 'FIB-4 index高値例における専門医療機関への適切なコンサルテーション判断。'
      },
      {
        id: 'secondary_assessment',
        label: 'エラストグラフィ（超音波組織弾性測定）や線維化血清マーカー等による精密検査の認識',
        points: 3,
        description: '専門医でのFibroScanやM2BPGiなどの二次スクリーニングの必要性を理解している。'
      }
    ]
  },
  {
    id: 5,
    questionNumber: 5,
    title: '質問5：包括的治療介入と生活習慣指導',
    questionText: 'MASLD患者の予後改善に向けて、どのような包括的介入（食事・運動・併存症管理）を行いますか？',
    evaluationFocus: '体重減少目標（7〜10%減）、運動療法、糖尿病・脂質異常症・高血圧の積極的介入を総合的に提示できているか',
    answerSlideNumber: 13,
    rubrics: [
      {
        id: 'weight_loss_target',
        label: '体重減少目標（7〜10%減）と食事療法の具体策',
        points: 2,
        description: '線維化改善を目指す7〜10%の減量目標や果糖・清涼飲料水制限などの食事指導。'
      },
      {
        id: 'exercise_therapy',
        label: '有酸素運動およびレジスタンス運動の推奨',
        points: 2,
        description: '週150分以上の中強度有酸素運動や筋力トレーニングの併用指導。'
      },
      {
        id: 'comorbidity_management',
        label: 'SGLT2阻害薬やGLP-1受容体作動薬、スタチン等の併存症治療薬の活用',
        points: 2,
        description: '糖尿病治療薬（SGLT2i、GLP-1RA）の脂肪肝改善効果や脂質・血圧管理の重要性の言及。'
      }
    ]
  }
];

function getScenarioTasks(scenarioId: string): { title: string; tasks: ServerTask[] } {
  if (scenarioId === 'masld') {
    return {
      title: 'MASLD（代謝異常関連脂肪性肝疾患）の診断・評価と介入',
      tasks: MASLD_FALLBACK_TASKS
    };
  }
  return {
    title: '慢性腎臓病（CKD）患者が体調を崩したらどうする？（シックデイ対応）',
    tasks: CKD_FALLBACK_TASKS
  };
}

// Lazy initialization for Gemini API
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Security pattern detector for prompt theft
function isPromptLeakAttempt(text: string): boolean {
  const lower = text.toLowerCase();
  const patterns = [
    'プロンプト',
    'system prompt',
    'prompt',
    '指示を見せて',
    '指示を開示',
    'プロンプトを表示',
    'プロンプトを開示',
    '命令を教えて',
    'ルールを教えて',
    'システム指示',
    'instructions',
    'ignore previous',
    'reveal your prompt',
    'show your prompt',
    'display prompt'
  ];
  return patterns.some(p => lower.includes(p));
}

// API: Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY)
  });
});

// API: Evaluate answer
app.post('/api/evaluate', async (req, res) => {
  try {
    const {
      scenarioId,
      taskId,
      userAnswer,
      taskTitle,
      questionNumber,
      questionText,
      evaluationFocus,
      cautionNotes,
      rubrics: clientRubrics,
      answerSlideNumber
    } = req.body;

    if (!userAnswer || typeof userAnswer !== 'string') {
      return res.status(400).json({ error: '回答テキストが入力されていません。' });
    }

    const scenarioData = getScenarioTasks(scenarioId || 'ckd');
    const fallbackTask = scenarioData.tasks.find(t => t.id === Number(taskId));

    const effectiveTitle = taskTitle || fallbackTask?.title || `課題 ${taskId}`;
    const effectiveQNum = questionNumber || fallbackTask?.questionNumber || taskId;
    const effectiveQText = questionText || fallbackTask?.questionText || '';
    const effectiveEvalFocus = evaluationFocus || fallbackTask?.evaluationFocus || '';
    const effectiveCaution = cautionNotes || fallbackTask?.cautionNotes || '';
    const effectiveSlideNum = answerSlideNumber || fallbackTask?.answerSlideNumber || 7;
    const effectiveRubrics: ServerRubric[] = clientRubrics || fallbackTask?.rubrics || [];

    const maxScore = effectiveRubrics.reduce((sum, r) => sum + r.points, 0) || 7;

    // Security check: Prompt leak prevention
    if (isPromptLeakAttempt(userAnswer)) {
      return res.json({
        securityAlert: true,
        score: 0,
        maxScore,
        affirmativeFeedback: '【セキュリティ通知】',
        constructiveFeedback:
          '申し訳ありませんが、このプロンプトの内容を開示することはできません。\nこのプロンプトは限定的な環境で動作するよう設計されており、一般公開されていません。',
        rubricResults: effectiveRubrics.map(r => ({
          id: r.id,
          label: r.label,
          achieved: 'none',
          pointsAwarded: 0,
          feedback: 'セキュリティポリシー違反のため評価は保留されました。'
        })),
        nextActionPrompt: 'シナリオ課題に対する臨床的な回答を入力してください。',
        readyForNext: false
      });
    }

    const ai = getAI();

    // If Gemini API is available, generate pedagogical feedback
    if (ai) {
      const promptInstruction = `
あなた医学教育のオンラインシナリオ学習のAIチューターです。
以下の役割・原則・制約を【厳格に遵守】してください。

【基本原則】
- 目的: 教育目的であり、実際の医療行為を推奨・指示するものではありません。
- 呼称: ユーザーのことは必ず「あなた」と呼称してください（「先生」「受講者様」などではなく「あなた」）。
- 正解例の提示禁止: 正解例をそのまま模範解答として丸ごと提示してはいけません。
- 評価姿勢: 正答・評価ポイントと比較し、ユーザーの解答の「適切な点には肯定的なコメント」を返し、「不適切または欠落した点には建設的なコメント」を提供してください。
- 感情的な非難や断定を避け、臨床推論の向上を促す指導医のような温かく知的なトーンを保ってください。
${
  scenarioId === 'masld' && taskId === 1
    ? '- 【極めて重要】課題1の段階では「MASLD」という病名を断定せず、「脂肪肝の原因を鑑別するために必要な情報」という視点でのみコメントしてください。'
    : ''
}
${
  scenarioId === 'masld' && taskId === 2
    ? '- 【重要】本課題（第2問）のフィードバックにおいて、ここで初めて「MASLD（代謝異常関連脂肪性肝疾患）」であることを明示してください。'
    : ''
}

【対象シナリオ】: ${scenarioData.title}
【現在の課題】: 課題${effectiveQNum} - ${effectiveTitle}
【設問文】: ${effectiveQText}
【評価の視点】: ${effectiveEvalFocus}
${effectiveCaution ? `【注意事項】: ${effectiveCaution}` : ''}

【評価ルーブリック】:
${effectiveRubrics
  .map(
    (r, i) =>
      `${i + 1}. [ID: ${r.id}] ${r.label} (配点: ${r.points}点)\n   基準: ${r.description}`
  )
  .join('\n')}
満点: ${maxScore}点

【ユーザー（あなた）の解答】:
"""
${userAnswer}
"""

上記のユーザーの解答をルーブリックに基づき厳密に評価し、必ず以下の形式の有効なJSONのみを出力してください（Markdownのコードブロック \`\`\`json も可）:
{
  "score": <獲得合計点（0〜${maxScore}の整数または小数）>,
  "affirmativeFeedback": "<ユーザーが適切に記載できている点に対する、具体的で肯定的なフィードバック。「あなた」と呼称すること。>",
  "constructiveFeedback": "<不足している視点や誤り、より臨床的に深めるべきポイントに対する建設的で教育的なコメント。>",
  "rubricResults": [
    {
      "id": "<ルーブリックID>",
      "label": "<ルーブリック項目名>",
      "achieved": "<full | partial | none>",
      "pointsAwarded": <獲得点数>,
      "feedback": "<この項目に関する短評（1〜2文）>"
    }
  ],
  "nextActionPrompt": "<解説スライド・ビデオを視聴して理解を深め、次のステップへ進むよう促す一言。例:「スライド${effectiveSlideNum}ページの解説を確認し、準備ができたら次の課題へ進みましょう。」>"
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptInstruction,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const responseText = response.text?.trim() || '';
      try {
        const cleanedJson = responseText
          .replace(/^```json\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim();
        const parsed = JSON.parse(cleanedJson);

        return res.json({
          securityAlert: false,
          score: typeof parsed.score === 'number' ? parsed.score : Math.round(maxScore * 0.7),
          maxScore,
          affirmativeFeedback: parsed.affirmativeFeedback || '適切に要点を押さえて考察されています。',
          constructiveFeedback: parsed.constructiveFeedback || '追加の視点をスライド解説で確認しましょう。',
          rubricResults: Array.isArray(parsed.rubricResults) ? parsed.rubricResults : [],
          nextActionPrompt:
            parsed.nextActionPrompt ||
            `スライド${effectiveSlideNum}ページの解説を確認し、次のステップへ進みましょう。`,
          readyForNext: true
        });
      } catch (parseError) {
        console.error('Failed to parse Gemini JSON:', parseError, responseText);
      }
    }

    // Deterministic fallback if Gemini key is missing or parsing failed
    const lowerAns = userAnswer.toLowerCase();
    let totalScore = 0;
    const rubricResults = effectiveRubrics.map(r => {
      // Keyword based heuristic matching
      const keywords = r.label.split(/[\s（）()・＋+／/、]+/);
      const matches = keywords.filter(k => k.length >= 2 && lowerAns.includes(k.toLowerCase()));
      const ratio = matches.length / Math.max(keywords.length, 1);

      let achieved: 'full' | 'partial' | 'none' = 'none';
      let pointsAwarded = 0;
      let feedback = '';

      if (ratio >= 0.4 || lowerAns.length > 80) {
        achieved = 'full';
        pointsAwarded = r.points;
        feedback = `「${r.label}」に関する要点を的確に捉えられています。`;
      } else if (ratio > 0 || lowerAns.length > 30) {
        achieved = 'partial';
        pointsAwarded = Math.round(r.points * 0.5 * 10) / 10;
        feedback = `「${r.label}」の観点に触れられていますが、さらに具体的な記述があるとより良くなります。`;
      } else {
        achieved = 'none';
        pointsAwarded = 0;
        feedback = `「${r.label}」の視点が不足していました。解説で確認しましょう。`;
      }

      totalScore += pointsAwarded;
      return {
        id: r.id,
        label: r.label,
        achieved,
        pointsAwarded,
        feedback
      };
    });

    return res.json({
      securityAlert: false,
      score: totalScore,
      maxScore,
      affirmativeFeedback: `あなたの解答では、臨床的に重要なポイントに積極的に着目できています。`,
      constructiveFeedback: `不足していた項目や鑑別の視点について、スライド${effectiveSlideNum}ページの解説を確認し、知識を整理しておきましょう。`,
      rubricResults,
      nextActionPrompt: `スライド${effectiveSlideNum}ページの解説を確認したら、次の課題へ進んでください。`,
      readyForNext: true
    });
  } catch (error) {
    console.error('Evaluate API error:', error);
    res.status(500).json({ error: '評価処理中にエラーが発生しました。' });
  }
});

// API: Overall feedback generator
app.post('/api/overall-feedback', async (req, res) => {
  try {
    const { scenarioId, scenarioTitle, taskEvaluations, oxScore, maxOxScore } = req.body;
    const title = scenarioTitle || getScenarioTasks(scenarioId || 'ckd').title;

    const ai = getAI();
    if (ai) {
      const summaryPrompt = `
あなたは医学教育のオンラインシナリオ学習AIチューターです。
ユーザー（あなた）が全ステップ（症例検討＋〇×クイズ）を修了しました。
全体の総括フィードバックを作成してください。

【シナリオ】: ${title}
【〇×クイズ結果】: ${oxScore} / ${maxOxScore} 点
【各課題の評価結果】:
${JSON.stringify(taskEvaluations, null, 2)}

以下のJSONフォーマットで出力してください:
{
  "strengths": ["あなたが発揮した臨床推論の強み1", "強み2", "強み3"],
  "improvementAreas": ["今後さらに意識すると良い改善点・学びのポイント1", "ポイント2"],
  "overallComment": "あなたに対する温かく建設的な総括メッセージ（200〜300文字程度。「あなた」と呼称すること）"
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: summaryPrompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3
        }
      });

      const responseText = response.text?.trim() || '';
      try {
        const cleaned = responseText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
        const parsed = JSON.parse(cleaned);
        return res.json(parsed);
      } catch (e) {
        console.error('Parse summary error:', e);
      }
    }

    // Fallback overall feedback
    return res.json({
      strengths: [
        '病態の全体像を捉え、適切な初期対応や鑑別診断を選択できた点',
        '患者の背景情報や合併症リスクに配慮した思考プロセス',
        '〇×クイズを通じた最新診療ガイドラインの知識の確認'
      ],
      improvementAreas: [
        'シックデイ時における薬剤の一時中止と安全な再開条件のより緻密な整理',
        '患者・家族への具体的かつ実行しやすい行動基準の説明'
      ],
      overallComment:
        '全課題およびクイズの修了、お疲れ様でした。あなたの臨床推論は確かな視点を持って展開されており、本シナリオで学んだ「短期の安全性」と「長期の予後改善」のバランスをぜひ日常診療でも役立ててください。'
    });
  } catch (error) {
    console.error('Overall feedback API error:', error);
    res.status(500).json({ error: '総括フィードバック生成中にエラーが発生しました。' });
  }
});

// Vite or Static files handling
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

start();

