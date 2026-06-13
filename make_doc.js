const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType
} = require('docx');
const fs = require('fs');

// ── 문제 데이터 ──────────────────────────────────────────────────────────────
const quizzes = [
  { id:1,  category:'장애인 비율', type:'subjective', question:'대한민국 등록 장애인 수는 전체 인구의 약 몇 %일까요? 숫자로 적어보세요.', answer:'약 5% (약 264만 명)', explanation:'대한민국 등록 장애인은 약 264만 명으로 전체 인구의 약 5.1%입니다. 100명 중 5명꼴이에요. 생각보다 많죠?' },
  { id:2,  category:'장애 종류',   type:'ox',         question:'대한민국 장애인복지법에서 정한 법정 장애 유형은 총 15가지이다.', answer:'O (맞다)', explanation:'지체·뇌병변·시각·청각·언어·지적·자폐성·정신·신장·심장·호흡기·간·안면·장루요루·뇌전증 — 정확히 15가지입니다.' },
  { id:3,  category:'장애 종류',   type:'multiple',   question:'다음 중 대한민국 장애인복지법상 장애 유형에 속하지 않는 것은?\n① 안면장애\n② 수면장애\n③ 뇌전증장애\n④ 장루·요루장애', answer:'② 수면장애', explanation:'수면장애는 법정 장애 유형이 아닙니다. 안면·뇌전증·장루요루장애는 모두 15가지 유형에 포함됩니다.' },
  { id:4,  category:'장애 종류',   type:'subjective', question:'대한민국 등록 장애인 중 가장 많은 장애 유형은 무엇인가요?', answer:'지체장애 (약 46%)', explanation:'지체장애인이 전체 등록 장애인의 약 46%로 가장 많습니다. 팔·다리·척추 등 신체 기능 저하가 모두 포함됩니다.' },
  { id:5,  category:'장애 종류',   type:'ox',         question:'"발달장애"는 지적장애만을 의미한다.', answer:'X (틀리다)', explanation:'발달장애는 지적장애와 자폐성장애를 함께 포함하는 개념입니다. 발달장애인 지원 및 권리보장에 관한 법률에서도 두 유형을 함께 규정합니다.' },
  { id:6,  category:'장애인 인식', type:'ox',         question:'대한민국 장애인의 약 90%는 사고·질병 등 후천적 원인으로 장애를 갖게 된다.', answer:'O (맞다)', explanation:'통계에 따르면 88~90%가 후천적 원인입니다. 누구든 장애인이 될 수 있습니다. 장애는 특정 집단만의 문제가 아닙니다.' },
  { id:7,  category:'장애인 인식', type:'multiple',   question:'장애를 개인의 결함이 아닌 "사회 환경과 편견이 만든 문제"로 보는 관점은?\n① 의료적 모델  ② 생태학적 모델  ③ 사회적 모델  ④ 통합적 모델', answer:'③ 사회적 모델', explanation:'사회적 모델은 장애를 개인 신체 결함이 아닌 사회 구조·환경·편견의 문제로 봅니다. 현대 장애인 복지 정책의 기반입니다.' },
  { id:8,  category:'장애인 인식', type:'ox',         question:'"장애우(障碍友)"라는 표현은 장애인을 부르는 올바른 표현이다.', answer:'X (틀리다)', explanation:'"장애우"는 비장애인이 일방적으로 친구(友)처럼 대해주겠다는 시혜적 표현입니다. 당사자 단체에서도 "장애인" 또는 "장애가 있는 사람"으로 불러 달라고 요청하고 있습니다.' },
  { id:9,  category:'장애인 인식', type:'ox',         question:'장애인차별금지법상 정당한 편의 제공을 거부하는 것도 차별 행위에 해당한다.', answer:'O (맞다)', explanation:'장애인차별금지 및 권리구제 등에 관한 법률에서는 정당한 편의 제공 거부를 명시적 차별 행위로 규정합니다.' },
  { id:10, category:'장애인 인식', type:'multiple',   question:'공공기관·정부기관의 장애인 의무고용률은 민간기업과 비교하면? ① 같다  ② 낮다  ③ 높다', answer:'③ 높다', explanation:'2025년 기준 상시 50인 이상 민간기업은 3.1%, 국가·지방자치단체·공공기관은 3.8%로 공공부문이 더 높습니다. 미이행 시 민간기업은 고용부담금을, 공공기관은 기관 평가에 불이익을 받습니다.' },
  { id:11, category:'장애인 배려', type:'ox',         question:'시각장애인을 안내할 때, 안내자가 시각장애인의 팔을 잡아 이동을 도와주는 것이 올바른 방법이다.', answer:'X (틀리다)', explanation:'올바른 방법은 반대입니다. 먼저 말을 걸어 동의를 구한 후, 시각장애인이 안내자의 팔꿈치 위를 잡도록 하고 안내자가 반보 앞에서 이동합니다. 안내자가 팔을 잡아 끌면 방향 예측이 어렵고 불안감을 줄 수 있습니다.' },
  { id:12, category:'장애인 배려', type:'multiple',   question:'휠체어 사용자와 대화할 때 가장 올바른 자세는?\n① 서서 내려다보며 말한다  ② 눈높이를 맞추어 대화한다\n③ 보호자에게 대신 전달한다  ④ 빠르게 용건만 말한다', answer:'② 눈높이를 맞추어 대화한다', explanation:'눈높이를 맞추면 평등하고 편안한 대화가 가능합니다. 보호자에게 대신 전달하는 것은 당사자를 무시하는 행동입니다.' },
  { id:13, category:'장애인 배려', type:'subjective', question:'청각장애인과 소통할 때 도움이 되는 방법을 두 가지 이상 써보세요.', answer:'필담 / 수어 / 입 모양 크게·천천히 / 문자 메시지 / 메모장 활용 등', explanation:'필담, 수어, 천천히 입 모양 크게 말하기, 문자 메시지, 메모장 활용 등이 있습니다. 말하기 전 먼저 시선을 맞추는 것도 중요합니다.' },
  { id:14, category:'장애인 배려', type:'ox',         question:'황색 점자블록(보도 위 돌출된 노란 블록) 위에 물건을 올려두거나 주차하는 것은 불법이다.', answer:'O (맞다)', explanation:'점자블록은 시각장애인의 이동 안전을 위한 시설입니다. 위에 물건을 올리거나 주차하면 교통약자의 이동편의 증진법 위반으로 과태료 처분을 받을 수 있습니다.' },
  { id:15, category:'장애인 배려', type:'multiple',   question:'장애인 전용 주차구역을 올바르게 이용할 수 있는 경우는?\n① 장애인 가족 명의 차량이면 누구든 주차 가능\n② 보행상 장애가 있는 장애인이 탑승한 경우\n③ 장애인 주차 표지가 붙은 차량이면 언제나 주차 가능\n④ 5분 이내 잠깐 볼일 볼 때', answer:'② 보행상 장애가 있는 장애인이 탑승한 경우', explanation:'장애인 전용 주차구역은 보행상 장애가 있는 장애인이 직접 운전하거나 탑승한 경우에만 이용할 수 있습니다. 표지가 있어도 장애인이 동승하지 않으면 불법입니다.' },
];

