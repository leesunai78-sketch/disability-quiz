const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const QRCode = require('qrcode');
const os = require('os');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());
app.use((req, res, next) => { res.setHeader('ngrok-skip-browser-warning', 'true'); next(); });

// 장애인인식개선 퀴즈 → /
app.use('/', express.static(path.join(__dirname, 'public'), { index: 'index.html' }));
// 성희롱예방 퀴즈 → /harassment/
app.use('/harassment', express.static(path.join(__dirname, 'public', 'harassment'), { index: 'index.html' }));

const PORT = process.env.PORT || 3000;

// ─── 퀴즈 문제 데이터 ───────────────────────────────────────────────────────
const QUIZ_DATA = {

  disability: [
    { id:1, category:'장애인 비율', categoryColor:'#6366f1', type:'multiple',
      question:'대한민국 등록 장애인 수는 전체 인구의 약 몇 %일까요?',
      options:['약 3%','약 5%','약 10%','약 20%'], answer:'약 5%', answerIndex:1,
      explanation:'대한민국 등록 장애인은 약 264만 명으로 전체 인구의 약 5.1%입니다. 100명 중 5명꼴이에요. 생각보다 많죠?' },
    { id:2, category:'장애 종류', categoryColor:'#0ea5e9', type:'ox',
      question:'대한민국 장애인복지법에서 정한 법정 장애 유형은 총 15가지이다.',
      answer:'O', explanation:'지체·뇌병변·시각·청각·언어·지적·자폐성·정신·신장·심장·호흡기·간·안면·장루요루·뇌전증 — 정확히 15가지입니다.' },
    { id:3, category:'장애 종류', categoryColor:'#0ea5e9', type:'multiple',
      question:'다음 중 대한민국 장애인복지법상 장애 유형에 속하지 않는 것은?',
      options:['안면장애','수면장애','뇌전증장애','장루·요루장애'], answer:'수면장애', answerIndex:1,
      explanation:'수면장애는 법정 장애 유형이 아닙니다. 안면·뇌전증·장루요루장애는 모두 15가지 유형에 포함됩니다.' },
    { id:4, category:'장애 종류', categoryColor:'#0ea5e9', type:'multiple',
      question:'대한민국 등록 장애인 중 가장 많은 장애 유형은 무엇인가요?',
      options:['시각장애','청각장애','지체장애','지적장애'], answer:'지체장애', answerIndex:2,
      explanation:'지체장애인이 전체 등록 장애인의 약 46%로 가장 많습니다. 팔·다리·척추 등 신체 기능 저하가 모두 포함됩니다.' },
    { id:5, category:'장애 종류', categoryColor:'#0ea5e9', type:'ox',
      question:'"발달장애"는 지적장애만을 의미한다.',
      answer:'X', explanation:'발달장애는 지적장애와 자폐성장애를 함께 포함하는 개념입니다. 발달장애인 지원 및 권리보장에 관한 법률에서도 두 유형을 함께 규정합니다.' },
    { id:6, category:'장애인 인식', categoryColor:'#f59e0b', type:'ox',
      question:'대한민국 장애인의 약 90%는 사고·질병 등 후천적 원인으로 장애를 갖게 된다.',
      answer:'O', explanation:'통계에 따르면 88~90%가 후천적 원인입니다. 누구든 장애인이 될 수 있습니다. 장애는 특정 집단만의 문제가 아닙니다.' },
    { id:7, category:'장애인 인식', categoryColor:'#f59e0b', type:'multiple',
      question:'장애를 개인의 결함이 아닌 "사회 환경과 편견이 만든 문제"로 보는 관점은?',
      options:['의료적 모델','생태학적 모델','사회적 모델','통합적 모델'], answer:'사회적 모델', answerIndex:2,
      explanation:'사회적 모델은 장애를 개인 신체 결함이 아닌 사회 구조·환경·편견의 문제로 봅니다. 현대 장애인 복지 정책의 기반입니다.' },
    { id:8, category:'장애인 인식', categoryColor:'#f59e0b', type:'ox',
      question:'"장애우(障碍友)"라는 표현은 장애인을 부르는 올바른 표현이다.',
      answer:'X', explanation:'"장애우"는 비장애인이 일방적으로 친구(友)처럼 대해주겠다는 시혜적 표현입니다. 당사자 단체에서도 "장애인" 또는 "장애가 있는 사람"으로 불러 달라고 요청하고 있습니다.' },
    { id:9, category:'장애인 인식', categoryColor:'#f59e0b', type:'ox',
      question:'장애인차별금지법상 정당한 편의 제공을 거부하는 것도 차별 행위에 해당한다.',
      answer:'O', explanation:'장애인차별금지 및 권리구제 등에 관한 법률에서는 정당한 편의 제공 거부를 명시적 차별 행위로 규정합니다. 단순히 다르게 대우하는 것만이 차별이 아닙니다.' },
    { id:10, category:'장애인 인식', categoryColor:'#f59e0b', type:'multiple',
      question:'공공기관·정부기관의 장애인 의무고용률은 민간기업과 비교하면?',
      options:['같다','낮다','높다'], answer:'높다', answerIndex:2,
      explanation:'2025년 기준 상시 50인 이상 민간기업은 3.1%, 국가·지방자치단체·공공기관은 3.8%로 공공부문이 더 높습니다.' },
    { id:11, category:'장애인 배려', categoryColor:'#10b981', type:'ox',
      question:'시각장애인을 안내할 때, 안내자가 시각장애인의 팔을 잡아 이동을 도와주는 것이 올바른 방법이다.',
      answer:'X', explanation:'올바른 방법은 반대입니다. 먼저 말을 걸어 동의를 구한 후, 시각장애인이 안내자의 팔꿈치 위를 잡도록 하고 안내자가 반보 앞에서 이동합니다.' },
    { id:12, category:'장애인 배려', categoryColor:'#10b981', type:'multiple',
      question:'휠체어 사용자와 대화할 때 가장 올바른 자세는?',
      options:['서서 내려다보며 말한다','눈높이를 맞추어 대화한다','보호자에게 대신 전달한다','빠르게 용건만 말한다'],
      answer:'눈높이를 맞추어 대화한다', answerIndex:1,
      explanation:'눈높이를 맞추면 평등하고 편안한 대화가 가능합니다. 보호자에게 대신 전달하는 것은 당사자를 무시하는 행동입니다.' },
    { id:13, category:'장애인 배려', categoryColor:'#10b981', type:'multiple',
      question:'청각장애인이 잘 못 알아들을 때, 올바른 대처 방법은?',
      options:['목소리를 더 높이고 같은 말을 천천히 크게 반복해서 말한다','단어나 표현을 바꾸어 다시 설명하거나 스마트폰 메모장으로 필담을 시도한다','"별거 아닌 얘기예요, 나중에 얘기해요"라며 대화를 마무리한다','옆에 있는 가족이나 동행인에게 "이분께 이렇게 전해 주세요"라고 부탁한다'],
      answer:'단어나 표현을 바꾸어 다시 설명하거나 스마트폰 메모장으로 필담을 시도한다', answerIndex:1,
      explanation:'보청기를 착용한 경우 과도하게 큰 소리는 찢어지듯 왜곡되어 통증을 줄 수 있습니다. 못 알아들었을 때는 표현을 바꾸거나 필담을 시도하는 것이 가장 올바른 방법입니다.' },
    { id:14, category:'장애인 배려', categoryColor:'#10b981', type:'ox',
      question:'황색 점자블록(보도 위 돌출된 노란 블록) 위에 물건을 올려두거나 주차하는 것은 불법이다.',
      answer:'O', explanation:'점자블록은 시각장애인의 이동 안전을 위한 시설입니다. 위에 물건을 올리거나 주차하면 교통약자의 이동편의 증진법 위반으로 과태료 처분을 받을 수 있습니다.' },
    { id:15, category:'장애인 배려', categoryColor:'#10b981', type:'multiple',
      question:'장애인 전용 주차구역을 올바르게 이용할 수 있는 경우는?',
      options:['장애인 가족 명의 차량이면 누구든 주차 가능','보행상 장애가 있는 장애인이 탑승한 경우','장애인 주차 표지가 붙은 차량이면 언제나 주차 가능','5분 이내 잠깐 볼일 볼 때'],
      answer:'보행상 장애가 있는 장애인이 탑승한 경우', answerIndex:1,
      explanation:'장애인 전용 주차구역은 보행상 장애가 있는 장애인이 직접 운전하거나 탑승한 경우에만 이용할 수 있습니다. 표지가 있어도 장애인이 동승하지 않으면 불법입니다.' },
  ],

  harassment: [
    { id:1, category:'성희롱 개념', categoryColor:'#7c3aed', type:'ox',
      question:'직장내 성희롱은 신체적 접촉이 있어야만 성립한다.',
      answer:'X', explanation:'직장내 성희롱은 신체적 행위뿐 아니라 언어적·시각적 행위도 포함됩니다. 성적 농담, 외모 품평, 음란물 게시 등도 성희롱에 해당합니다. (남녀고용평등법 제2조)' },
    { id:2, category:'성희롱 개념', categoryColor:'#7c3aed', type:'multiple',
      question:'직장내 성희롱이 성립하려면 반드시 충족되어야 하는 요건은?',
      options:['피해자가 명시적으로 거부 의사를 표현했을 것','고용 관계(업무 관련성)가 있는 사람에 의한 행위일 것','같은 회사 소속 직원 사이의 행위일 것','행위자에게 성적 의도가 있었을 것'],
      answer:'고용 관계(업무 관련성)가 있는 사람에 의한 행위일 것', answerIndex:1,
      explanation:'성희롱 성립에는 ① 직장 내 지위 이용 또는 업무 관련성, ② 성적 언동, ③ 피해자의 불쾌감이 필요합니다. 피해자의 명시적 거부나 행위자의 성적 의도는 필수 요건이 아닙니다.' },
    { id:3, category:'성희롱 개념', categoryColor:'#7c3aed', type:'ox',
      question:'외부 고객이나 협력업체 직원에 의한 성희롱도 사업주가 조치 의무를 진다.',
      answer:'O', explanation:'남녀고용평등법 제14조의2에 따라 고객 등에 의한 성희롱 피해 시 사업주는 피해 직원이 요청하면 근무 장소 변경·배치전환 등 필요한 조치를 해야 합니다.' },
    { id:4, category:'성희롱 개념', categoryColor:'#7c3aed', type:'multiple',
      question:'다음 중 직장내 성희롱에 해당하지 않는 것은?',
      options:['회식 자리에서 상사가 부하직원의 신체를 만진 행위','업무 메신저로 음란한 사진을 전송한 행위','같은 층 화장실에서 청소 직원이 마주친 행위','거래처 미팅 중 외모를 성적으로 품평한 발언'],
      answer:'같은 층 화장실에서 청소 직원이 마주친 행위', answerIndex:2,
      explanation:'업무 관련성이 없는 우연한 마주침은 성희롱이 아닙니다. 반면 회식·메신저·외부 거래처 미팅은 모두 업무 관련 상황으로 성희롱이 성립할 수 있습니다.' },
    { id:5, category:'판례 사례', categoryColor:'#dc2626', type:'ox',
      question:'【판례】 상사가 "예쁘다"는 말을 반복해서 한 것만으로도 성희롱이 인정된 판례가 있다.',
      answer:'O', explanation:'대법원은 "외모를 반복적으로 언급하며 성적 수치심을 주는 발언"도 언어적 성희롱에 해당한다고 판시했습니다. (대법원 2006다78465)' },
    { id:6, category:'판례 사례', categoryColor:'#dc2626', type:'multiple',
      question:'【판례】 법원이 성희롱 여부를 판단하는 기준으로 옳은 것은?',
      options:['행위자의 주관적 성적 의도가 있었는지를 중심으로 판단','피해자가 실제로 정신적 피해를 입었는지를 입증해야 성립','피해자와 같은 처지의 평균적인 사람이 성적 굴욕감을 느낄 수 있는지를 기준으로 판단','피해자가 행위 당시 명확히 거부했는지를 기준으로 판단'],
      answer:'피해자와 같은 처지의 평균적인 사람이 성적 굴욕감을 느낄 수 있는지를 기준으로 판단', answerIndex:2,
      explanation:'대법원은 "피해자와 같은 처지에 있는 일반적이고 평균적인 사람"의 관점에서 판단해야 한다고 확립했습니다. (대법원 2007두22498)' },
    { id:7, category:'판례 사례', categoryColor:'#dc2626', type:'ox',
      question:'【판례】 퇴근 후 개인 SNS 메시지로 보낸 성적 발언은 업무 관련성이 없어 성희롱이 아니다.',
      answer:'X', explanation:'법원은 직장 동료·상하관계에 있는 자 사이에서 발생한 SNS 성적 메시지를 직장내 성희롱으로 인정했습니다. (서울고법 2018나2005678)' },
    { id:8, category:'판례 사례', categoryColor:'#dc2626', type:'multiple',
      question:'【판례】 성희롱 피해자가 즉시 거부하지 않고 자리를 피한 경우, 법원은 어떻게 판단했나요?',
      options:['동의한 것으로 보아 성희롱이 성립하지 않는다','묵시적으로 허용한 것이므로 성희롱이 아니다','즉각적 거부를 강요하는 것은 피해자에게 부당하며 성희롱이 성립할 수 있다','피해자가 신고하지 않았으므로 성희롱이 아니다'],
      answer:'즉각적 거부를 강요하는 것은 피해자에게 부당하며 성희롱이 성립할 수 있다', answerIndex:2,
      explanation:'법원은 직장 내 권력관계로 인해 피해자가 즉각적으로 거부하기 어려운 상황임을 인정합니다. (대법원 2018두37262)' },
    { id:9, category:'법적 처벌', categoryColor:'#b45309', type:'multiple',
      question:'직장내 성희롱을 저지른 행위자(가해자)에 대해 사업주가 취해야 하는 조치는?',
      options:['구두 주의만 해도 충분하다','피해자의 요청이 있을 때만 조치하면 된다','지체 없이 조사하고 피해자 보호 및 행위자에 대한 징계 등 조치를 해야 한다','고용노동부의 지시가 있을 때 조치하면 된다'],
      answer:'지체 없이 조사하고 피해자 보호 및 행위자에 대한 징계 등 조치를 해야 한다', answerIndex:2,
      explanation:'남녀고용평등법 제14조에 따라 사업주는 성희롱 발생 시 즉시 조사 후 ① 피해자 보호조치, ② 행위자 징계·전보 등 조치를 해야 합니다. 미이행 시 500만 원 이하 과태료가 부과됩니다.' },
    { id:10, category:'법적 처벌', categoryColor:'#b45309', type:'ox',
      question:'성희롱 피해를 신고한 직원을 해고하거나 불이익을 주면 사업주는 처벌받는다.',
      answer:'O', explanation:'남녀고용평등법 제14조 제6항은 신고자·피해자에 대한 불이익 처우를 금지하며, 이를 위반하면 제37조 제2항 제2호에 따라 3년 이하 징역 또는 3,000만 원 이하 벌금에 처해집니다. 해고·전보·임금삭감·따돌림 등 모든 불이익 조치가 해당됩니다.' },
    { id:11, category:'법적 처벌', categoryColor:'#b45309', type:'multiple',
      question:'직장내 성희롱 예방교육을 연 1회 실시하지 않은 사업주에게 부과되는 제재는?',
      options:['별도 제재 없음','100만 원 이하 과태료','500만 원 이하 과태료','1년 이하 징역'],
      answer:'500만 원 이하 과태료', answerIndex:2,
      explanation:'남녀고용평등법 제13조에 따른 예방교육 의무를 위반하면 제39조 제2항 제1호의2에 의해 500만 원 이하 과태료가 부과됩니다. 상시 10명 미만·동일 성별 사업장은 자료 배포·게시 등으로 갈음할 수 있으나, 이행 의무 자체는 모든 사업장에 적용됩니다.' },
    { id:12, category:'법적 처벌', categoryColor:'#b45309', type:'ox',
      question:'사업주 본인이 직장내 성희롱을 저지른 경우, 행위자와 사업주 책임이 모두 적용된다.',
      answer:'O', explanation:'남녀고용평등법 제12조 위반으로 1,000만 원 이하 과태료가 부과되며, 형법상 강제추행 등에 해당하면 형사처벌도 받습니다.' },
    { id:13, category:'예방·대응', categoryColor:'#0d9488', type:'ox',
      question:'성희롱 고충처리는 반드시 회사 내부 절차를 먼저 거쳐야만 고용노동부에 신고할 수 있다.',
      answer:'X', explanation:'피해자는 회사 내부 절차와 관계없이 언제든지 고용노동부·국가인권위원회에 직접 신고·진정할 수 있습니다.' },
    { id:14, category:'예방·대응', categoryColor:'#0d9488', type:'multiple',
      question:'성희롱 피해를 입었을 때 올바른 초기 대응 방법이 아닌 것은?',
      options:['일시·장소·내용 등을 구체적으로 기록해 둔다','목격자가 있다면 증언을 확보해 둔다','가해자에게 직접 따져서 즉시 해결한다','회사 고충처리담당자 또는 외부 기관에 신고한다'],
      answer:'가해자에게 직접 따져서 즉시 해결한다', answerIndex:2,
      explanation:'가해자와 단독으로 대면하는 것은 2차 피해 위험이 있습니다. 증거를 확보한 후 고충처리담당자나 고용노동부(국번없이 1350)에 신고하는 것이 안전합니다.' },
    { id:15, category:'예방·대응', categoryColor:'#0d9488', type:'multiple',
      question:'직장동료가 성희롱 피해를 토로할 때, 주변 동료로서 가장 적절한 대응은?',
      options:['개인적인 문제이니 당사자끼리 해결하도록 조언한다','피해자 편에서 경청하고, 필요 시 신고·증언을 지지한다','"별것 아닌 것으로 예민하게 굴지 마라"고 조언한다','가해자가 평소에 좋은 사람이니 오해일 것이라고 달랜다'],
      answer:'피해자 편에서 경청하고, 필요 시 신고·증언을 지지한다', answerIndex:1,
      explanation:'2차 피해의 상당 부분은 주변인의 부적절한 반응에서 옵니다. 경청하고, 신고와 증언을 지지하는 것이 가장 중요합니다.' },
  ],
};

