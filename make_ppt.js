const pptxgen = require('pptxgenjs');
const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9'; // 10" x 5.625"
pres.title = '장애인인식개선 교육 퀴즈 해설';

// ── 색상 ──────────────────────────────────────────────────────────────────────
const BG       = '0F172A';
const CARD     = '1E293B';
const CARD2    = '2D3F55';
const WHITE    = 'FFFFFF';
const MUTED    = '94A3B8';
const GREEN_BG = '064E3B';
const GREEN    = '34D399';
const CORRECT  = '10B981';
const RED_BG   = '7F1D1D';
const RED      = 'F87171';
const F        = 'Malgun Gothic';

const CAT_COLOR = {
  '장애인 비율': '818CF8',
  '장애 종류':   '38BDF8',
  '장애인 인식': 'FCD34D',
  '장애인 배려': '34D399',
};
const cc = cat => CAT_COLOR[cat] || '818CF8';

// ── 문제 데이터 ───────────────────────────────────────────────────────────────
const quizzes = [
  { no:1,  category:'장애인 비율', type:'subjective',
    question:'대한민국 등록 장애인 수는 전체 인구의 약 몇 %일까요?',
    answer:'약 5%  (약 264만 명)',
    explanation:'등록 장애인은 약 264만 명으로 전체 인구의 약 5.1%입니다.\n100명 중 5명꼴이에요. 생각보다 많죠?' },

  { no:2,  category:'장애 종류', type:'ox',
    question:'대한민국 장애인복지법에서 정한 법정 장애 유형은 총 15가지이다.',
    answer:'O  맞다',
    explanation:'지체·뇌병변·시각·청각·언어·지적·자폐성·정신·신장·\n심장·호흡기·간·안면·장루요루·뇌전증 — 정확히 15가지입니다.' },

  { no:3,  category:'장애 종류', type:'multiple',
    question:'다음 중 장애인복지법상 장애 유형에 속하지 않는 것은?',
    options:['① 안면장애','② 수면장애','③ 뇌전증장애','④ 장루·요루장애'],
    correctIdx:1,
    answer:'② 수면장애',
    explanation:'수면장애는 법정 장애 유형이 아닙니다.\n안면·뇌전증·장루요루장애는 모두 15가지 유형에 포함됩니다.' },

  { no:4,  category:'장애 종류', type:'subjective',
    question:'대한민국 등록 장애인 중 가장 많은 장애 유형은 무엇인가요?',
    answer:'지체장애  (약 46%)',
    explanation:'지체장애인이 전체의 약 46%로 가장 많습니다.\n팔·다리·척추 등 신체 기능 저하가 모두 포함됩니다.' },

  { no:5,  category:'장애 종류', type:'ox',
    question:'"발달장애"는 지적장애만을 의미한다.',
    answer:'X  틀리다',
    explanation:'발달장애는 지적장애와 자폐성장애를 함께 포함하는 개념입니다.\n발달장애인 권리보장법에서도 두 유형을 함께 규정합니다.' },

  { no:6,  category:'장애인 인식', type:'ox',
    question:'대한민국 장애인의 약 90%는 후천적 원인으로 장애를 갖게 된다.',
    answer:'O  맞다',
    explanation:'88~90%가 사고·질병 등 후천적 원인입니다.\n누구든 장애인이 될 수 있습니다. 장애는 우리 모두의 문제입니다.' },

  { no:7,  category:'장애인 인식', type:'multiple',
    question:'장애를 "사회 환경과 편견이 만든 문제"로 보는 관점은?',
    options:['① 의료적 모델','② 생태학적 모델','③ 사회적 모델','④ 통합적 모델'],
    correctIdx:2,
    answer:'③ 사회적 모델',
    explanation:'사회적 모델은 장애를 개인 결함이 아닌\n사회 구조·환경·편견의 문제로 봅니다.' },

  { no:8,  category:'장애인 인식', type:'ox',
    question:'"장애우(障碍友)"라는 표현은 장애인을 부르는 올바른 표현이다.',
    answer:'X  틀리다',
    explanation:'"장애우"는 비장애인의 시혜적 표현입니다.\n"장애인" 또는 "장애가 있는 사람"이 올바른 표현입니다.' },

  { no:9,  category:'장애인 인식', type:'ox',
    question:'장애인차별금지법상 정당한 편의 제공을 거부하는 것도 차별 행위에 해당한다.',
    answer:'O  맞다',
    explanation:'장애인차별금지법에서는 정당한 편의 제공 거부를\n명시적 차별 행위로 규정합니다.' },

  { no:10, category:'장애인 인식', type:'multiple',
    question:'공공기관·정부기관의 장애인 의무고용률은 민간기업과 비교하면?',
    options:['① 같다','② 낮다','③ 높다'],
    correctIdx:2,
    answer:'③ 높다',
    explanation:'민간기업(50인 이상) 3.1%  vs  공공기관·지자체 3.8%\n미이행 시 민간은 고용부담금, 공공기관은 기관 평가 불이익.' },

  { no:11, category:'장애인 배려', type:'ox',
    question:'시각장애인 안내 시, 안내자가 시각장애인의 팔을 잡아 이동을 돕는 것이 올바른 방법이다.',
    answer:'X  틀리다',
    explanation:'반대입니다. 시각장애인이 안내자의 팔꿈치를 잡고,\n안내자가 반보 앞에서 이동하는 것이 올바른 방법입니다.' },

  { no:12, category:'장애인 배려', type:'multiple',
    question:'휠체어 사용자와 대화할 때 가장 올바른 자세는?',
    options:['① 서서 내려다보며 말한다','② 눈높이를 맞추어 대화한다','③ 보호자에게 대신 전달한다','④ 빠르게 용건만 말한다'],
    correctIdx:1,
    answer:'② 눈높이를 맞추어 대화한다',
    explanation:'눈높이를 맞추면 평등하고 편안한 대화가 가능합니다.\n보호자에게 대신 전달하는 것은 당사자를 무시하는 행동입니다.' },

  { no:13, category:'장애인 배려', type:'subjective',
    question:'청각장애인과 소통할 때 도움이 되는 방법을 두 가지 이상 써보세요.',
    answer:'필담 / 수어 / 입 모양 크게 천천히 / 문자 메시지 등',
    explanation:'말하기 전 먼저 시선을 맞추는 것도 중요합니다.\n다양한 방법을 상황에 맞게 활용하세요.' },

  { no:14, category:'장애인 배려', type:'ox',
    question:'황색 점자블록 위에 물건을 올려두거나 주차하는 것은 불법이다.',
    answer:'O  맞다',
    explanation:'점자블록은 시각장애인 이동 안전 시설입니다.\n교통약자 이동편의 증진법 위반으로 과태료 처분을 받습니다.' },

  { no:15, category:'장애인 배려', type:'multiple',
    question:'장애인 전용 주차구역을 올바르게 이용할 수 있는 경우는?',
    options:['① 장애인 가족 명의 차량이면 누구든 가능','② 보행상 장애인이 탑승한 경우','③ 장애인 주차 표지가 있으면 언제나 가능','④ 5분 이내 잠깐 볼일 볼 때'],
    correctIdx:1,
    answer:'② 보행상 장애인이 탑승한 경우',
    explanation:'표지가 있어도 장애인이 탑승하지 않으면 불법입니다.\n직접 운전하거나 탑승한 경우에만 이용 가능합니다.' },
];

