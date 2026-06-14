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
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

// ─── 퀴즈 문제 데이터 ───────────────────────────────────────────────────────
const quizzes = [

  // ── 장애인 비율 ──────────────────────────────────────────────────────────
  {
    id: 1,
    category: '장애인 비율',
    categoryColor: '#6366f1',
    type: 'multiple',
    question: '대한민국 등록 장애인 수는 전체 인구의 약 몇 %일까요?',
    options: ['약 3%', '약 5%', '약 10%', '약 20%'],
    answer: '약 5%',
    answerIndex: 1,
    explanation: '대한민국 등록 장애인은 약 264만 명으로 전체 인구의 약 5.1%입니다. 100명 중 5명꼴이에요. 생각보다 많죠?',
  },

  // ── 장애 종류 ─────────────────────────────────────────────────────────────
  {
    id: 2,
    category: '장애 종류',
    categoryColor: '#0ea5e9',
    type: 'ox',
    question: '대한민국 장애인복지법에서 정한 법정 장애 유형은 총 15가지이다.',
    answer: 'O',
    explanation: '지체·뇌병변·시각·청각·언어·지적·자폐성·정신·신장·심장·호흡기·간·안면·장루요루·뇌전증 — 정확히 15가지입니다.',
  },
  {
    id: 3,
    category: '장애 종류',
    categoryColor: '#0ea5e9',
    type: 'multiple',
    question: '다음 중 대한민국 장애인복지법상 장애 유형에 속하지 않는 것은?',
    options: ['안면장애', '수면장애', '뇌전증장애', '장루·요루장애'],
    answer: '수면장애',
    answerIndex: 1,
    explanation: '수면장애는 법정 장애 유형이 아닙니다. 안면·뇌전증·장루요루장애는 모두 15가지 유형에 포함됩니다.',
  },
  {
    id: 4,
    category: '장애 종류',
    categoryColor: '#0ea5e9',
    type: 'multiple',
    question: '대한민국 등록 장애인 중 가장 많은 장애 유형은 무엇인가요?',
    options: ['시각장애', '청각장애', '지체장애', '지적장애'],
    answer: '지체장애',
    answerIndex: 2,
    explanation: '지체장애인이 전체 등록 장애인의 약 46%로 가장 많습니다. 팔·다리·척추 등 신체 기능 저하가 모두 포함됩니다.',
  },
  {
    id: 5,
    category: '장애 종류',
    categoryColor: '#0ea5e9',
    type: 'ox',
    question: '"발달장애"는 지적장애만을 의미한다.',
    answer: 'X',
    explanation: '발달장애는 지적장애와 자폐성장애를 함께 포함하는 개념입니다. 발달장애인 지원 및 권리보장에 관한 법률에서도 두 유형을 함께 규정합니다.',
  },

  // ── 장애인 인식 ───────────────────────────────────────────────────────────
  {
    id: 6,
    category: '장애인 인식',
    categoryColor: '#f59e0b',
    type: 'ox',
    question: '대한민국 장애인의 약 90%는 사고·질병 등 후천적 원인으로 장애를 갖게 된다.',
    answer: 'O',
    explanation: '통계에 따르면 88~90%가 후천적 원인입니다. 누구든 장애인이 될 수 있습니다. 장애는 특정 집단만의 문제가 아닙니다.',
  },
  {
    id: 7,
    category: '장애인 인식',
    categoryColor: '#f59e0b',
    type: 'multiple',
    question: '장애를 개인의 결함이 아닌 "사회 환경과 편견이 만든 문제"로 보는 관점은?',
    options: ['의료적 모델', '생태학적 모델', '사회적 모델', '통합적 모델'],
    answer: '사회적 모델',
    answerIndex: 2,
    explanation: '사회적 모델은 장애를 개인 신체 결함이 아닌 사회 구조·환경·편견의 문제로 봅니다. 현대 장애인 복지 정책의 기반입니다.',
  },
  {
    id: 8,
    category: '장애인 인식',
    categoryColor: '#f59e0b',
    type: 'ox',
    question: '"장애우(障碍友)"라는 표현은 장애인을 부르는 올바른 표현이다.',
    answer: 'X',
    explanation: '"장애우"는 비장애인이 일방적으로 친구(友)처럼 대해주겠다는 시혜적 표현입니다. 당사자 단체에서도 "장애인" 또는 "장애가 있는 사람"으로 불러 달라고 요청하고 있습니다.',
  },
  {
    id: 9,
    category: '장애인 인식',
    categoryColor: '#f59e0b',
    type: 'ox',
    question: '장애인차별금지법상 정당한 편의 제공을 거부하는 것도 차별 행위에 해당한다.',
    answer: 'O',
    explanation: '장애인차별금지 및 권리구제 등에 관한 법률에서는 정당한 편의 제공 거부를 명시적 차별 행위로 규정합니다. 단순히 다르게 대우하는 것만이 차별이 아닙니다.',
  },
  {
    id: 10,
    category: '장애인 인식',
    categoryColor: '#f59e0b',
    type: 'multiple',
    question: '공공기관·정부기관의 장애인 의무고용률은 민간기업과 비교하면?',
    options: ['같다', '낮다', '높다'],
    answer: '높다',
    answerIndex: 2,
    explanation: '2025년 기준 상시 50인 이상 민간기업은 3.1%, 국가·지방자치단체·공공기관은 3.8%로 공공부문이 더 높습니다. 미이행 시 민간기업은 고용부담금을, 공공기관은 기관 평가에 불이익을 받습니다.',
  },

  {
    id: 11,
    category: '장애인 배려',
    categoryColor: '#10b981',
    type: 'ox',
    question: '시각장애인을 안내할 때, 안내자가 시각장애인의 팔을 잡아 이동을 도와주는 것이 올바른 방법이다.',
    answer: 'X',
    explanation: '올바른 방법은 반대입니다. 먼저 말을 걸어 동의를 구한 후, 시각장애인이 안내자의 팔꿈치 위를 잡도록 하고 안내자가 반보 앞에서 이동합니다. 안내자가 팔을 잡아 끌면 방향 예측이 어렵고 불안감을 줄 수 있습니다.',
  },
  {
    id: 12,
    category: '장애인 배려',
    categoryColor: '#10b981',
    type: 'multiple',
    question: '휠체어 사용자와 대화할 때 가장 올바른 자세는?',
    options: [
      '서서 내려다보며 말한다',
      '눈높이를 맞추어 대화한다',
      '보호자에게 대신 전달한다',
      '빠르게 용건만 말한다',
    ],
    answer: '눈높이를 맞추어 대화한다',
    answerIndex: 1,
    explanation: '눈높이를 맞추면 평등하고 편안한 대화가 가능합니다. 보호자에게 대신 전달하는 것은 당사자를 무시하는 행동입니다.',
  },
  {
    id: 13,
    category: '장애인 배려',
    categoryColor: '#10b981',
    type: 'multiple',
    question: '청각장애인이 잘 못 알아들을 때, 올바른 대처 방법은?',
    options: [
      '목소리를 더 높이고 같은 말을 천천히 크게 반복해서 말한다',
      '단어나 표현을 바꾸어 다시 설명하거나 스마트폰 메모장으로 필담을 시도한다',
      '"별거 아닌 얘기예요, 나중에 얘기해요"라며 대화를 마무리한다',
      '옆에 있는 가족이나 동행인에게 "이분께 이렇게 전해 주세요"라고 부탁한다',
    ],
    answer: '단어나 표현을 바꾸어 다시 설명하거나 스마트폰 메모장으로 필담을 시도한다',
    answerIndex: 1,
    explanation: '보청기를 착용한 경우 과도하게 큰 소리는 찢어지듯 왜곡되어 통증을 줄 수 있습니다. "별거 아니에요"라며 포기하거나 가족에게 대리 질문하는 것도 당사자에게 소외감을 줍니다. 못 알아들었을 때는 표현을 바꾸거나 필담을 시도하는 것이 가장 올바른 방법입니다.',
  },
  {
    id: 14,
    category: '장애인 배려',
    categoryColor: '#10b981',
    type: 'ox',
    question: '황색 점자블록(보도 위 돌출된 노란 블록) 위에 물건을 올려두거나 주차하는 것은 불법이다.',
    answer: 'O',
    explanation: '점자블록은 시각장애인의 이동 안전을 위한 시설입니다. 위에 물건을 올리거나 주차하면 교통약자의 이동편의 증진법 위반으로 과태료 처분을 받을 수 있습니다.',
  },
  {
    id: 15,
    category: '장애인 배려',
    categoryColor: '#10b981',
    type: 'multiple',
    question: '장애인 전용 주차구역을 올바르게 이용할 수 있는 경우는?',
    options: [
      '장애인 가족 명의 차량이면 누구든 주차 가능',
      '보행상 장애가 있는 장애인이 탑승한 경우',
      '장애인 주차 표지가 붙은 차량이면 언제나 주차 가능',
      '5분 이내 잠깐 볼일 볼 때',
    ],
    answer: '보행상 장애가 있는 장애인이 탑승한 경우',
    answerIndex: 1,
    explanation: '장애인 전용 주차구역은 보행상 장애가 있는 장애인이 직접 운전하거나 탑승한 경우에만 이용할 수 있습니다. 표지가 있어도 장애인이 동승하지 않으면 불법입니다.',
  },
];