// ─── 퀴즈별 독립 상태 ──────────────────────────────────────────────────────
function createQuizRoom(quizzes) {
  const state = { phase: 'waiting', participantCount: 0, submissionCount: 0, discussingIndex: -1, answers: {} };
  const participantClients = new Set();
  const adminClients = new Set();
  const participantSubmitted = new Set();
  const participantNames = {};
  const participantScores = {};
  const SCORE_MAX = quizzes.filter(q => q.type !== 'subjective').length;
  let socketIdCounter = 0;

  function resetAnswers() {
    quizzes.forEach(q => { state.answers[q.id] = { counts: {}, total: 0, responses: [] }; });
  }
  resetAnswers();

  function calculateScore(answers) {
    let correct = 0;
    quizzes.forEach(q => {
      if (q.type === 'subjective') return;
      if (String(answers[q.id] ?? '').trim() === q.answer) correct++;
    });
    return correct;
  }

  function getAllScores() { return Object.values(participantScores); }

  function getAvgScore() {
    const scores = getAllScores();
    if (!scores.length) return null;
    return Math.round(scores.reduce((a, b) => a + b.score, 0) / scores.length * 10) / 10;
  }

  function sanitize(q) {
    const { answer, answerIndex, sampleAnswers, explanation, ...safe } = q;
    return safe;
  }

  function buildDiscussData(index) {
    const q = quizzes[index];
    if (!q) return null;
    const ans = state.answers[q.id] || { counts: {}, total: 0, responses: [] };
    return { question: q, answers: ans, index, total: quizzes.length };
  }

  function buildSummaryData() {
    const items = quizzes.map(q => {
      const ans = state.answers[q.id] || { counts: {}, total: 0 };
      const correctCount = q.type === 'subjective' ? 0 : (ans.counts[q.answer] || 0);
      const correctRate = q.type === 'subjective' ? null
        : ans.total > 0 ? Math.round(correctCount / ans.total * 100) : null;
      return { id: q.id, category: q.category, categoryColor: q.categoryColor, type: q.type,
        question: q.question, correctAnswer: q.type === 'subjective' ? (q.sampleAnswers || null) : q.answer,
        explanation: q.explanation, options: q.options ?? null, answerIndex: q.answerIndex ?? null,
        total: ans.total, correctCount, correctRate };
    });
    const categoryMap = {};
    items.forEach(item => {
      if (item.type === 'subjective' || item.correctRate === null) return;
      if (!categoryMap[item.category]) categoryMap[item.category] = { color: item.categoryColor, rates: [] };
      categoryMap[item.category].rates.push(item.correctRate);
    });
    const categories = Object.entries(categoryMap).map(([name, v]) => ({
      name, color: v.color, avgRate: Math.round(v.rates.reduce((a, b) => a + b, 0) / v.rates.length),
    }));
    const allRates = items.filter(i => i.correctRate !== null).map(i => i.correctRate);
    const overallRate = allRates.length > 0 ? Math.round(allRates.reduce((a, b) => a + b, 0) / allRates.length) : null;
    return { items, categories, overallRate };
  }

  function broadcast(data, target) {
    const msg = JSON.stringify(data);
    if (target === 'all' || target === 'participants')
      participantClients.forEach(ws => { if (ws.readyState === WebSocket.OPEN) ws.send(msg); });
    if (target === 'all' || target === 'admin')
      adminClients.forEach(ws => { if (ws.readyState === WebSocket.OPEN) ws.send(msg); });
  }

  function broadcastParticipantCount() {
    broadcast({ type: 'participantCount', count: state.participantCount }, 'all');
  }

  function sendParticipantInit(ws) {
    ws.send(JSON.stringify({
      type: 'init', phase: state.phase, totalQuestions: quizzes.length,
      participantCount: state.participantCount, submissionCount: state.submissionCount,
      hasSubmitted: participantSubmitted.has(ws._id),
      quizzes: state.phase === 'quiz' ? quizzes.map(sanitize) : null,
      summaryData: (state.phase === 'results' || state.phase === 'discussing') ? buildSummaryData() : null,
      discussData: state.phase === 'discussing' ? buildDiscussData(state.discussingIndex) : null,
    }));
  }

  function sendAdminInit(ws) {
    ws.send(JSON.stringify({
      type: 'adminInit', phase: state.phase, totalQuestions: quizzes.length,
      participantCount: state.participantCount, submissionCount: state.submissionCount,
      discussingIndex: state.discussingIndex, quizzes: quizzes.map(q => ({ ...q })),
      answers: state.answers,
      summaryData: (state.phase === 'results' || state.phase === 'discussing') ? buildSummaryData() : null,
      scores: getAllScores(), scoreMax: SCORE_MAX, avgScore: getAvgScore(),
    }));
  }

  function handleAdmin(ws, msg) {
    switch (msg.type) {
      case 'startQuiz':
        state.phase = 'quiz'; state.submissionCount = 0;
        participantSubmitted.clear(); resetAnswers();
        broadcast({ type: 'quizStarted', quizzes: quizzes.map(sanitize), total: quizzes.length }, 'participants');
        broadcast({ type: 'quizStarted', total: quizzes.length }, 'admin');
        break;
      case 'showResults':
        state.phase = 'results';
        broadcast({ type: 'showResults', ...buildSummaryData() }, 'all');
        break;
      case 'discussQuestion':
        state.phase = 'discussing'; state.discussingIndex = msg.index;
        broadcast({ type: 'discussQuestion', ...buildDiscussData(msg.index), index: msg.index }, 'all');
        break;
      case 'reset':
        state.phase = 'waiting'; state.submissionCount = 0; state.discussingIndex = -1;
        participantSubmitted.clear(); resetAnswers();
        Object.keys(participantNames).forEach(k => delete participantNames[k]);
        Object.keys(participantScores).forEach(k => delete participantScores[k]);
        broadcast({ type: 'reset' }, 'all');
        break;
    }
  }

  function handleParticipant(ws, msg) {
    if (msg.type !== 'submitAll') return;
    if (state.phase !== 'quiz') return;
    if (participantSubmitted.has(ws._id)) return;
    participantSubmitted.add(ws._id);
    const { answers } = msg;
    participantNames[ws._id] = `${state.submissionCount + 1}번`;
    Object.entries(answers || {}).forEach(([qId, answer]) => {
      const data = state.answers[parseInt(qId)];
      if (!data) return;
      const key = String(answer).trim();
      data.counts[key] = (data.counts[key] || 0) + 1;
      data.responses.push(key); data.total++;
    });
    const score = calculateScore(answers || {});
    participantScores[ws._id] = { name: participantNames[ws._id], score, scoreMax: SCORE_MAX };
    state.submissionCount++;
    ws.send(JSON.stringify({ type: 'submitConfirmed', score, scoreMax: SCORE_MAX }));
    broadcast({ type: 'submissionUpdate', count: state.submissionCount, total: state.participantCount,
      scores: getAllScores(), avgScore: getAvgScore() }, 'admin');
  }

  function addClient(ws, isAdmin) {
    ws._id = ++socketIdCounter;
    if (isAdmin) {
      adminClients.add(ws);
      sendAdminInit(ws);
    } else {
      participantClients.add(ws);
      state.participantCount++;
      broadcastParticipantCount();
      sendParticipantInit(ws);
    }
    ws.on('message', raw => {
      try { const msg = JSON.parse(raw); isAdmin ? handleAdmin(ws, msg) : handleParticipant(ws, msg); } catch {}
    });
    ws.on('close', () => {
      if (isAdmin) { adminClients.delete(ws); }
      else {
        participantClients.delete(ws); participantSubmitted.delete(ws._id);
        state.participantCount = Math.max(0, state.participantCount - 1);
        broadcastParticipantCount();
      }
    });
  }

  return { addClient };
}