// ── 색상 설정 ─────────────────────────────────────────────────────────────────
const categoryColors = {
  '장애인 비율': '4F3CB0',
  '장애 종류':   '1565A0',
  '장애인 인식': 'B45309',
  '장애인 배려': '065F46',
};
const answerFills = { ox: 'D1FAE5', multiple: 'DBEAFE', subjective: 'FEF9C3' };
const typeLabel   = { ox: 'O / X', multiple: '사지선다', subjective: '주관식' };

// ── 테두리 ────────────────────────────────────────────────────────────────────
const thin  = { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' };
const none  = { style: BorderStyle.NONE,   size: 0, color: 'FFFFFF' };
const cellBorders = { top: thin, bottom: thin, left: thin, right: thin };
const noBorders   = { top: none, bottom: none, left: none, right: none };

// ── 각 문제 블록 생성 (단일 TableRow, cantSplit: true) ──────────────────────
function makeQuestionRow(q, i) {
  const catColor  = categoryColors[q.category] || '374151';
  const ansFill   = answerFills[q.type];

  // 라벨 텍스트 (고정 너비 맞춤용 공백 포함)
  function labelRun(text) {
    return new TextRun({ text, bold: true, size: 16, font: 'Arial', color: '64748B' });
  }
  function bodyRun(text, opts = {}) {
    return new TextRun({ text, size: 17, font: 'Arial', color: '1E293B', ...opts });
  }

  // 헤더 단락
  const headerPara = new Paragraph({
    spacing: { before: 0, after: 50 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: catColor, space: 4 } },
    children: [
      new TextRun({ text: `Q${i + 1}`, bold: true, size: 20, font: 'Arial', color: catColor }),
      new TextRun({ text: `   ${q.category}`, bold: true, size: 16, font: 'Arial', color: catColor }),
      new TextRun({ text: `   ${typeLabel[q.type]}`, size: 15, font: 'Arial', color: '94A3B8' }),
    ]
  });

  // 문제 단락 — \n을 실제 줄바꿈(break:1)으로 처리
  const questionLines = q.question.split('\n');
  const questionChildren = [labelRun('문제   ')];
  questionLines.forEach((line, li) => {
    if (li > 0) questionChildren.push(new TextRun({ break: 1 }));
    questionChildren.push(bodyRun(line));
  });
  const questionPara = new Paragraph({
    spacing: { before: 50, after: 0 },
    shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
    children: questionChildren
  });

  // 정답 단락
  const answerPara = new Paragraph({
    spacing: { before: 0, after: 0 },
    shading: { fill: ansFill, type: ShadingType.CLEAR },
    children: [labelRun('정답   '), bodyRun(q.answer, { bold: true })]
  });

  // 해설 단락
  const explainPara = new Paragraph({
    spacing: { before: 0, after: 0 },
    shading: { fill: 'F1F5F9', type: ShadingType.CLEAR },
    children: [labelRun('해설   '), bodyRun(q.explanation)]
  });

  return new TableRow({
    cantSplit: true,
    children: [
      // 번호 열
      new TableCell({
        width: { size: 600, type: WidthType.DXA },
        borders: cellBorders,
        verticalAlign: 'top',
        shading: { fill: 'F8FAFC', type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 80 },
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: `${i + 1}`, bold: true, size: 18, font: 'Arial', color: catColor })]
        })]
      }),
      // 내용 열
      new TableCell({
        width: { size: 8400, type: WidthType.DXA },
        borders: cellBorders,
        margins: { top: 70, bottom: 70, left: 140, right: 140 },
        children: [headerPara, questionPara, answerPara, explainPara]
      }),
    ]
  });
}

