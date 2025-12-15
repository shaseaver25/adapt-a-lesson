import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Strengths-based naming system for student-facing materials
const STUDENT_LEVEL_NAMES: Record<string, { label: string; icon: string }> = {
  'Below Grade': { label: 'Embers', icon: '🔥' },
  'On Grade': { label: 'Flames', icon: '🔥' },
  'Above Grade': { label: 'Blazers', icon: '💫' },
  'Advanced': { label: 'Supernovas', icon: '🌟' },
};

function getStudentFriendlyName(level: string): string {
  return STUDENT_LEVEL_NAMES[level]?.label || level;
}

function getStudentFriendlyIcon(level: string): string {
  return STUDENT_LEVEL_NAMES[level]?.icon || '📖';
}

// Language translations for UI elements
const LANGUAGE_TRANSLATIONS: Record<string, {
  levelNames: Record<string, string>;
  uiElements: {
    name: string;
    date: string;
    learningTarget: string;
    todayYouWillLearn: string;
    keyWords: string;
    practice: string;
    checkUnderstanding: string;
    reflection: string;
    whatILearned: string;
    questionIHave: string;
    encouragement: string;
    graphicOrganizer: string;
    lessonContent: string;
    edition: string;
  };
}> = {
  'Spanish': {
    levelNames: { 'Embers': 'Chispas', 'Flames': 'Llamas', 'Blazers': 'Brillantes', 'Supernovas': 'Supernovas' },
    uiElements: {
      name: 'Nombre', date: 'Fecha', learningTarget: 'Objetivo de Aprendizaje',
      todayYouWillLearn: 'Hoy aprenderás a', keyWords: 'Palabras Clave / Key Words',
      practice: 'Práctica', checkUnderstanding: 'Comprueba Tu Comprensión',
      reflection: 'Reflexión', whatILearned: '¿Qué aprendí hoy?',
      questionIHave: 'Una pregunta que todavía tengo', encouragement: '¡Tú puedes!',
      graphicOrganizer: 'Organizador Gráfico', lessonContent: 'Contenido de la Lección',
      edition: 'Edición'
    }
  },
  'Mandarin': {
    levelNames: { 'Embers': '火花', 'Flames': '火焰', 'Blazers': '闪耀者', 'Supernovas': '超新星' },
    uiElements: {
      name: '姓名', date: '日期', learningTarget: '学习目标',
      todayYouWillLearn: '今天你将学习', keyWords: '关键词 / Key Words',
      practice: '练习', checkUnderstanding: '检查你的理解',
      reflection: '反思', whatILearned: '我今天学到了什么？',
      questionIHave: '我还有一个问题', encouragement: '你能行！',
      graphicOrganizer: '图形组织器', lessonContent: '课程内容',
      edition: '版本'
    }
  },
  'Vietnamese': {
    levelNames: { 'Embers': 'Tia Lửa', 'Flames': 'Ngọn Lửa', 'Blazers': 'Rực Sáng', 'Supernovas': 'Siêu Sao' },
    uiElements: {
      name: 'Tên', date: 'Ngày', learningTarget: 'Mục Tiêu Học Tập',
      todayYouWillLearn: 'Hôm nay bạn sẽ học', keyWords: 'Từ Khóa / Key Words',
      practice: 'Thực Hành', checkUnderstanding: 'Kiểm Tra Hiểu Biết',
      reflection: 'Suy Ngẫm', whatILearned: 'Hôm nay tôi đã học được gì?',
      questionIHave: 'Một câu hỏi tôi vẫn còn', encouragement: 'Bạn làm được!',
      graphicOrganizer: 'Sơ Đồ Tổ Chức', lessonContent: 'Nội Dung Bài Học',
      edition: 'Phiên Bản'
    }
  },
  'Arabic': {
    levelNames: { 'Embers': 'الشرارات', 'Flames': 'اللهب', 'Blazers': 'المتألقون', 'Supernovas': 'النجوم العملاقة' },
    uiElements: {
      name: 'الاسم', date: 'التاريخ', learningTarget: 'هدف التعلم',
      todayYouWillLearn: 'اليوم ستتعلم', keyWords: 'الكلمات الرئيسية / Key Words',
      practice: 'التدريب', checkUnderstanding: 'تحقق من فهمك',
      reflection: 'التأمل', whatILearned: 'ماذا تعلمت اليوم؟',
      questionIHave: 'سؤال لا يزال لدي', encouragement: '!يمكنك فعل ذلك',
      graphicOrganizer: 'المنظم الرسومي', lessonContent: 'محتوى الدرس',
      edition: 'إصدار'
    }
  },
  'Tagalog': {
    levelNames: { 'Embers': 'Mga Tilamsik', 'Flames': 'Mga Apoy', 'Blazers': 'Mga Nagniningning', 'Supernovas': 'Mga Supernova' },
    uiElements: {
      name: 'Pangalan', date: 'Petsa', learningTarget: 'Layunin sa Pagkatuto',
      todayYouWillLearn: 'Ngayon matututo ka ng', keyWords: 'Mga Susing Salita / Key Words',
      practice: 'Pagsasanay', checkUnderstanding: 'Suriin ang Iyong Pag-unawa',
      reflection: 'Pagninilay', whatILearned: 'Ano ang natutunan ko ngayon?',
      questionIHave: 'Isang tanong na mayroon pa ako', encouragement: 'Kaya mo ito!',
      graphicOrganizer: 'Graphic Organizer', lessonContent: 'Nilalaman ng Aralin',
      edition: 'Edisyon'
    }
  },
  'Korean': {
    levelNames: { 'Embers': '불씨', 'Flames': '불꽃', 'Blazers': '빛나는 별', 'Supernovas': '초신성' },
    uiElements: {
      name: '이름', date: '날짜', learningTarget: '학습 목표',
      todayYouWillLearn: '오늘 배울 내용', keyWords: '핵심 단어 / Key Words',
      practice: '연습', checkUnderstanding: '이해도 확인',
      reflection: '성찰', whatILearned: '오늘 무엇을 배웠나요?',
      questionIHave: '아직 궁금한 점', encouragement: '할 수 있어요!',
      graphicOrganizer: '그래픽 오거나이저', lessonContent: '수업 내용',
      edition: '에디션'
    }
  },
  'Haitian Creole': {
    levelNames: { 'Embers': 'Flanm', 'Flames': 'Dife', 'Blazers': 'Limyè', 'Supernovas': 'Sipènova' },
    uiElements: {
      name: 'Non', date: 'Dat', learningTarget: 'Objektif Aprantisaj',
      todayYouWillLearn: 'Jodi a ou pral aprann', keyWords: 'Mo Kle / Key Words',
      practice: 'Pratik', checkUnderstanding: 'Tcheke Konpreyansyon Ou',
      reflection: 'Refleksyon', whatILearned: 'Kisa mwen te aprann jodi a?',
      questionIHave: 'Yon kesyon mwen toujou genyen', encouragement: 'Ou kapab!',
      graphicOrganizer: 'Òganizatè Grafik', lessonContent: 'Kontni Leson an',
      edition: 'Edisyon'
    }
  },
  'Portuguese': {
    levelNames: { 'Embers': 'Faíscas', 'Flames': 'Chamas', 'Blazers': 'Brilhantes', 'Supernovas': 'Supernovas' },
    uiElements: {
      name: 'Nome', date: 'Data', learningTarget: 'Objetivo de Aprendizagem',
      todayYouWillLearn: 'Hoje você vai aprender', keyWords: 'Palavras-Chave / Key Words',
      practice: 'Prática', checkUnderstanding: 'Verifique Sua Compreensão',
      reflection: 'Reflexão', whatILearned: 'O que eu aprendi hoje?',
      questionIHave: 'Uma pergunta que ainda tenho', encouragement: 'Você consegue!',
      graphicOrganizer: 'Organizador Gráfico', lessonContent: 'Conteúdo da Lição',
      edition: 'Edição'
    }
  },
  'Russian': {
    levelNames: { 'Embers': 'Искры', 'Flames': 'Пламя', 'Blazers': 'Сияющие', 'Supernovas': 'Сверхновые' },
    uiElements: {
      name: 'Имя', date: 'Дата', learningTarget: 'Цель Обучения',
      todayYouWillLearn: 'Сегодня ты научишься', keyWords: 'Ключевые Слова / Key Words',
      practice: 'Практика', checkUnderstanding: 'Проверь Понимание',
      reflection: 'Рефлексия', whatILearned: 'Чему я научился сегодня?',
      questionIHave: 'Вопрос, который у меня остался', encouragement: 'У тебя получится!',
      graphicOrganizer: 'Графический Органайзер', lessonContent: 'Содержание Урока',
      edition: 'Издание'
    }
  },
  'French': {
    levelNames: { 'Embers': 'Étincelles', 'Flames': 'Flammes', 'Blazers': 'Brillants', 'Supernovas': 'Supernovas' },
    uiElements: {
      name: 'Nom', date: 'Date', learningTarget: "Objectif d'Apprentissage",
      todayYouWillLearn: "Aujourd'hui tu vas apprendre", keyWords: 'Mots Clés / Key Words',
      practice: 'Pratique', checkUnderstanding: 'Vérifie Ta Compréhension',
      reflection: 'Réflexion', whatILearned: "Qu'ai-je appris aujourd'hui?",
      questionIHave: "Une question que j'ai encore", encouragement: 'Tu peux le faire!',
      graphicOrganizer: 'Organisateur Graphique', lessonContent: 'Contenu de la Leçon',
      edition: 'Édition'
    }
  },
  'Somali': {
    levelNames: { 'Embers': 'Hillaaca', 'Flames': 'Dab', 'Blazers': 'Ifaya', 'Supernovas': 'Xiddigaha' },
    uiElements: {
      name: 'Magaca', date: 'Taariikhda', learningTarget: 'Hadafka Barashada',
      todayYouWillLearn: 'Maanta waxaad baran doontaa', keyWords: 'Erayada Muhiimka / Key Words',
      practice: 'Tababar', checkUnderstanding: 'Hubi Fahamkaaga',
      reflection: 'Fikir', whatILearned: 'Maxaan maanta baray?',
      questionIHave: 'Su\'aal aan weli qabo', encouragement: 'Waad awoodaa!',
      graphicOrganizer: 'Qaab-dhismeedka', lessonContent: 'Nuxurka Casharku',
      edition: 'Daabacaad'
    }
  }
};