// ── 헬퍼 ─────────────────────────────────────────────────────────────────────
function addBg(s) {
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:5.625, fill:{ color:BG }, line:{ color:BG } });
}

function textArr(str, baseOpts) {
  const lines = str.split('\n');
  return lines.map((t, i) => ({
    text: t,
    options: i < lines.length - 1 ? { ...baseOpts, breakLine:true } : baseOpts
  }));
}

// ── 1. 타이틀 슬라이드 ────────────────────────────────────────────────────────
;(function() {
  const s = pres.addSlide();
  addBg(s);

  Object.values(CAT_COLOR).forEach((c, i) => {
    s.addShape(pres.shapes.RECTANGLE, { x:i*2.5, y:0, w:2.5, h:0.28, fill:{ color:c }, line:{ color:c } });
  });

  s.addShape(pres.shapes.RECTANGLE, { x:0.8, y:1.0, w:8.4, h:3.5, fill:{ color:CARD }, line:{ color:CARD } });

  s.addText('장애인인식개선 교육', {
    x:0.8, y:1.35, w:8.4, h:0.55, fontSize:20, color:MUTED, align:'center', fontFace:F });
  s.addText('퀴즈 결과 & 해설', {
    x:0.8, y:1.9, w:8.4, h:1.1, fontSize:44, bold:true, color:WHITE, align:'center', fontFace:F });
  s.addText('총 15문제  |  2025년 기준', {
    x:0.8, y:3.05, w:8.4, h:0.38, fontSize:16, color:MUTED, align:'center', fontFace:F });

  const cats = Object.entries(CAT_COLOR);
  cats.forEach(([name, c], i) => {
    const x = 0.8 + i * 2.16;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y:4.6, w:2.0, h:0.45,
      fill:{ color:c, transparency:78 }, line:{ color:c }, rectRadius:0.06 });
    s.addText(name, { x, y:4.6, w:2.0, h:0.45,
      fontSize:13, bold:true, color:WHITE, align:'center', valign:'middle', margin:0, fontFace:F });
  });
})();