// ─── 두 퀴즈 방 생성 ────────────────────────────────────────────────────────
const rooms = {
  disability: createQuizRoom(QUIZ_DATA.disability),
  harassment: createQuizRoom(QUIZ_DATA.harassment),
};

// ─── WebSocket 라우팅 ────────────────────────────────────────────────────────
wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://localhost');
  const quiz = url.searchParams.get('quiz') === 'harassment' ? 'harassment' : 'disability';
  const isAdmin = url.searchParams.get('role') === 'admin';
  rooms[quiz].addClient(ws, isAdmin);
});

// ─── QR 코드 엔드포인트 ─────────────────────────────────────────────────────
app.get('/qr.svg', async (req, res) => {
  const url = req.query.url || `http://localhost:${PORT}`;
  try {
    const svg = await QRCode.toString(url, { type: 'svg' });
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (e) { res.status(500).send('QR 생성 실패'); }
});

app.get('/api/serverinfo', (req, res) => {
  res.json({ port: PORT, localIP: getLocalIP() });
});

app.get('/api/publicurl', (req, res) => {
  const publicUrl = process.env.PUBLIC_URL
    ? process.env.PUBLIC_URL
    : `http://${getLocalIP()}:${PORT}`;
  res.json({ url: publicUrl });
});

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces))
    for (const info of iface)
      if (info.family === 'IPv4' && !info.internal) return info.address;
  return 'localhost';
}

// ─── 서버 시작 ──────────────────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', async () => {
  const ip = getLocalIP();
  const base = `http://${ip}:${PORT}`;
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🎯 교육 퀴즈 통합 서버 시작!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`[장애인인식개선] 참여자: ${base}/`);
  console.log(`[장애인인식개선] 관리자: ${base}/admin.html`);
  console.log(`[성희롱예방]     참여자: ${base}/harassment/`);
  console.log(`[성희롱예방]     관리자: ${base}/harassment/admin.html`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});