function getLanguageTranslations(language: string) {
  return LANGUAGE_TRANSLATIONS[language] || null;
}

const systemPrompt = `You are an expert educator who specializes in differentiating instructional content for diverse learners. Your job is to create a comprehensive differentiated lesson plan with TWO DISTINCT SECTIONS:

1. TEACHER GUIDE - Professional reference document with ALL teaching directions consolidated at the top (ALWAYS IN ENGLISH)
2. STUDENT HANDOUTS - Clean, printable materials for each student group (IN STUDENT'S HOME LANGUAGE if not English)

═══════════════════════════════════════════════════════════════════════════════
CRITICAL DOCUMENT STRUCTURE RULES - READ CAREFULLY
═══════════════════════════════════════════════════════════════════════════════

TEACHER GUIDE SECTION (First Part of Document):
The Teacher Guide MUST contain ALL of the following in this order:
1. LESSON OVERVIEW - Objectives, standards, total duration
2. ACCOMMODATIONS SUMMARY TABLE - Quick reference for all groups
3. MATERIALS NEEDED - Complete list for all groups, noting group-specific items
4. PACING GUIDE - Timing for each section/activity
5. FACILITATION GUIDE - Step-by-step teaching directions
6. GROUP MANAGEMENT TIPS - How to manage multiple groups simultaneously
7. FORMATIVE ASSESSMENT CHECKPOINTS - When/how to check understanding per group
8. DIFFERENTIATION STRATEGIES - Specific approaches for this lesson
9. ANSWER KEYS - If applicable, all answers consolidated here

STUDENT HANDOUTS SECTION (Second Part of Document):
Student handouts must contain ZERO teacher directions. They should ONLY include:
- Student-facing learning targets (in student-friendly language)
- Content and instructions written directly TO the student ("You will...", "Complete the...")
- Practice activities
- Graphic organizers (if applicable)
- Vocabulary boxes (bilingual for ELL)
- Reflection prompts
- Encouragement messages

FORBIDDEN in Student Handouts:
- "Teacher will..." or "Instructor should..." 
- "Guide students to..." or "Ask students..."
- Assessment notes or grading criteria
- Pacing information
- Facilitation notes
- Any language directed at the teacher
═══════════════════════════════════════════════════════════════════════════════

CRITICAL: MULTILINGUAL OUTPUT RULES
- Teacher Guide: ALWAYS in English
- Student Handouts: If a group's home language is NOT English, output the ENTIRE handout in that language
- Vocabulary boxes: BILINGUAL format (English term → home language definition)
- All UI elements, instructions, labels, and encouragement: Translated to home language
- Keep English academic vocabulary terms with translations in parentheses

CRITICAL: USE STRENGTHS-BASED NAMING ONLY
- NEVER use "Below Grade Level" or any deficit-based language in student-facing content
- Use the following flame-based naming system (translate to home language):
  - "Embers" (🔥) = students who need additional scaffolding
  - "Flames" (🔥) = students at grade level
  - "Blazers" (💫) = students above grade level  
  - "Supernovas" (🌟) = advanced/gifted students

CORE DIFFERENTIATION RULES:
1. NEVER change the learning objectives - all students learn the same content
2. Adjust vocabulary, sentence complexity, and text density appropriately
3. Add scaffolds for Embers groups (more support)
4. Add extensions and deeper questions for Blazers/Supernovas
5. Include bilingual vocabulary supports for ELL students
6. Embed specific IEP accommodations when requested`;

