/* DaggyBot — Douglas Mwebi's portfolio assistant.
   Rule-based engine over a verified knowledge base (CV + portfolio).
   Answers strictly from that knowledge; unknown topics get an honest
   fallback with contact paths. UI: progressive word-by-word typing. */
(function () {
  'use strict';

  var DEFAULT_CHIPS = ['His skills', 'Patented innovations', 'How to hire him'];

  var KB = [
    {
      id: 'bio',
      keys: ['who is douglas', 'about douglas', 'about him', 'himself', 'introduce', 'background', 'biography', 'profile'],
      answer: 'Douglas Mwebi is a computer scientist and full-stack engineer leading DaggyTechs from Nairobi, Kenya. He is a 4x patented inventor with 15+ production platforms across food security, water, cybersafety, marine conservation, civic transparency and fintech — motivated by lived experience of food insecurity to build affordable, locally relevant technology.',
      chips: ['His skills', 'Patented innovations', 'How to hire him']
    },
    {
      id: 'skills',
      keys: ['skill', 'skills', 'stack', 'technologies', 'tech stack', 'good at', 'expertise', 'capable', 'capabilities', 'know'],
      answer: 'His eight disciplines: Blockchain & Web3 (Solidity, audits, Hardhat, ERC-20/721, DeFi, IPFS); AI (Claude + OpenAI APIs, agents, NLP, vision, fraud models); Backend (Node, Express, Python, Django, REST/GraphQL, Postgres, Mongo, Prisma); Frontend (React, Next.js, Vite, TypeScript, Tailwind); IoT & hardware; M-Pesa fintech; DevOps (Docker, CI/CD); and team leadership.',
      chips: ['Blockchain skills?', 'AI experience?', 'How to hire him']
    },
    {
      id: 'blockchain',
      keys: ['blockchain', 'web3', 'solidity', 'smart contract', 'evm', 'hardhat', 'defi', 'dapp', 'ethereum', 'polygon', 'wallet', 'metamask', 'token', 'audit'],
      answer: 'Blockchain is his core specialty: Solidity development and audits, Hardhat test suites, ERC-20/721 tokens, DeFi logic, IPFS storage and MetaMask/WalletConnect integration across Ethereum, Polygon and BSC. Recent work: a gas-conscious student-fee contract tested end-to-end in Remix, with role-based access and event-emitted receipts.',
      chips: ['Does he audit contracts?', 'Student Fees contract', 'How to hire him']
    },
    {
      id: 'ai',
      keys: ['ai', 'artificial intelligence', 'machine learning', 'ml', 'nlp', 'chatbot', 'vision', 'claude', 'openai', 'agent'],
      answer: 'Applied AI is his second pillar: Claude and OpenAI APIs, AI agents and chatbots, NLP (including code-mixed Kenyan English and Sheng), computer vision and fraud-detection models — shipped in SafeNet (cybersafety), KenyaWatch AI (contract fraud) and Akili (career and wellness).',
      chips: ['SafeNet details', 'KenyaWatch AI', 'Akili']
    },
    {
      id: 'iot',
      keys: ['iot', 'hardware', 'sensor', 'embedded', 'device'],
      answer: 'He builds field IoT end to end: sensor integration, real-time data pipelines and embedded design with low-cost devices — proven in Shamba Smart (farming), MajiSmart (water) and AquaSense (marine pH), all designed for intermittent connectivity and basic phones.',
      chips: ['Shamba Smart', 'MajiSmart', 'How to hire him']
    },
    {
      id: 'fintech',
      keys: ['fintech', 'mpesa', 'm-pesa', 'payment', 'paybill', 'stk', 'c2b', 'money'],
      answer: 'He integrates Safaricom Daraja M-Pesa (STK Push, C2B callbacks), reconciliation flows, receipts and KYC — live in EduFund Portal (bursary payments) and Pesa Grow (investment deposits with statements).',
      chips: ['EduFund Portal', 'Pesa Grow', 'How to hire him']
    },
    {
      id: 'backend',
      keys: ['backend', 'node', 'express', 'python', 'django', 'api', 'database', 'postgres', 'mongo', 'graphql'],
      answer: 'Backend: Node.js/Express and Python/Django, REST and GraphQL APIs, PostgreSQL, MongoDB, Prisma, SQLite and sql.js — with auth, validation, backups and rate limiting checked before every launch.',
      chips: ['His skills', 'Selected platforms', 'How to hire him']
    },
    {
      id: 'frontend',
      keys: ['frontend', 'react', 'next', 'typescript', 'tailwind', 'vite', 'website', 'ui'],
      answer: 'Frontend: React, Next.js, Vite, TypeScript and Tailwind — including wallet-connected dApp interfaces with proper transaction states. EduFund Portal runs on Next.js 14 with an admin dashboard and PDF export.',
      chips: ['EduFund Portal', 'His skills', 'Contact info']
    },
    {
      id: 'patents',
      keys: ['patent', 'patents', 'patented', 'invention', 'innovations'],
      answer: 'He holds 4 patents: Shamba Smart (IoT+AI farming advisory — KES 150,000 pilot funding, targeting 10,000 farmers across 10 counties), MajiSmart (real-time water monitoring), SafeNet (AI cyberbullying detection) and AquaSense (marine pH monitoring with an AI agent).',
      chips: ['Shamba Smart', 'MajiSmart', 'SafeNet']
    },
    {
      id: 'shamba',
      keys: ['shamba'],
      answer: 'Shamba Smart is his flagship patented platform: IoT sensors plus AI crop advisory, soil insights and market linkage — affordable, offline-capable and usable on basic phones. It secured KES 150,000 in pilot funding and targets 10,000 farmers across 10 Kenyan counties in year one.',
      chips: ['MajiSmart', 'How to hire him', 'Awards']
    },
    {
      id: 'maji',
      keys: ['maji', 'water'],
      answer: 'MajiSmart is his patented smart-water system: low-cost sensors stream flow rate and turbidity to a web interface used by both citizens and water officials — built for Kenya\u2019s water access and distribution challenge.',
      chips: ['Shamba Smart', 'AquaSense', 'Contact info']
    },
    {
      id: 'safenet',
      keys: ['safenet', 'cyberbul', 'bully', 'safety', 'moderation'],
      answer: 'SafeNet is his patented AI cybersafety tool: NLP and machine-learning models detect and escalate harmful online content in real time, with zero manual moderation — built for rising cyberbullying in Kenya\u2019s online spaces.',
      chips: ['AI experience?', 'Patented innovations', 'How to hire him']
    },
    {
      id: 'aqua',
      keys: ['aqua', 'marine', 'ocean', 'conservation', 'biodiversity'],
      answer: 'AquaSense is his patented marine-conservation system (contributor & developer): IoT sensors continuously monitor water pH, stream live data to a dashboard, and an AI agent generates conservation recommendations.',
      chips: ['MajiSmart', 'Patented innovations', 'Contact info']
    },
    {
      id: 'projects',
      keys: ['project', 'projects', 'work', 'portfolio', 'platform', 'platforms', 'built', 'apps'],
      answer: 'Selected production work: KenyaWatch AI (105,738+ contracts analysed), Shamba Smart, MajiSmart, SafeNet, CivicAI, Akili, EduFund Portal, Pesa Grow and the Student Fees smart contract. Ask me about any of them by name — or tap a topic below.',
      chips: ['KenyaWatch AI', 'CivicAI', 'Student Fees contract']
    },
    {
      id: 'kenyawatch',
      keys: ['kenyawatch', 'kenya watch', 'corruption', 'fraud', 'eacc', 'contract'],
      answer: 'KenyaWatch AI is his flagship civic platform: it analyses 105,738+ government contracts across all 47 counties, flags procurement fraud and ghost projects, and generates EACC risk scores on a real-time dashboard (Node.js, PostgreSQL, Anthropic AI).',
      chips: ['CivicAI', 'AI experience?', 'How to hire him']
    },
    {
      id: 'civicai',
      keys: ['civicai', 'civic', 'report', 'complaint'],
      answer: 'CivicAI is a multilingual civic-action platform: citizens report local problems by text, voice or photo; AI classifies the issue, drafts legal complaints and computes community pressure scores (React, Vite, GeoAPI).',
      chips: ['KenyaWatch AI', 'Akili', 'Contact info']
    },
    {
      id: 'akili',
      keys: ['akili', 'career', 'wellness', 'mental', 'kiswahili', 'swahili'],
      answer: 'Akili is his AI career and mental-wellness platform in Kiswahili and English: Claude-powered job matching, career coaching and support with crisis detection (React, Node.js).',
      chips: ['AI experience?', 'CivicAI', 'How to hire him']
    },
    {
      id: 'edufund',
      keys: ['edufund', 'bursary', 'school fees'],
      answer: 'EduFund Portal replaced paper bursary forms in a full school term: Next.js 14 multi-step applications with M-Pesa payment, admin review dashboard and PDF export (Prisma, Docker).',
      chips: ['Pesa Grow', 'M-Pesa work?', 'How to hire him']
    },
    {
      id: 'pesa',
      keys: ['pesa grow', 'investment', 'investor', 'kyc'],
      answer: 'Pesa Grow tracks investments with M-Pesa deposits: statements, an admin panel and KYC document management in production (Node.js, SQLite).',
      chips: ['EduFund Portal', 'M-Pesa work?', 'Contact info']
    },
    {
      id: 'fees',
      keys: ['student fee', 'fee contract', 'fee management'],
      answer: 'His Student Fees smart contract automates fee collection on-chain: role-based access (admin, bursar, auditor), event-emitted receipts, gas-conscious design and a Remix test suite covering underpayment and double-pay.',
      chips: ['Blockchain skills?', 'Does he audit contracts?', 'How to hire him']
    },
    {
      id: 'awards',
      keys: ['award', 'awards', 'won', 'win', 'trophy', 'hackathon', 'prize', 'recognition', 'niru', 'wirrc'],
      answer: 'National and regional recognition: NIRU Hackathon national winner, WIRRC regional winner, Kisii University Innovation Week top innovator, and Young Innovator national recognition at TUM for patented, impactful solutions.',
      chips: ['Patented innovations', 'Leadership', 'How to hire him']
    },
    {
      id: 'leadership',
      keys: ['leader', 'leadership', 'club', 'mentor', 'community', 'team', 'teach', 'workshop', 'cofounder', 'co-founder', 'founder'],
      answer: 'He founded and leads the Science and Innovation Club at Kisii University — workshops, hackathon coaching and peer mentorship for upcoming Kenyan innovators — and leads the small tech group DaggyTechs.',
      chips: ['Education', 'Awards', 'Contact info']
    },
    {
      id: 'education',
      keys: ['education', 'degree', 'university', 'study', 'studied', 'school', 'college', 'bsc', 'kisii university'],
      answer: 'B.Sc. in Computer Science from Kisii University, Kenya — plus continuous self-driven study across blockchain, AI, IoT and security.',
      chips: ['His skills', 'Leadership', 'Download his CV?']
    },
    {
      id: 'experience',
      keys: ['experience', 'years', 'long', 'senior'],
      answer: '3+ years shipping production: 15+ platforms live, 47 counties served, 105,738 contracts analysed, 4 patents granted and KES 150,000 in pilot funding secured.',
      chips: ['Selected platforms', 'Patented innovations', 'How to hire him']
    },
    {
      id: 'hire',
      keys: ['hire', 'employ', 'job', 'role', 'contract', 'work with', 'collaborate', 'freelance', 'position', 'opening', 'vacancy', 'available', 'engagement'],
      answer: 'Three ways to hire him: 1) Full-time senior/lead roles (Nairobi hybrid/on-site, or remote). 2) Fixed-scope contracts — one written quote, weekly demos, typical pilot 2–6 weeks. 3) Smart-contract audits and advisory. Start with the contact form below; he replies within one working day.',
      chips: ['What does it cost?', 'Contact info', 'Blockchain skills?']
    },
    {
      id: 'pricing',
      keys: ['price', 'pricing', 'cost', 'rate', 'rates', 'pay', 'salary', 'budget', 'charge', 'much'],
      answer: 'He quotes fixed prices per scope — no surprise bills. Share your timeline and budget range in the contact form (or email mwebidouglas08@gmail.com) and you will get a written quote, usually within one working day.',
      chips: ['How to hire him', 'Contact info', 'His skills']
    },
    {
      id: 'process',
      keys: ['process', 'workflow', 'how does he work', 'method', 'timeline', 'long does', 'deliver', 'handover'],
      answer: 'Scope (one call, fixed quote) → Build (weekly clickable demos) → Harden (auth, validation, backups, rate limits) → Handover (deployed, documented, credentials transferred). Typical pilots run 2–6 weeks.',
      chips: ['How to hire him', 'What does it cost?', 'Contact info']
    },
    {
      id: 'audits',
      keys: ['audit', 'audits', 'auditing', 'review my contract', 'review', 'security'],
      answer: 'Yes — contract reviews cover access control, reentrancy, oracle and upgrade risks, delivered as a severity-graded findings report with fixes implemented and re-tested. Use the contact form and mention “audit”.',
      chips: ['Blockchain skills?', 'How to hire him', 'Contact info']
    },
    {
      id: 'contact',
      keys: ['contact', 'email', 'phone', 'call', 'whatsapp', 'reach', 'talk', 'message', 'location', 'based', 'where', 'nairobi', 'address', 'find him'],
      answer: 'Reach him at mwebidouglas08@gmail.com or +254 796 820 013 (phone/WhatsApp), based in Nairobi, Kenya — or use the contact form on this page. He replies within one working day.',
      chips: ['How to hire him', 'Download his CV?', 'His skills']
    },
    {
      id: 'cv',
      keys: ['cv', 'resume', 'download'],
      answer: 'You can download his CV from the hero and About sections of this page (/cv.html) — it prints cleanly to PDF. It covers all 4 patents, platforms, awards and the full skill set.',
      chips: ['His skills', 'Education', 'How to hire him']
    },
    {
      id: 'socials',
      keys: ['github', 'linkedin', 'twitter', 'x.com', 'social', 'facebook', 'instagram', 'youtube', 'follow'],
      answer: 'Find him on GitHub (mwebidouglas08-netizen), LinkedIn (douglas-mwebi), X (@Daggy_58), Facebook (Devmwebi), Instagram and YouTube (@douglasmwebi) — all linked in the footer below.',
      chips: ['Selected platforms', 'Contact info', 'How to hire him']
    }
  ];

  var SMALLTALK = [
    { re: /^(hi|hey|hello|morning|afternoon|evening|habari|niaje)\b/, text: 'Hello — I\u2019m Daggy, Douglas Mwebi\u2019s assistant. Ask me about his skills, patented innovations, projects, awards, or how to hire him.', chips: DEFAULT_CHIPS },
    { re: /\b(thank|thanks|asante|great|awesome|nice)\b/, text: 'You\u2019re welcome. Anything else — his Web3 practice, a specific project, or hiring details?', chips: ['Blockchain skills?', 'How to hire him', 'Contact info'] },
    { re: /\b(bye|goodbye|later|see you)\b/, text: 'Goodbye — and if you\u2019d like to work with Douglas, the contact form below reaches him directly. He replies within one working day.', chips: ['Contact info'] },
    { re: /\b(who are you|your name|about you|what are you)\b/, text: 'I\u2019m Daggy, a knowledge assistant trained on Douglas Mwebi\u2019s verified profile — skills, patents, projects, awards and hiring paths. I answer in his place so you get facts in seconds.', chips: DEFAULT_CHIPS }
  ];

  var FALLBACK = {
    text: 'I answer strictly from Douglas\u2019s verified profile, and I couldn\u2019t match that question. Try asking about his skills, patents, a project by name, awards, or hiring — or email him directly at mwebidouglas08@gmail.com and he\u2019ll reply within one working day.',
    chips: ['His skills', 'Patented innovations', 'How to hire him']
  };

  function normalize(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9\s+.#]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // Keys are normalized once so variants like "M-Pesa" match "m pesa".
  KB.forEach(function (entry) {
    entry.keys = entry.keys.map(function (k) { return normalize(k); });
  });

  // Domain anchors: strong topic signals that disambiguate close calls.
  var ANCHORS = [
    { re: /\b(audit|audits|auditing|review|reviews|security)\b/, ids: { audits: 5 } },
    { re: /\b(solidity|web3|evm|defi|dapp|nft|token|tokens|wallet|metamask|hardhat|remix|polygon|ethereum|bsc)\b/, ids: { blockchain: 4 } },
    { re: /\b(iot|sensor|sensors|hardware|embedded|device|devices)\b/, ids: { iot: 4 } }
  ];

  function answerQuery(raw) {
    var text = normalize(raw);
    if (!text) return { text: 'Ask me anything about Douglas — skills, patents, projects or hiring.', chips: DEFAULT_CHIPS };
    var i, s;
    for (i = 0; i < SMALLTALK.length; i++) {
      if (SMALLTALK[i].re.test(text)) return { text: SMALLTALK[i].text, chips: SMALLTALK[i].chips };
    }
    var padded = ' ' + text + ' ';
    var best = null, bestScore = 0;
    for (i = 0; i < KB.length; i++) {
      var entry = KB[i], score = 0;
      for (s = 0; s < entry.keys.length; s++) {
        var key = entry.keys[s];
        // Word-start match: "maji" matches "majismart", "skill" matches "skills".
        if (key && padded.indexOf(' ' + key) !== -1) {
          score += 1 + key.length / 4;
        }
      }
      for (s = 0; s < ANCHORS.length; s++) {
        if (ANCHORS[s].re.test(text) && ANCHORS[s].ids[entry.id]) {
          score += ANCHORS[s].ids[entry.id];
        }
      }
      if (score > bestScore) { bestScore = score; best = entry; }
    }
    if (best && bestScore >= 1.5) return { text: best.answer, chips: best.chips };
    return FALLBACK;
  }

  /* ---------- UI (browser only) ---------- */
  function initUI() {
    var fab = document.getElementById('chatFab');
    var panel = document.getElementById('chatPanel');
    var body = document.getElementById('chatBody');
    var chipsBox = document.getElementById('chatChips');
    var form = document.getElementById('chatForm');
    var input = document.getElementById('chatInput');
    var closeBtn = document.getElementById('chatClose');
    if (!fab || !panel || !body || !form || !input) return;

    var opened = false;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function scrollDown() { body.scrollTop = body.scrollHeight; }

    function setChips(chips) {
      chipsBox.innerHTML = '';
      (chips || []).forEach(function (label) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip';
        b.textContent = label;
        b.addEventListener('click', function () { sendUser(label); });
        chipsBox.appendChild(b);
      });
    }

    function addUser(text) {
      var d = document.createElement('div');
      d.className = 'msg msg-user';
      d.textContent = text;
      body.appendChild(d);
      scrollDown();
    }

    function addThinking() {
      var d = document.createElement('div');
      d.className = 'msg msg-bot';
      d.innerHTML = '<span class="thinking" aria-hidden="true"><span></span><span></span><span></span></span>';
      body.appendChild(d);
      scrollDown();
      return d;
    }

    // Aggressive-beautiful progressive writing: word batches on a fast ticker.
    function typeInto(el, fullText, done) {
      if (reduced) { el.textContent = fullText; scrollDown(); if (done) done(); return; }
      var words = fullText.split(/\s+/);
      var i = 0;
      var cursor = document.createElement('span');
      cursor.className = 'typing-cursor';
      el.textContent = '';
      el.appendChild(cursor);
      var timer = setInterval(function () {
        var batch = words.slice(i, i + 3).join(' ');
        i += 3;
        cursor.insertAdjacentText('beforebegin', (el.textContent && el.textContent.length ? ' ' : '') + batch);
        scrollDown();
        if (i >= words.length) {
          clearInterval(timer);
          cursor.remove();
          scrollDown();
          if (done) done();
        }
      }, 45);
    }

    function botReply(userText) {
      var thinking = addThinking();
      var result = answerQuery(userText);
      setTimeout(function () {
        typeInto(thinking, result.text, function () { setChips(result.chips); });
      }, reduced ? 0 : 650);
    }

    function sendUser(text) {
      var clean = String(text || '').trim();
      if (!clean) return;
      addUser(clean.length > 300 ? clean.slice(0, 300) : clean);
      setChips([]);
      botReply(clean);
    }

    function openChat() {
      panel.hidden = false;
      fab.setAttribute('aria-expanded', 'true');
      if (!opened) {
        opened = true;
        var greet = answerQuery('hello');
        var d = document.createElement('div');
        d.className = 'msg msg-bot';
        body.appendChild(d);
        typeInto(d, greet.text, function () { setChips(greet.chips); });
      }
      setTimeout(function () { input.focus(); }, 60);
    }

    function closeChat() {
      panel.hidden = true;
      fab.setAttribute('aria-expanded', 'false');
    }

    fab.addEventListener('click', function () {
      if (panel.hidden) openChat(); else closeChat();
    });
    closeBtn.addEventListener('click', closeChat);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !panel.hidden) closeChat();
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      sendUser(input.value);
      input.value = '';
      input.focus();
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initUI);
    } else {
      initUI();
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { answerQuery: answerQuery, KB: KB };
  }
})();