// ── 2~16. 문제 슬라이드 ──────────────────────────────────────────────────────
quizzes.forEach(q => {
  const s = pres.addSlide();
  addBg(s);

  const c = cc(q.category);

  // ── 상단 헤더 영역 (0 ~ 0.62") ── 카테고리 색상 배경
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:10, h:0.62, fill:{ color:CARD }, line:{ color:CARD } });
  // 왼쪽 카테고리 컬러 바
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0, w:0.2, h:0.62, fill:{ color:c }, line:{ color:c } });

  // Q번호 원형 배지
  s.addShape(pres.shapes.OVAL, { x:0.32, y:0.08, w:0.46, h:0.46, fill:{ color:c }, line:{ color:c } });
  s.addText(`${q.no}`, { x:0.32, y:0.08, w:0.46, h:0.46,
    fontSize:16, bold:true, color:BG, align:'center', valign:'middle', margin:0, fontFace:F });

  // 카테고리명
  s.addText(q.category, { x:0.9, y:0.1, w:2.8, h:0.42,
    fontSize:16, bold:true, color:c, valign:'middle', fontFace:F });

  // 유형 배지
  const typeLabel = { ox:'O / X', multiple:'사지선다', subjective:'주관식' };
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:3.82, y:0.12, w:1.0, h:0.38,
    fill:{ color:c, transparency:82 }, line:{ color:c }, rectRadius:0.05 });
  s.addText(typeLabel[q.type], { x:3.82, y:0.12, w:1.0, h:0.38,
    fontSize:12, bold:true, color:c, align:'center', valign:'middle', margin:0, fontFace:F });

  // 슬라이드 번호
  s.addText(`${q.no} / 15`, { x:8.8, y:0.14, w:1.0, h:0.35,
    fontSize:12, color:MUTED, align:'right', fontFace:F });

  // ── 문제 영역 (0.68" ~ 2.38", h=1.7") ── 28pt
  s.addShape(pres.shapes.RECTANGLE, { x:0, y:0.68, w:10, h:1.72, fill:{ color:BG }, line:{ color:BG } });
  s.addText(q.question, {
    x:0.35, y:0.72, w:9.3, h:1.64,
    fontSize:28, bold:true, color:WHITE, valign:'middle', wrap:true, fontFace:F });

  // ── 레이아웃 역산 (슬라이드 아래에서 위로) ──────────────────────────────
  //   해설(1.38") → gap → 정답(0.88") → gap → 보기 → 질문 끝(2.40")
  const BOTTOM    = 5.55;
  const EXP_H     = 1.38;   // 해설 박스 높이 (20pt 2줄 충분)
  const ANS_H     = 0.88;   // 정답 박스 높이 (24pt 2줄 충분)
  const GAP       = 0.08;

  const EXP_Y     = BOTTOM - EXP_H;                   // 4.17
  const ANS_Y     = EXP_Y  - GAP - ANS_H;             // 3.21
  const OPT_START = 2.44;
  const OPT_SPACE = ANS_Y  - OPT_START - GAP;         // 0.69

  if (q.type === 'ox') {
    // ── 보기 박스: 모두 동일한 중립색, 정답 표시는 아래 정답 박스에서만 ──
    const btnH = OPT_SPACE;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:0.3, y:OPT_START, w:4.55, h:btnH,
      fill:{ color:CARD2 }, line:{ color:'475569', width:1 }, rectRadius:0.1 });
    s.addText('⭕  O  맞다', { x:0.3, y:OPT_START, w:4.55, h:btnH,
      fontSize:22, color:WHITE, align:'center', valign:'middle', fontFace:F });

    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:5.15, y:OPT_START, w:4.55, h:btnH,
      fill:{ color:CARD2 }, line:{ color:'475569', width:1 }, rectRadius:0.1 });
    s.addText('❌  X  틀리다', { x:5.15, y:OPT_START, w:4.55, h:btnH,
      fontSize:22, color:WHITE, align:'center', valign:'middle', fontFace:F });

  } else if (q.type === 'multiple') {
    const opts  = q.options;
    const cols  = opts.length <= 3 ? opts.length : 2;
    const rows  = Math.ceil(opts.length / cols);
    const gapX  = 0.14;
    const gapY  = 0.08;
    // 셀 높이 최소 0.38" 보장 (텍스트 한 줄 + 여백)
    const cellH = Math.max(0.38, (OPT_SPACE - gapY * (rows - 1)) / rows);
    const cellW = (9.4 - gapX * (cols - 1)) / cols;
    // 보기 폰트: 셀이 작을 때 14pt, 충분하면 16pt
    const optFs = cellH < 0.42 ? 13 : 15;

    opts.forEach((opt, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx  = 0.3 + col * (cellW + gapX);
      const cy  = OPT_START + row * (cellH + gapY);

      // 모든 보기 박스 동일한 중립색
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:cx, y:cy, w:cellW, h:cellH,
        fill:{ color:CARD2 }, line:{ color:'475569', width:1 }, rectRadius:0.07 });
      s.addText(opt, { x:cx+0.14, y:cy, w:cellW-0.22, h:cellH,
        fontSize:optFs, color:WHITE, valign:'middle', fontFace:F });
    });
  }
  // 주관식은 보기 없음 — 정답/해설 바로 표시

  // ── 정답 박스 (32pt) ──────────────────────────────────────────────────────
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:0.3, y:ANS_Y, w:9.4, h:ANS_H,
    fill:{ color:GREEN_BG }, line:{ color:CORRECT, width:2 }, rectRadius:0.08 });
  s.addText([
    { text:'✅  정답   ', options:{ bold:true, color:GREEN, fontSize:16 } },
    { text:q.answer,    options:{ bold:true, color:WHITE, fontSize:24 } }
  ], { x:0.3, y:ANS_Y, w:9.4, h:ANS_H, valign:'middle', margin:[0,0,0,16], fontFace:F });

  // ── 해설 영역 (테두리 없음, 배경만) ──────────────────────────────────────
  // 배경 (border = fill 색과 동일 → 보이지 않음)
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:0.3, y:EXP_Y, w:9.4, h:EXP_H,
    fill:{ color:CARD }, line:{ color:CARD }, rectRadius:0.08 });

  // 왼쪽 카테고리 컬러 강조 바 (0.06" 폭)
  s.addShape(pres.shapes.RECTANGLE, {
    x:0.36, y:EXP_Y + 0.1, w:0.06, h:EXP_H - 0.2,
    fill:{ color:c }, line:{ color:c } });

  // "해설" 레이블 (카테고리 컬러, 작고 명확하게)
  s.addText('해설', {
    x:0.52, y:EXP_Y + 0.1, w:1.0, h:0.28,
    fontSize:13, bold:true, color:c, valign:'middle', fontFace:F });

  // 해설 내용 (레이블 바로 아래, 흰색 18pt)
  s.addText(textArr(q.explanation, { color:WHITE, fontSize:18 }), {
    x:0.52, y:EXP_Y + 0.4, w:9.1, h:EXP_H - 0.5,
    valign:'top', fontFace:F });
});