interface StudentGroup {
  id: string;
  groupName: string;
  numStudents: number;
  readingLevelLabel: string;
  readingLevelLexile: string;
  homeLanguage: string;
  ellStatus: string;
  iep504Status: string;
  learningPreferences: string[];
  accommodations: string[];
  notes: string;
}

interface DifferentiationOptions {
  includeVocabularyScaffolding: boolean;
  generateComprehensionQuestions: boolean;
  includeVisualPlaceholders: boolean;
  includeGraphicOrganizers: boolean;
  graphicOrganizerType: string;
  outputFormat: string;
}

// Graphic organizer templates
const GRAPHIC_ORGANIZER_TEMPLATES: Record<string, string> = {
  'venn-diagram': `
┌─────────────────────────────────────────────────────────────────┐
│                    📊 VENN DIAGRAM                              │
│                    [Topic Title]                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│         ┌──────────────┐         ┌──────────────┐               │
│        │              │         │              │               │
│       │   [Topic A]   │         │   [Topic B]  │               │
│       │              │         │              │               │
│      │ _____________ ├─────────┤ _____________ │              │
│      │ _____________ │  BOTH   │ _____________ │              │
│      │ _____________ │ _______ │ _____________ │              │
│       │ _____________ │ _______ │ _____________│               │
│        │              │ _______ │              │               │
│         └──────────────┘         └──────────────┘               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘`,

  't-chart': `
┌─────────────────────────────────────────────────────────────────┐
│                      📋 T-CHART                                 │
│                    [Topic Title]                                │
├────────────────────────────┬────────────────────────────────────┤
│        [Category A]        │         [Category B]               │
├────────────────────────────┼────────────────────────────────────┤
│                            │                                    │
│ • _______________________  │ • _______________________          │
│                            │                                    │
│ • _______________________  │ • _______________________          │
│                            │                                    │
│ • _______________________  │ • _______________________          │
│                            │                                    │
│ • _______________________  │ • _______________________          │
│                            │                                    │
│ • _______________________  │ • _______________________          │
│                            │                                    │
└────────────────────────────┴────────────────────────────────────┘`,

  'flow-chart': `
┌─────────────────────────────────────────────────────────────────┐
│                      ➡️ FLOW CHART                               │
│                    [Process Title]                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│    ┌─────────────────────┐                                      │
│    │  Step 1: __________ │                                      │
│    └──────────┬──────────┘                                      │
│               │                                                 │
│               ▼                                                 │
│    ┌─────────────────────┐                                      │
│    │  Step 2: __________ │                                      │
│    └──────────┬──────────┘                                      │
│               │                                                 │
│               ▼                                                 │
│    ┌─────────────────────┐                                      │
│    │  Step 3: __________ │                                      │
│    └──────────┬──────────┘                                      │
│               │                                                 │
│               ▼                                                 │
│    ┌─────────────────────┐                                      │
│    │  Result: __________ │                                      │
│    └─────────────────────┘                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘`,

  'cause-effect': `
┌─────────────────────────────────────────────────────────────────┐
│                 🔗 CAUSE & EFFECT CHAIN                         │
│                    [Topic Title]                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐        ┌─────────────┐        ┌─────────────┐  │
│  │   CAUSE 1   │──────▶│   EFFECT    │──────▶│   CAUSE 2   │  │
│  │ ___________ │        │ ___________ │        │ ___________ │  │
│  └─────────────┘        └─────────────┘        └─────────────┘  │
│                                │                                │
│                                ▼                                │
│                         ┌─────────────┐                         │
│                         │   EFFECT    │                         │
│                         │ ___________ │                         │
│                         └─────────────┘                         │
│                                                                 │
│  BECAUSE...                           SO...                     │
│  ________________________________     ________________________  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘`,

  'web-diagram': `
┌─────────────────────────────────────────────────────────────────┐
│                    🕸️ WEB DIAGRAM                                │
│                    [Topic Title]                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│              ┌──────────────┐                                   │
│              │   Detail 1   │                                   │
│              │ ____________ │                                   │
│              └──────┬───────┘                                   │
│                     │                                           │
│   ┌──────────────┐  │  ┌──────────────┐                        │
│   │   Detail 2   │──┼──│   Detail 3   │                        │
│   │ ____________ │  │  │ ____________ │                        │
│   └──────────────┘  │  └──────────────┘                        │
│                ┌────┴────┐                                      │
│                │  MAIN   │                                      │
│                │  IDEA   │                                      │
│                │ _______ │                                      │
│                └────┬────┘                                      │
│   ┌──────────────┐  │  ┌──────────────┐                        │
│   │   Detail 4   │──┼──│   Detail 5   │                        │
│   │ ____________ │  │  │ ____________ │                        │
│   └──────────────┘  │  └──────────────┘                        │
│                     │                                           │
│              ┌──────┴───────┐                                   │
│              │   Detail 6   │                                   │
│              │ ____________ │                                   │
│              └──────────────┘                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘`,

  'frayer-model': `
┌─────────────────────────────────────────────────────────────────┐
│                    📚 FRAYER MODEL                              │
│              Vocabulary Deep-Dive                               │
├───────────────────────────────┬─────────────────────────────────┤
│         DEFINITION            │          CHARACTERISTICS        │
│   (in your own words)         │       (what makes it this?)     │
│                               │                                 │
│ _____________________________ │ _______________________________ │
│ _____________________________ │ _______________________________ │
│ _____________________________ │ _______________________________ │
│                               │                                 │
├───────────────────────────────┼─────────────────────────────────┤
│                               │                                 │
│              ┌────────────────┴────────────────┐                │
│              │                                 │                │
│              │     WORD: ________________      │                │
│              │                                 │                │
│              └────────────────┬────────────────┘                │
│                               │                                 │
├───────────────────────────────┼─────────────────────────────────┤
│          EXAMPLES             │         NON-EXAMPLES            │
│     (what IS this?)           │     (what is NOT this?)         │
│                               │                                 │
│ _____________________________ │ _______________________________ │
│ _____________________________ │ _______________________________ │
│ _____________________________ │ _______________________________ │
│                               │                                 │
└───────────────────────────────┴─────────────────────────────────┘`,

  'story-map': `
┌─────────────────────────────────────────────────────────────────┐
│                      📖 STORY MAP                               │
│                    [Story Title]                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ SETTING: Where? _____________ When? _____________       │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ CHARACTERS: ____________________________________________│    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ PROBLEM: _______________________________________________│    │
│  └───────────────────────────┬─────────────────────────────┘    │
│                              ▼                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                 │
│  │  Event 1   │─▶│  Event 2   │─▶│  Event 3   │                 │
│  │ __________ │  │ __________ │  │ __________ │                 │
│  └────────────┘  └────────────┘  └────────────┘                 │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ SOLUTION: ______________________________________________│    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ THEME/LESSON: __________________________________________│    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘`,

  'claim-evidence': `
┌─────────────────────────────────────────────────────────────────┐
│               ⚖️ CLAIM-EVIDENCE-REASONING                       │
│                    [Topic/Question]                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 📢 MY CLAIM (What I believe/argue):                     │    │
│  │                                                         │    │
│  │ _______________________________________________________ │    │
│  │ _______________________________________________________ │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 📋 EVIDENCE (Facts/data that support my claim):         │    │
│  │                                                         │    │
│  │ 1. ___________________________________________________  │    │
│  │                                                         │    │
│  │ 2. ___________________________________________________  │    │
│  │                                                         │    │
│  │ 3. ___________________________________________________  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 💡 REASONING (How the evidence supports my claim):      │    │
│  │                                                         │    │
│  │ _______________________________________________________ │    │
│  │ _______________________________________________________ │    │
│  │ _______________________________________________________ │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘`
};