// ─── 서버 상태 ──────────────────────────────────────────────────────────────
// phase: waiting | quiz | results | discussing
const state = {
  phase: 'waiting',
  participantCount: 0,
  submissionCount: 0,
  discussingIndex: -1,
  answers: {},
};

function resetAnswers() {
  quizzes.forEach(q => {
    state.answers[q.id] = { counts: {}, total: 0, responses: [] };
  });
}
resetAnswers();

const participantClients = new Set();
const adminClients = new Set();
const participantSubmitted = new Set(); // ws._id 기록 (중복 제출 방지)

// 개별 점수 추적
const participantNames = {};  // ws._id → name
const participantScores = {}; // ws._id → { name, score, scoreMax }

const SCORE_MAX = quizzes.filter(q => q.type !== 'subjective').length; // 12

function calculateScore(answers) {
  let correct = 0;
  quizzes.forEach(q => {
    if (q.type === 'subjective') return;
    const submitted = String(answers[q.id] ?? '').trim();
    if (submitted === q.answer) correct++;
  });
  return correct;
}

function getAllScores() {
  return Object.values(participantScores);
}

function getAvgScore() {
  const scores = getAllScores();
  if (scores.length === 0) return null;
  const sum = scores.reduce((a, b) => a + b.score, 0);
  return Math.round((sum / scores.length) * 10) / 10;
}