// ── 17. 마무리 슬라이드 ───────────────────────────────────────────────────────
;(function() {
  const s = pres.addSlide();
  addBg(s);

  Object.values(CAT_COLOR).forEach((c, i) => {
    s.addShape(pres.shapes.RECTANGLE, { x:i*2.5, y:0, w:2.5, h:0.28, fill:{ color:c }, line:{ color:c } });
  });

  s.addText('수고하셨습니다!', {
    x:0.5, y:0.7, w:9.0, h:0.95, fontSize:44, bold:true, color:WHITE, align:'center', fontFace:F });
  s.addText('오늘 배운 내용을 기억하고\n장애인과 함께하는 세상을 만들어가요.', {
    x:0.5, y:1.72, w:9.0, h:0.9, fontSize:20, color:MUTED, align:'center', fontFace:F });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x:0.4, y:2.82, w:9.2, h:2.6,
    fill:{ color:CARD }, line:{ color:CARD2 }, rectRadius:0.1 });
  s.addText('📚 참고 자료 및 법령 출처 (2025년 기준)', {
    x:0.7, y:2.95, w:8.6, h:0.4, fontSize:14, bold:true, color:WHITE, fontFace:F });
  s.addText([
    { text:'① 보건복지부 「등록장애인 현황 통계」· KOSIS', options:{ breakLine:true } },
    { text:'② 「장애인복지법 시행령」제2조 [별표1]  ③ 「발달장애인 권리보장 및 지원에 관한 법률」제2조', options:{ breakLine:true } },
    { text:'④ 한국장애인고용공단 「장애인 경제활동 실태조사」  ⑤ WHO ICF(2001) — 사회적 모델', options:{ breakLine:true } },
    { text:'⑥ 「장애인차별금지 및 권리구제 등에 관한 법률」  ⑦ 「장애인고용촉진 및 직업재활법」제28조', options:{ breakLine:true } },
    { text:'⑧ 한국시각장애인연합회 「안내 에티켓」  ⑨ 「교통약자의 이동편의 증진법」제21조', options:{ breakLine:true } },
    { text:'⑩ 「장애인·노인·임산부 등의 편의증진 보장에 관한 법률」  ⑪ 고용노동부·한국장애인고용공단 「표준교재」' },
  ], { x:0.7, y:3.42, w:8.6, h:1.85, fontSize:11, color:MUTED, valign:'top', fontFace:F });
})();

// ── 저장 ─────────────────────────────────────────────────────────────────────
const OUT = 'C:\\Users\\11x\\Documents\\claude\\duty\\disability-quiz\\장애인인식개선 퀴즈 교육 PPT.pptx';
pres.writeFile({ fileName: OUT }).then(() => console.log('Done:', OUT));