function getOrganizerGuidance(type: string): string {
  const typeDescriptions: Record<string, string> = {
    'auto': 'Analyze the lesson content and automatically select the most appropriate organizer type based on the content structure (compare/contrast = Venn, sequence = Flow Chart, vocabulary = Frayer, etc.)',
    'venn-diagram': 'Use for comparing and contrasting two concepts, ideas, or topics',
    't-chart': 'Use for two-sided comparisons, pros/cons, or before/after',
    'flow-chart': 'Use for sequences, processes, timelines, or step-by-step procedures',
    'cause-effect': 'Use for showing relationships between causes and their effects',
    'web-diagram': 'Use for main idea and supporting details, brainstorming, or concept mapping',
    'frayer-model': 'Use for deep vocabulary study with definition, characteristics, examples, and non-examples',
    'story-map': 'Use for narrative structure including setting, characters, problem, events, and solution',
    'claim-evidence': 'Use for argumentative writing and critical thinking with claims, evidence, and reasoning'
  };
  return typeDescriptions[type] || typeDescriptions['auto'];
}

function buildGroupInstructions(group: StudentGroup, options: DifferentiationOptions): string {
  const friendlyName = getStudentFriendlyName(group.readingLevelLabel);
  const friendlyIcon = getStudentFriendlyIcon(group.readingLevelLabel);
  
  let instructions = `\n### Group: ${group.groupName} (${group.numStudents} students)
- Student-Friendly Level: ${friendlyIcon} ${friendlyName}
- Internal Reading Level: ${group.readingLevelLabel}${group.readingLevelLexile ? ` (${group.readingLevelLexile} Lexile)` : ''}
- Home Language: ${group.homeLanguage}
- ELL Status: ${group.ellStatus}
- IEP/504: ${group.iep504Status}`;

  if (group.learningPreferences.length > 0) {
    instructions += `\n- Learning Preferences: ${group.learningPreferences.join(', ')}`;
  }

  if (group.accommodations.length > 0) {
    instructions += `\n- Required Accommodations: ${group.accommodations.join(', ')}`;
  }

  if (group.notes) {
    instructions += `\n- Teacher Notes: ${group.notes}`;
  }

  // Level-specific differentiation
  let levelGuidance = "\n\nDIFFERENTIATION APPROACH:";
  
  if (group.readingLevelLabel === "Below Grade") {
    levelGuidance += `
- Simplify vocabulary (define terms inline)
- Shorten sentences to max 15 words
- Add visual cues and icons [VISUAL: description]
- Include sentence starters for responses
- Chunk content into smaller sections
- Add "Check for Understanding" prompts`;
  } else if (group.readingLevelLabel === "Advanced" || group.readingLevelLabel === "Above Grade") {
    levelGuidance += `
- Maintain sophisticated vocabulary
- Add extension questions ("Go Deeper" challenges)
- Include primary source references or advanced connections
- Reduce scaffolding, assume student independence
- Add "What if..." thought experiments`;
  } else {
    levelGuidance += `
- Grade-level vocabulary
- Clear, direct sentences
- Standard scaffolding appropriate for grade level`;
  }

  instructions += levelGuidance;

  // Enrichment Extension accommodation - comprehensive advanced content
  if (group.accommodations.includes('Enrichment Extension')) {
    instructions += `

🚀 ENRICHMENT EXTENSION REQUIRED:
Include a dedicated "ENRICHMENT EXTENSION" section in the student handout with ALL of the following:

1. **ADVANCED APPLICATION QUESTIONS** (2-3 questions)
   - Questions that require applying concepts to new, complex scenarios
   - Open-ended questions with no single correct answer
   - Example: "How might this concept apply in a different historical context?"

2. **REAL-WORLD CONNECTION CHALLENGE**
   - A scenario or problem connecting the lesson to current events or real-world applications
   - Encourage students to research or investigate independently
   - Example: "Research a modern example of this concept and prepare a 2-minute presentation"

3. **INDEPENDENT RESEARCH PROMPT**
   - A question or topic for deeper investigation beyond the lesson
   - Include suggested resources or starting points
   - Example: "Investigate [related advanced topic]. Create a one-page summary of your findings."

4. **CROSS-CURRICULAR CONNECTIONS** (2-3 connections)
   - Links to other subject areas (math, science, social studies, art, etc.)
   - Example: "How does this connect to what you're learning in [other subject]?"

5. **TEACH-BACK OPPORTUNITY**
   - A structured way for advanced students to help peers understand content
   - Example: "Create a mini-lesson or study guide to help a classmate understand [key concept]"
   - Include guidelines for peer tutoring

6. **EXTENSION PROJECT OPTIONS** (Choose 1)
   - Creative project: Design, build, or create something related to the content
   - Research project: Deep dive into a related topic
   - Leadership project: Organize a group activity or presentation
   - Innovation project: Propose a solution to a problem related to the content

FORMAT for Enrichment Section:
┌─────────────────────────────────────────────────────────────┐
│  🚀 ENRICHMENT EXTENSION - Go Beyond!                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Advanced Application Questions]                           │
│                                                             │
│  [Real-World Connection Challenge]                          │
│                                                             │
│  [Independent Research Prompt]                              │
│                                                             │
│  [Cross-Curricular Connections]                             │
│                                                             │
│  [Teach-Back Opportunity]                                   │
│                                                             │
│  [Extension Project Options]                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘`;
  }

  // Multilingual output support
  if (group.homeLanguage !== "English") {
    const translations = getLanguageTranslations(group.homeLanguage);
    const levelName = translations?.levelNames[friendlyName] || friendlyName;
    
    instructions += `

🌐 MULTILINGUAL OUTPUT REQUIRED - ${group.homeLanguage.toUpperCase()}:
**CRITICAL: The ENTIRE student handout for this group MUST be in ${group.homeLanguage}**

${translations ? `Use these translations for UI elements:
- "${translations.uiElements.name}:" for Name field
- "${translations.uiElements.date}:" for Date field  
- "${translations.uiElements.learningTarget}" for Learning Target header
- "${translations.uiElements.todayYouWillLearn}:" for the learning objective prompt
- "${translations.uiElements.keyWords}" for vocabulary box header
- "${translations.uiElements.practice}" for Practice section
- "${translations.uiElements.checkUnderstanding}" for comprehension check
- "${translations.uiElements.reflection}" for Reflection section
- "${translations.uiElements.whatILearned}" for reflection prompt
- "${translations.uiElements.encouragement}" for encouragement message
- "${translations.uiElements.graphicOrganizer}" for graphic organizer header
- Level name: "${levelName}" (translated from "${friendlyName}")
- Edition label: "${translations.uiElements.edition}"` : `Translate all UI elements to ${group.homeLanguage}`}

VOCABULARY BOX FORMAT (Bilingual):
- English term (${group.homeLanguage} translation) - definition in ${group.homeLanguage}
- Example: democracy (democracia) - un sistema donde la gente vota

CONTENT TRANSLATION RULES:
- Translate ALL lesson content to ${group.homeLanguage}
- Keep English academic vocabulary terms with ${group.homeLanguage} translations in parentheses
- Translate all instructions, prompts, and encouragement messages
- Graphic organizer labels: Translate to ${group.homeLanguage}`;
  }

  // ELL support (additional scaffolding)
  if (group.ellStatus !== "None") {
    instructions += `

ELL SCAFFOLDING (${group.ellStatus} level):
- Add bilingual vocabulary box (English → ${group.homeLanguage}) for 5-7 key terms
- Include visual supports for abstract concepts
- Add sentence frames for verbal responses
- Use shorter sentences and clear transitions`;
  }

  return instructions;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { lessonContent, selectedGroups, options } = await req.json();

    console.log(`Differentiating lesson for ${selectedGroups.length} groups`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build comprehensive prompt for all groups
    let groupsSection = "## STUDENT GROUPS TO DIFFERENTIATE FOR:\n";
    for (const group of selectedGroups as StudentGroup[]) {
      groupsSection += buildGroupInstructions(group, options as DifferentiationOptions);
      groupsSection += "\n\n---\n";
    }

    // Build options section
    let optionsSection = "\n## DIFFERENTIATION OPTIONS:\n";
    if (options.includeVocabularyScaffolding) {
      optionsSection += "- ✅ Include vocabulary scaffolding with bilingual glossaries\n";
    }
    if (options.generateComprehensionQuestions) {
      optionsSection += "- ✅ Generate level-appropriate comprehension questions for each group\n";
    }
    if (options.includeVisualPlaceholders) {
      optionsSection += "- ✅ Include [VISUAL: description] placeholders for images/diagrams\n";
    }
    if (options.includeGraphicOrganizers) {
      const organizerType = options.graphicOrganizerType || 'auto';
      optionsSection += `- ✅ Generate graphic organizers for visual learners\n`;
      optionsSection += `  - Type: ${organizerType === 'auto' ? 'Auto-detect based on content' : organizerType}\n`;
      optionsSection += `  - Guidance: ${getOrganizerGuidance(organizerType)}\n`;
    }
    optionsSection += `- Output Format: ${options.outputFormat}\n`;

    // Build graphic organizer section for the prompt
    let graphicOrganizerInstructions = '';
    if (options.includeGraphicOrganizers) {
      const organizerType = options.graphicOrganizerType || 'auto';
      graphicOrganizerInstructions = `

## GRAPHIC ORGANIZER INSTRUCTIONS:
You MUST include a printable graphic organizer in each student handout.

${organizerType === 'auto' ? `
AUTOMATIC SELECTION: Analyze the lesson content and select the most appropriate organizer:
- Compare/Contrast content → Venn Diagram or T-Chart
- Sequence/Process content → Flow Chart
- Cause/Effect content → Cause & Effect Chain
- Main Idea content → Web Diagram
- Vocabulary focus → Frayer Model
- Narrative/Story content → Story Map
- Argumentative content → Claim-Evidence-Reasoning
` : `
SELECTED TYPE: ${organizerType}
Use the ${organizerType} organizer format for all groups.
`}

FORMAT: Use ASCII/Unicode box-drawing characters to create professional, printable organizers.
Include blank lines (____________) for student responses.

EXAMPLE TEMPLATE STRUCTURE:
${GRAPHIC_ORGANIZER_TEMPLATES[organizerType !== 'auto' ? organizerType : 'web-diagram'] || GRAPHIC_ORGANIZER_TEMPLATES['web-diagram']}

IMPORTANT:
- Customize the organizer labels/prompts based on the lesson content
- For Embers groups: Pre-fill some sections or add more scaffolding
- For Supernovas groups: Add additional challenge sections
- Make sure all text fits within the box boundaries
`;
    }

    const userPrompt = `Create a COMPREHENSIVE DIFFERENTIATED LESSON PLAN for the following student groups.

${groupsSection}

${optionsSection}
${graphicOrganizerInstructions}

ORIGINAL LESSON CONTENT:
---
${lessonContent}
---

OUTPUT STRUCTURE:
Create a comprehensive document with TWO MAIN SECTIONS:

═══════════════════════════════════════════════════════════════
# 📋 TEACHER GUIDE
## [Extract Lesson Title] - Differentiated Instruction Plan
═══════════════════════════════════════════════════════════════

**📅 Generated:** ${new Date().toLocaleDateString()}
**📊 Groups Included:** ${(selectedGroups as StudentGroup[]).map((g: StudentGroup) => `${getStudentFriendlyIcon(g.readingLevelLabel)} ${g.groupName} (${getStudentFriendlyName(g.readingLevelLabel)})`).join(", ")}

---

### 📋 ACCOMMODATIONS AT A GLANCE

╔═══════════════╦══════════════╦══════════╦═══════════╦═════════════════════════╗
║ Group         ║ Level        ║ Students ║ Language  ║ Key Modifications       ║
╠═══════════════╬══════════════╬══════════╬═══════════╬═════════════════════════╣
${(selectedGroups as StudentGroup[]).map((g: StudentGroup) => {
  const levelDisplay = `${getStudentFriendlyIcon(g.readingLevelLabel)} ${getStudentFriendlyName(g.readingLevelLabel)}`;
  const accommodationsList = g.accommodations.length > 0 
    ? g.accommodations.map(a => `• ${a}`).join('\\n║               ║              ║          ║           ║ ')
    : '• Standard pacing';
  const ellNote = g.ellStatus !== 'None' ? `\\n║               ║              ║          ║           ║ • ELL: ${g.ellStatus}` : '';
  const iepNote = g.iep504Status !== 'None' ? `\\n║               ║              ║          ║           ║ • ${g.iep504Status}` : '';
  return `║ ${g.groupName.padEnd(13).slice(0, 13)} ║ ${levelDisplay.padEnd(12).slice(0, 12)} ║ ${String(g.numStudents).padEnd(8).slice(0, 8)} ║ ${g.homeLanguage.padEnd(9).slice(0, 9)} ║ ${accommodationsList}${ellNote}${iepNote} ║`;
}).join('\\n╠═══════════════╬══════════════╬══════════╬═══════════╬═════════════════════════╣\\n')}
╚═══════════════╩══════════════╩══════════╩═══════════╩═════════════════════════╝

**Quick Key:**
- 🔥 Embers = Additional scaffolding needed
- 🔥 Flames = Grade-level support
- 💫 Blazers = Above grade-level
- 🌟 Supernovas = Advanced/gifted

---

### 🎯 Lesson Overview
[Extract and summarize objectives and standards from the original content]

### 📦 Materials Needed
[List all materials across all groups, noting group-specific items]

### ⏱️ Pacing Guide
[Suggested timing for each section]

### 🔄 Differentiation Strategy
[How to manage multiple groups simultaneously - specific actionable suggestions]

### ✅ Formative Assessment Checkpoints
[When and how to check understanding per group]

---

═══════════════════════════════════════════════════════════════
# 📄 STUDENT HANDOUTS
## Print from here for student distribution
## ⚠️ MULTILINGUAL NOTE: Handouts for non-English home language groups must be FULLY TRANSLATED
═══════════════════════════════════════════════════════════════

[For EACH student group, create a separate printable handout.
**IF the group's home language is NOT English, the ENTIRE handout must be in that language.**]

---

## ${getStudentFriendlyIcon((selectedGroups as StudentGroup[])[0]?.readingLevelLabel || 'On Grade')} [Group Name] Handout
### [Lesson Title] - [Level Name, translated if non-English] ${(selectedGroups as StudentGroup[]).some((g: StudentGroup) => g.homeLanguage !== 'English') ? '(Use translated "Edition" label)' : 'Edition'} ✨

**[Name label in home language]:** _________________________ **[Date label in home language]:** _______________

---

#### 🎯 [Learning Target header in home language]
*[Today you will learn prompt in home language]:* [Objective in home language]

---

#### 📖 [Lesson Content header in home language]
[Full adapted lesson content - IN THE GROUP'S HOME LANGUAGE if not English]

${options.includeVocabularyScaffolding ? `#### 📚 [Key Words header - bilingual if non-English]
| English Word | [Home Language Translation] | [Definition in Home Language] |
|--------------|----------------------------|------------------------------|
| [term 1] | [translation] | [definition in home language] |
| [term 2] | [translation] | [definition in home language] |

` : ''}${options.includeVisualPlaceholders ? `[VISUAL: Include appropriate visual support here]

` : ''}${options.includeGraphicOrganizers ? `#### 📊 [Graphic Organizer header in home language]
[Generate a complete, printable ASCII/Unicode graphic organizer]
[Translate all labels and prompts to the group's home language if not English]
[Include blank lines (___________) for student responses]

` : ''}#### ✏️ [Practice header in home language]
[Differentiated practice activities - IN THE GROUP'S HOME LANGUAGE if not English]

${options.generateComprehensionQuestions ? `#### 💭 [Check Your Understanding header in home language]
[3-5 level-appropriate questions - IN THE GROUP'S HOME LANGUAGE if not English]

` : ''}#### 🌟 [Reflection header in home language]
*[What I learned today prompt in home language]:* _________________________________
*[One question I still have prompt in home language]:* _________________________________

---
⭐ **[Encouragement message in home language]** ⭐

---

[REPEAT the above handout structure for EACH student group]
[Remember: Non-English groups get FULLY TRANSLATED handouts]

═══════════════════════════════════════════════════════════════
# 🎯 Cross-Group Teaching Notes
═══════════════════════════════════════════════════════════════

[AI-generated suggestions for:
- Managing instruction across multiple groups simultaneously
- Flexible grouping strategies
- Common misconceptions to address
- Extension activities for early finishers]`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "API credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const differentiatedLesson = data.choices?.[0]?.message?.content;

    if (!differentiatedLesson) {
      throw new Error("No differentiated lesson generated");
    }

    console.log("Differentiated lesson generated successfully for", selectedGroups.length, "groups");

    return new Response(
      JSON.stringify({ differentiatedLesson }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error differentiating lesson:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