let socketIdCounter = 0;

// ─── WebSocket ──────────────────────────────────────────────────────────────
wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://localhost');
  const isAdmin = url.searchParams.get('role') === 'admin';
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
    try {
      const msg = JSON.parse(raw);
      isAdmin ? handleAdmin(ws, msg) : handleParticipant(ws, msg);
    } catch (e) { /* ignore */ }
  });

  ws.on('close', () => {
    if (isAdmin) {
      adminClients.delete(ws);
    } else {
      participantClients.delete(ws);
      participantSubmitted.delete(ws._id);
      state.participantCount = Math.max(0, state.participantCount - 1);
      broadcastParticipantCount();
    }
  });

});

function sendParticipantInit(ws) {
  const hasSubmitted = participantSubmitted.has(ws._id);
  ws.send(JSON.stringify({
    type: 'init',
    phase: state.phase,
    totalQuestions: quizzes.length,
    participantCount: state.participantCount,
    submissionCount: state.submissionCount,
    hasSubmitted,
    // quiz 단계: 문제 목록 전송 (sanitized)
    quizzes: state.phase === 'quiz' ? quizzes.map(sanitize) : null,
    // results/discussing: 전체 결과 데이터
    summaryData: (state.phase === 'results' || state.phase === 'discussing') ? buildSummaryData() : null,
    // discussing: 현재 토론 문제
    discussData: state.phase === 'discussing' ? buildDiscussData(state.discussingIndex) : null,
  }));
}

function sendAdminInit(ws) {
  ws.send(JSON.stringify({
    type: 'adminInit',
    phase: state.phase,
    totalQuestions: quizzes.length,
    participantCount: state.participantCount,
    submissionCount: state.submissionCount,
    discussingIndex: state.discussingIndex,
    quizzes: quizzes.map(q => ({ ...q })), // 관리자는 정답 포함 전체 데이터
    answers: state.answers,
    summaryData: (state.phase === 'results' || state.phase === 'discussing') ? buildSummaryData() : null,
    scores: getAllScores(),
    scoreMax: SCORE_MAX,
    avgScore: getAvgScore(),
  }));
}

function handleAdmin(ws, msg) {
  switch (msg.type) {
    case 'startQuiz': {
      state.phase = 'quiz';
      state.submissionCount = 0;
      participantSubmitted.clear();
      resetAnswers();
      broadcast({ type: 'quizStarted', quizzes: quizzes.map(sanitize), total: quizzes.length }, 'participants');
      broadcast({ type: 'quizStarted', total: quizzes.length }, 'admin');
      break;
    }
    case 'showResults': {
      state.phase = 'results';
      const summary = buildSummaryData();
      broadcast({ type: 'showResults', ...summary }, 'all');
      break;
    }
    case 'discussQuestion': {
      state.phase = 'discussing';
      state.discussingIndex = msg.index;
      const dd = buildDiscussData(msg.index);
      broadcast({ type: 'discussQuestion', ...dd, index: msg.index }, 'all');
      break;
    }
    case 'reset': {
      state.phase = 'waiting';
      state.submissionCount = 0;
      state.discussingIndex = -1;
      participantSubmitted.clear();
      resetAnswers();
      Object.keys(participantNames).forEach(k => delete participantNames[k]);
      Object.keys(participantScores).forEach(k => delete participantScores[k]);
      broadcast({ type: 'reset' }, 'all');
      break;
    }
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
    data.responses.push(key);
    data.total++;
  });

  // 개인 점수 계산
  const score = calculateScore(answers || {});
  participantScores[ws._id] = {
    name: participantNames[ws._id],
    score,
    scoreMax: SCORE_MAX,
  };

  state.submissionCount++;
  ws.send(JSON.stringify({ type: 'submitConfirmed', score, scoreMax: SCORE_MAX }));
  broadcast({
    type: 'submissionUpdate',
    count: state.submissionCount,
    total: state.participantCount,
    scores: getAllScores(),
    avgScore: getAvgScore(),
  }, 'admin');
}

