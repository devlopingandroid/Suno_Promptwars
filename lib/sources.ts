export type Language = "en" | "hi";
export type Category =
  "body" | "cost" | "process" | "trust" | "beliefs" | "other";
export type Source = {
  id: string;
  title: string;
  url: string;
  reference: string;
  excerpt: string;
  answer: Record<Language, string>;
  starter: Record<Language, string>;
};

// The excerpts below are deliberately short, exact passages checked against NOTTO publications.
// No answer is generated for a category without a reviewed passage.
export const sources: Source[] = [
  {
    id: "notto-body",
    title: "NOTTO Myths vs Facts",
    url: "https://notto.mohfw.gov.in/WriteReadData/Portal/News/941_1_Myths_Vs_Facts.pdf",
    reference: "Page 1, body and funeral",
    excerpt:
      "No disfigurement is caused by organ donation, and an open funeral is possible.",
    answer: {
      en: "NOTTO says organ donation does not cause disfigurement and an open funeral is possible. A donation team can explain the process for a particular situation.",
      hi: "NOTTO के अनुसार अंगदान से शरीर विकृत नहीं होता और खुले रूप में अंतिम दर्शन संभव हैं। किसी विशेष स्थिति की प्रक्रिया के बारे में दान टीम से पूछें।",
    },
    starter: {
      en: "What part of this worries you most? We can look at the official information together.",
      hi: "इसमें आपको सबसे ज़्यादा किस बात की चिंता है? हम आधिकारिक जानकारी साथ में देख सकते हैं।",
    },
  },
  {
    id: "notto-cost",
    title: "NOTTO Myths vs Facts",
    url: "https://notto.mohfw.gov.in/WriteReadData/Portal/News/941_1_Myths_Vs_Facts.pdf",
    reference: "Page 1, family cost",
    excerpt:
      "There is no cost to the donors or their families for organ or tissue donation.",
    answer: {
      en: "NOTTO says there is no cost to donors or their families for organ or tissue donation.",
      hi: "NOTTO के अनुसार अंग या ऊतक दान के लिए दाता या उनके परिवार से कोई शुल्क नहीं लिया जाता।",
    },
    starter: {
      en: "Would you like us to read the official information together?",
      hi: "क्या हम आधिकारिक जानकारी साथ में पढ़ें?",
    },
  },
  {
    id: "notto-family",
    title: "NOTTO Organ and Tissue Pledge Guidance",
    url: "https://notto.mohfw.gov.in/WriteReadData/Portal/News/848_1_NOTTO_TRANSPLANT_MANUAL-final_version.pdf",
    reference: "Page 147, Form 7 note",
    excerpt:
      "it is important that you discuss your decision with family members and loved ones",
    answer: {
      en: "NOTTO encourages people to discuss their donation decision with family and loved ones.",
      hi: "NOTTO अंगदान के निर्णय पर परिवार और प्रियजनों से बातचीत करने के लिए प्रोत्साहित करता है।",
    },
    starter: {
      en: "Is there anything you would like me to explain about my wish?",
      hi: "मेरी इच्छा के बारे में आप क्या जानना चाहेंगे?",
    },
  },
];

export type ConcernResult = {
  category: Category;
  answer: string | null;
  sourceId: string | null;
  supportingExcerpt: string | null;
  language: Language;
  status: "supported" | "unsupported";
  confidence: "reviewed-example" | "ai-routed" | "insufficient";
  starter: string;
  source?: Source;
};

export function detectLanguage(question: string): Language {
  return /[\u0900-\u097F]/.test(question) ? "hi" : "en";
}

export function classifyConcern(question: string): Category {
  const q = question.toLowerCase();
  if (/religio|faith|belief|god|ritual|धर्म|आस्था|विश्वास|रीति|भगवान/.test(q))
    return "beliefs";
  if (/disfigur|body|look|funeral|face|शरीर|चेहर|अंतिम|दिखे|विकृत/.test(q))
    return "body";
  if (/cost|charg|pay|money|fee|खर्च|पैस|शुल्क/.test(q)) return "cost";
  if (/process|pledge|consent|procedure|family|कैसे|प्रक्रिया|सहमति|परिवार/.test(q))
    return "process";
  if (/hospital|trust|doctor|अस्पताल|भरोसा|डॉक्टर/.test(q)) return "trust";
  return "other";
}

export function answerConcern(
  question: string,
  routed?: Category,
): ConcernResult {
  const language = detectLanguage(question),
    category = routed ?? classifyConcern(question);
  // A broad category alone is not evidence. Match only the narrow issue addressed by each excerpt.
  const q = question.toLowerCase();
  const excluded =
    /eligib|diabet|cancer|hiv|compatib|match|legal|consent|religio|faith|blood|sell|price|payment|\bage\b|infection|risk|दवा|बीमारी|मधुमेह|कैंसर|पात्र|कानून|सहमति|धर्म|रक्त|खून|कीमत/.test(
      q,
    );
  const bodyAppearance =
    /disfigur|look|appear|face|funeral|चेहर|दिखे|विकृत|अंतिम दर्शन/.test(q);
  const donationCost =
    /cost|charg|pay|fee|खर्च|पैस|शुल्क/.test(q) &&
    !/travel|transport|funeral|hospital bill|treatment|यात्रा|अंतिम संस्कार|इलाज/.test(
      q,
    );
  const familyDiscussion =
    /family|परिवार|discuss|बातचीत/.test(q) &&
    /discuss|talk|tell|share|बात|बताए|साझा/.test(q);
  const source =
    !excluded && category === "body" && bodyAppearance
      ? sources[0]
      : !excluded && category === "cost" && donationCost
        ? sources[1]
        : !excluded && category === "process" && familyDiscussion
          ? sources[2]
          : undefined;
  if (!source)
    return {
      category,
      answer: null,
      sourceId: null,
      supportingExcerpt: null,
      language,
      status: "unsupported",
      confidence: "insufficient",
      starter:
        category === "beliefs"
          ? language === "hi"
            ? "यह आपकी निजी आस्था से जुड़ा सवाल है। क्या आप इस पर किसी भरोसेमंद व्यक्ति या आधिकारिक जानकारी सेवा से बात करना चाहेंगे?"
            : "This is personal to your beliefs. Would you like to speak with someone you trust or an official information service?"
          : language === "hi"
            ? "क्या हम इस सवाल को खुला रखें और आधिकारिक जानकारी सेवा से पूछें?"
            : "Shall we leave this question open and ask an official information service?",
    };
  return {
    category,
    answer: source.answer[language],
    sourceId: source.id,
    supportingExcerpt: source.excerpt,
    language,
    status: "supported",
    confidence: routed ? "ai-routed" : "reviewed-example",
    starter: source.starter[language],
    source,
  };
}