// ── 문서 구성 ─────────────────────────────────────────────────────────────────
const titlePara = new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 0, after: 160 },
  children: [new TextRun({ text: '장애인인식개선 교육 퀴즈   문제 · 정답 · 해설', bold: true, size: 26, font: 'Arial', color: '1E293B' })]
});

const noticePara = new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 0, after: 200 },
  children: [new TextRun({ text: `총 ${quizzes.length}문제  |  ※ 본 자료는 2025년 기준으로 작성되었습니다.`, size: 16, font: 'Arial', color: 'B45309' })]
});

// 전체 문제를 하나의 테이블로 구성 (각 행 = 1문제, cantSplit: true)
const quizTable = new Table({
  width: { size: 9000, type: WidthType.DXA },
  columnWidths: [600, 8400],
  rows: quizzes.map((q, i) => makeQuestionRow(q, i)),
});

// ── 출처 단락 목록 ────────────────────────────────────────────────────────────
const refs = [
  '① 보건복지부, 「등록장애인 현황 통계」, 국가통계포털(KOSIS)',
  '② 「장애인복지법 시행령」 제2조 [별표 1] — 장애의 종류 및 기준 (15가지 장애 유형)',
  '③ 「발달장애인 권리보장 및 지원에 관한 법률」 제2조 — 발달장애인의 정의',
  '④ 한국장애인고용공단, 「장애인 경제활동 실태조사」 — 후천적 장애 비율',
  '⑤ 세계보건기구(WHO), 국제기능·장애·건강분류(ICF, 2001) — 사회적 모델 근거',
  '⑥ 「장애인차별금지 및 권리구제 등에 관한 법률」 — 정당한 편의 제공 의무',
  '⑦ 「장애인고용촉진 및 직업재활법」 제28조 — 장애인 의무고용률 (2025년 기준: 민간기업 3.1%, 공공기관 3.8%)',
  '⑧ 한국시각장애인연합회, 「시각장애인 안내 에티켓」',
  '⑨ 「교통약자의 이동편의 증진법」 제21조 — 점자블록 설치 및 보호',
  '⑩ 「장애인·노인·임산부 등의 편의증진 보장에 관한 법률」 — 장애인 전용 주차구역',
  '⑪ 고용노동부·한국장애인고용공단, 「장애인인식개선 교육 표준교재」',
];

const refDivider = new Paragraph({
  spacing: { before: 320, after: 120 },
  border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1', space: 8 } },
  children: [new TextRun({ text: '참고 자료 및 법령 출처', bold: true, size: 18, font: 'Arial', color: '374151' })]
});

const refParas = refs.map(r => new Paragraph({
  spacing: { before: 0, after: 40 },
  children: [new TextRun({ text: r, size: 15, font: 'Arial', color: '64748B' })]
}));

const doc = new Document({
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 850, right: 850, bottom: 850, left: 850 }
      }
    },
    children: [titlePara, noticePara, quizTable, refDivider, ...refParas]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('장애인인식개선 퀴즈 정답 해설.docx', buf);
  console.log('Done: 장애인인식개선 퀴즈 정답 해설.docx');
});