function sanitize(q) {
  const { answer, answerIndex, sampleAnswers, explanation, ...safe } = q;
  return safe;
}

function buildDiscussData(index) {
  const q = quizzes[index];
  if (!q) return null;
  const ans = state.answers[q.id] || { counts: {}, total: 0, responses: [] };
  return {
    question: q,
    answers: ans,
    index,
    total: quizzes.length,
  };
}

function buildSummaryData() {
  // OX·사지선다만 정답률 계산, 주관식 제외
  const items = quizzes.map(q => {
    const ans = state.answers[q.id] || { counts: {}, total: 0 };
    let correctCount = 0;
    if (q.type === 'ox') {
      correctCount = ans.counts[q.answer] || 0;
    } else if (q.type === 'multiple') {
      correctCount = ans.counts[q.answer] || 0;
    }
    const correctRate = q.type === 'subjective' ? null
      : ans.total > 0 ? Math.round((correctCount / ans.total) * 100) : null;
    return {
      id: q.id,
      category: q.category,
      categoryColor: q.categoryColor,
      type: q.type,
      question: q.question,
      correctAnswer: q.type === 'subjective' ? q.sampleAnswers : q.answer,
      explanation: q.explanation,
      options: q.options ?? null,
      answerIndex: q.answerIndex ?? null,
      total: ans.total,
      correctCount,
      correctRate,
    };
  });

  // 카테고리별 평균 정답률
  const categoryMap = {};
  items.forEach(item => {
    if (item.type === 'subjective' || item.correctRate === null) return;
    if (!categoryMap[item.category]) {
      categoryMap[item.category] = { color: item.categoryColor, rates: [] };
    }
    categoryMap[item.category].rates.push(item.correctRate);
  });
  const categories = Object.entries(categoryMap).map(([name, v]) => ({
    name,
    color: v.color,
    avgRate: Math.round(v.rates.reduce((a, b) => a + b, 0) / v.rates.length),
  }));

  // 전체 평균 (OX+사지선다만)
  const allRates = items.filter(i => i.correctRate !== null).map(i => i.correctRate);
  const overallRate = allRates.length > 0
    ? Math.round(allRates.reduce((a, b) => a + b, 0) / allRates.length)
    : null;

  return { items, categories, overallRate };
}


function broadcastParticipantCount() {
  broadcast({ type: 'participantCount', count: state.participantCount }, 'all');
}

function broadcast(data, target) {
  const msg = JSON.stringify(data);
  if (target === 'all' || target === 'participants') {
    participantClients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    });
  }
  if (target === 'all' || target === 'admin') {
    adminClients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    });
  }
}

// ─── QR 코드 엔드포인트 ─────────────────────────────────────────────────────
app.get('/qr.svg', async (req, res) => {
  const url = req.query.url || `http://localhost:${PORT}`;
  try {
    const svg = await QRCode.toString(url, { type: 'svg' });
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (e) {
    res.status(500).send('QR 생성 실패');
  }
});

app.get('/api/serverinfo', (req, res) => {
  res.json({ port: PORT, localIP: getLocalIP() });
});

app.get('/api/publicurl', (req, res) => {
  // 인터넷 배포 환경(Railway 등)에서는 HOST 환경변수 사용, 없으면 로컬 IP
  const publicUrl = process.env.PUBLIC_URL
    ? process.env.PUBLIC_URL
    : `http://${getLocalIP()}:${PORT}`;
  res.json({ url: publicUrl });
});

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const info of iface) {
      if (info.family === 'IPv4' && !info.internal) return info.address;
    }
  }
  return 'localhost';
}

// ─── 서버 시작 ──────────────────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', async () => {
  const ip = getLocalIP();
  const participantURL = `http://${ip}:${PORT}`;
  const adminURL = `http://${ip}:${PORT}/admin.html`;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🎯 장애인인식개선 교육 퀴즈 서버 시작!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📱 참여자 접속: ${participantURL}`);
  console.log(`🖥️  관리자 화면: ${adminURL}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const qr = await QRCode.toString(participantURL, { type: 'terminal', small: true });
    console.log('참여자용 QR 코드:');
    console.log(qr);
  } catch (e) {
    console.log('(QR 터미널 출력 불가)');
  }
});
