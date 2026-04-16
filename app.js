// ══════════════════════════════════════
//  STATE
// ══════════════════════════════════════
let state = {
  gender: 'male',
  age: 25, height: 165, weight: 60,
  waist: null, hip: null,
  activity: 1.375,
  goal: '',
  mealStyle: 'balanced',
  // computed
  bmi: 0, bmr: 0, tdee: 0, targetCal: 0,
  proteinG: 0, carbG: 0, fatG: 0,
};

// ══════════════════════════════════════
//  UI HELPERS
// ══════════════════════════════════════
function selectGender(g) {
  state.gender = g;
  document.getElementById('btn-male').classList.toggle('active', g === 'male');
  document.getElementById('btn-female').classList.toggle('active', g === 'female');
}

function selectGoal(g) {
  state.goal = g;
  document.getElementById('goal').value = g;
  ['lose', 'maintain', 'gain'].forEach(id =>
    document.getElementById('goal-' + id).classList.toggle('active', id === g)
  );
  document.getElementById('btn-to-plan').disabled = false;
}

function setStep(n) {
  [1,2,3].forEach(i => {
    const dot = document.getElementById('step-dot-' + i);
    if (!dot) return;
    dot.classList.remove('active', 'done');
    if (i < n) dot.classList.add('done');
    if (i === n) dot.classList.add('active');
  });
}

function show(id) { document.getElementById(id).classList.remove('hidden'); }
function hide(id) { document.getElementById(id).classList.add('hidden'); }

function backToStep1() {
  hide('section-step2'); hide('section-step3');
  show('section-step1');
  setStep(1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function backToStep2() {
  hide('section-step3');
  show('section-step2');
  setStep(2);
  document.getElementById('section-step2').scrollIntoView({ behavior: 'smooth' });
}

// ══════════════════════════════════════
//  STEP 1 → WHO ASSESSMENT
// ══════════════════════════════════════
function runAssessment() {
  state.age      = parseFloat(document.getElementById('age').value) || 25;
  state.height   = parseFloat(document.getElementById('height').value) || 165;
  state.weight   = parseFloat(document.getElementById('weight').value) || 60;
  state.waist    = parseFloat(document.getElementById('waist').value) || null;
  state.hip      = parseFloat(document.getElementById('hip').value) || null;
  state.activity = parseFloat(document.getElementById('activity').value) || 1.375;

  const { age, height, weight, waist, hip, gender } = state;
  const hm = height / 100;

  // ── BMI ──────────────────────────────
  const bmi = weight / (hm * hm);
  state.bmi = bmi;

  // ── BMR (Mifflin-St Jeor) ────────────
  state.bmr = gender === 'male'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;

  // ── TDEE ─────────────────────────────
  state.tdee = state.bmr * state.activity;

  // ── Body Fat % (Deurenberg) ──────────
  const bodyFat = Math.max(3, 1.2 * bmi + 0.23 * age - (gender === 'male' ? 16.2 : 5.4));

  // ── Lean Mass ────────────────────────
  const leanMass = weight * (1 - bodyFat / 100);

  // ── Muscle Mass estimate (≈ 45% lean) ─
  const muscleMass = leanMass * 0.45;

  // ── Bone Mass estimate (Heymsfield) ──
  const boneMass = gender === 'male'
    ? 0.0933 * weight + 0.0058 * height - 0.0285 * age + 0.71
    : 0.0722 * weight + 0.0088 * height - 0.0177 * age + 0.42;

  // ── Visceral Fat estimate ─────────────
  // Using circumference if available, else BMI-based
  let visceralFat;
  if (waist) {
    // Bergman / WHO approach
    visceralFat = gender === 'male'
      ? Math.round((waist - 94) / 4 + 5)
      : Math.round((waist - 80) / 4 + 5);
    visceralFat = Math.max(1, Math.min(30, visceralFat));
  } else {
    // BMI-based approximation
    visceralFat = gender === 'male'
      ? Math.round((bmi - 18.5) * 0.9 + 3)
      : Math.round((bmi - 17) * 0.8 + 2);
    visceralFat = Math.max(1, Math.min(25, visceralFat));
  }

  // ── WHR ──────────────────────────────
  const whr = (waist && hip) ? (waist / hip) : null;

  // ── Ideal Weight (WHO BMI 18.5–22.9 for Asians) ──
  const bmiTargetLow = 18.5, bmiTargetHigh = 22.9;
  const idealLow  = Math.round(bmiTargetLow  * hm * hm);
  const idealHigh = Math.round(bmiTargetHigh * hm * hm);

  // ── WHO Body Fat Ranges ───────────────
  // WHO / ACE standards
  const fatRanges = gender === 'male'
    ? { essential:[2,5], athlete:[6,13], fit:[14,17], average:[18,24], obese:[25,100] }
    : { essential:[10,13], athlete:[14,20], fit:[21,24], average:[25,31], obese:[32,100] };

  let fatStatus, fatClass;
  if (bodyFat <= fatRanges.athlete[1]) { fatStatus = 'Vận động viên'; fatClass = 'status-excellent'; }
  else if (bodyFat <= fatRanges.fit[1]) { fatStatus = 'Tốt'; fatClass = 'status-good'; }
  else if (bodyFat <= fatRanges.average[1]) { fatStatus = 'Bình thường'; fatClass = 'status-warning'; }
  else { fatStatus = 'Cao'; fatClass = 'status-danger'; }

  // ── BMI Classification (Asian WHO) ───
  let bmiClass, bmiStatus;
  if (bmi < 18.5)      { bmiClass = 'status-low';     bmiStatus = 'Thiếu cân'; }
  else if (bmi < 23)   { bmiClass = 'status-excellent'; bmiStatus = 'Bình thường'; }
  else if (bmi < 27.5) { bmiClass = 'status-warning';  bmiStatus = 'Thừa cân'; }
  else                 { bmiClass = 'status-danger';   bmiStatus = 'Béo phì'; }

  // ── Visceral fat assessment ───────────
  let visClass, visStatus;
  if (visceralFat <= 9)       { visClass = 'status-excellent'; visStatus = 'Rất tốt'; }
  else if (visceralFat <= 12) { visClass = 'status-good';      visStatus = 'Bình thường'; }
  else if (visceralFat <= 17) { visClass = 'status-warning';   visStatus = 'Cao'; }
  else                        { visClass = 'status-danger';    visStatus = 'Nguy hiểm'; }

  // ── WHR assessment ────────────────────
  let whrStatus = null, whrClass = 'status-good';
  if (whr !== null) {
    const whrLimit = gender === 'male' ? 0.9 : 0.85;
    if (whr <= whrLimit - 0.05) { whrClass = 'status-excellent'; whrStatus = 'Lý tưởng'; }
    else if (whr <= whrLimit)   { whrClass = 'status-good';      whrStatus = 'Tốt'; }
    else if (whr <= whrLimit + 0.05) { whrClass = 'status-warning'; whrStatus = 'Hơi cao'; }
    else                        { whrClass = 'status-danger';    whrStatus = 'Cao'; }
  }

  // ══ Render composition cards
  const cards = [
    { icon: '⚖️', label: 'BMI', value: bmi.toFixed(1), unit: 'kg/m²', badge: bmiStatus, cls: bmiClass },
    { icon: '💧', label: 'Mỡ cơ thể', value: bodyFat.toFixed(1), unit: '%', badge: fatStatus, cls: fatClass },
    { icon: '🧬', label: 'Mỡ nội tạng', value: visceralFat, unit: 'điểm', badge: visStatus, cls: visClass },
    { icon: '💪', label: 'Khối cơ (ước tính)', value: muscleMass.toFixed(1), unit: 'kg', badge: 'Tham khảo', cls: 'status-info' },
    { icon: '🦴', label: 'Khối xương (ước tính)', value: Math.max(1.5, boneMass).toFixed(1), unit: 'kg', badge: 'Tham khảo', cls: 'status-info' },
    { icon: '🏃', label: 'Cân nạc', value: leanMass.toFixed(1), unit: 'kg', badge: 'Mô + nước + xương', cls: 'status-good' },
  ];

  if (whr !== null) {
    cards.push({ icon: '📏', label: 'Tỉ lệ eo–hông', value: whr.toFixed(2), unit: 'WHR', badge: whrStatus, cls: whrClass });
  }

  document.getElementById('composition-grid').innerHTML = cards.map((c, i) => `
    <div class="comp-card ${c.cls}" style="animation-delay:${i * 0.06}s">
      <div class="comp-icon">${c.icon}</div>
      <div class="comp-label">${c.label}</div>
      <div class="comp-value">${c.value}</div>
      <div class="comp-unit">${c.unit}</div>
      ${c.badge ? `<div class="comp-badge">${c.badge}</div>` : ''}
    </div>
  `).join('');

  // ══ WHO Verdict banner
  let verdictIcon, verdictClass, verdictTitle, verdictDesc;
  if (bmi >= 18.5 && bmi < 23 && bodyFat < fatRanges.average[0]) {
    verdictIcon = '✅'; verdictClass = 'verdict-ok';
    verdictTitle = 'Bạn đang trong ngưỡng sức khỏe tốt theo WHO';
    verdictDesc = `BMI <strong>${bmi.toFixed(1)}</strong> nằm trong khoảng lý tưởng (18.5–22.9 theo tiêu chuẩn WHO châu Á). Mỡ cơ thể ở mức tốt. Mục tiêu nên là duy trì và cải thiện thể lực.`;
  } else if (bmi < 18.5) {
    verdictIcon = '📉'; verdictClass = 'verdict-low';
    verdictTitle = 'Cân nặng của bạn thấp hơn mức chuẩn WHO';
    verdictDesc = `BMI <strong>${bmi.toFixed(1)}</strong> thấp hơn 18.5. WHO khuyến nghị đạt cân nặng lý tưởng <strong>${idealLow}–${idealHigh} kg</strong> để đảm bảo cơ thể có đủ dự trữ dinh dưỡng và khối cơ. Ưu tiên: tăng cân lành mạnh, tăng cơ.`;
  } else if (bmi < 27.5) {
    verdictIcon = '⚠️'; verdictClass = 'verdict-warn';
    verdictTitle = 'Bạn đang ở mức thừa cân theo tiêu chuẩn WHO châu Á';
    verdictDesc = `BMI <strong>${bmi.toFixed(1)}</strong> vượt ngưỡng khuyến nghị (23.0). WHO khuyến nghị cân nặng lý tưởng cho chiều cao của bạn là <strong>${idealLow}–${idealHigh} kg</strong>. Nên giảm mỡ và tăng hoạt động thể chất.`;
  } else {
    verdictIcon = '🔴'; verdictClass = 'verdict-danger';
    verdictTitle = 'Cần chú ý – BMI ở mức béo phì theo WHO';
    verdictDesc = `BMI <strong>${bmi.toFixed(1)}</strong> thuộc nhóm béo phì (≥27.5 theo tiêu chuẩn châu Á). Nguy cơ tăng cao với tim mạch, tiểu đường type 2, và các bệnh mãn tính. Cân nặng mục tiêu: <strong>${idealLow}–${idealHigh} kg</strong>. Tham khảo bác sĩ / chuyên gia dinh dưỡng.`;
  }

  document.getElementById('who-verdict').innerHTML = `
    <div class="who-verdict ${verdictClass}">
      <div class="verdict-icon">${verdictIcon}</div>
      <div class="verdict-body">
        <div class="verdict-title">${verdictTitle}</div>
        <div class="verdict-desc">${verdictDesc}</div>
      </div>
    </div>
  `;

  // ══ Ideal Targets
  const idealBodyFatLow  = gender === 'male' ? 10 : 18;
  const idealBodyFatHigh = gender === 'male' ? 17 : 24;
  const weightDiff = weight - idealHigh; // positive = need to lose

  document.getElementById('ideal-targets').innerHTML = `
    <div class="ideal-targets">
      <div class="ideal-title">🎯 Mục tiêu lý tưởng theo WHO (dành cho bạn)</div>
      <div class="ideal-grid">
        <div class="ideal-item">
          <div class="ideal-label">Cân nặng lý tưởng</div>
          <div class="ideal-val">${idealLow}–${idealHigh} kg</div>
          <div class="ideal-sub">BMI 18.5–22.9 (WHO châu Á)</div>
        </div>
        <div class="ideal-item">
          <div class="ideal-label">BMI mục tiêu</div>
          <div class="ideal-val">18.5–22.9</div>
          <div class="ideal-sub">Tiêu chuẩn WHO châu Á</div>
        </div>
        <div class="ideal-item">
          <div class="ideal-label">% Mỡ lý tưởng</div>
          <div class="ideal-val">${idealBodyFatLow}–${idealBodyFatHigh}%</div>
          <div class="ideal-sub">ACE / WHO khuyến nghị</div>
        </div>
        <div class="ideal-item">
          <div class="ideal-label">${weightDiff > 0 ? 'Cần giảm' : weightDiff < -3 ? 'Cần tăng' : 'Chênh lệch'}</div>
          <div class="ideal-val" style="color:${weightDiff > 3 ? 'var(--amber)' : weightDiff < -3 ? 'var(--blue-400)' : 'var(--green-400)'}">
            ${Math.abs(weightDiff) < 1 ? '✓ Lý tưởng' : (weightDiff > 0 ? '−' : '+') + Math.abs(weightDiff).toFixed(1) + ' kg'}
          </div>
          <div class="ideal-sub">So với cân nặng hiện tại</div>
        </div>
      </div>
    </div>
  `;

  // ══ Auto-suggest goal
  if (bmi >= 18.5 && bmi < 23 && bodyFat < fatRanges.average[0]) {
    selectGoal('maintain');
  } else if (bmi < 18.5) {
    selectGoal('gain');
  } else {
    selectGoal('lose');
  }

  hide('section-step1');
  show('section-step2');
  setStep(2);
  document.getElementById('section-step2').scrollIntoView({ behavior: 'smooth' });
}

// ══════════════════════════════════════
//  STEP 2 → GENERATE PLAN
// ══════════════════════════════════════
function generatePlan() {
  const { bmr, tdee, goal, weight, gender, age } = state;

  // Target calories
  let targetCal;
  if (goal === 'lose')     targetCal = tdee - 500;
  else if (goal === 'gain') targetCal = tdee + 400;
  else                       targetCal = tdee;
  targetCal = Math.max(1200, Math.round(targetCal));
  state.targetCal = targetCal;

  // Macros
  let proteinPct, carbPct, fatPct;
  if (goal === 'lose') {
    proteinPct = 0.35; carbPct = 0.35; fatPct = 0.30;
  } else if (goal === 'gain') {
    proteinPct = 0.30; carbPct = 0.45; fatPct = 0.25;
  } else {
    proteinPct = 0.30; carbPct = 0.40; fatPct = 0.30;
  }

  state.proteinG = Math.round(targetCal * proteinPct / 4);
  state.carbG    = Math.round(targetCal * carbPct / 4);
  state.fatG     = Math.round(targetCal * fatPct / 9);

  const proteinCal = Math.round(targetCal * proteinPct);
  const carbCal    = Math.round(targetCal * carbPct);
  const fatCal     = Math.round(targetCal * fatPct);

  // Water recommendation
  const waterL = (weight * 0.033).toFixed(1);

  // ── Render calorie card
  const goalLabel = { lose: 'Giảm cân (TDEE − 500)', maintain: 'Duy trì (= TDEE)', gain: 'Tăng cân (TDEE + 400)' };
  document.getElementById('calorie-display').innerHTML = `
    <div class="calorie-row">
      <div class="cal-item">
        <div class="cal-label">BMR (nghỉ ngơi)</div>
        <div class="cal-number" style="color:var(--text-muted)">${Math.round(bmr).toLocaleString()}</div>
        <div class="cal-unit">kcal/ngày</div>
      </div>
      <div class="cal-divider"></div>
      <div class="cal-item cal-main">
        <div class="cal-label">Mục tiêu hàng ngày</div>
        <div class="cal-number">${targetCal.toLocaleString()}</div>
        <div class="cal-unit">kcal / ngày</div>
        <div class="cal-tag">${goalLabel[goal]}</div>
      </div>
      <div class="cal-divider"></div>
      <div class="cal-item">
        <div class="cal-label">TDEE (vận động)</div>
        <div class="cal-number" style="color:var(--text-muted)">${Math.round(tdee).toLocaleString()}</div>
        <div class="cal-unit">kcal/ngày</div>
      </div>
    </div>
  `;

  document.getElementById('macro-grid').innerHTML = `
    <div class="macro-card macro-protein">
      <div class="macro-icon">🥩</div>
      <div class="macro-label">Protein</div>
      <div class="macro-gram">${state.proteinG}g</div>
      <div class="macro-cal">${proteinCal} kcal</div>
      <div class="macro-pct">${Math.round(proteinPct * 100)}%</div>
    </div>
    <div class="macro-card macro-carb">
      <div class="macro-icon">🍚</div>
      <div class="macro-label">Carbohydrate</div>
      <div class="macro-gram">${state.carbG}g</div>
      <div class="macro-cal">${carbCal} kcal</div>
      <div class="macro-pct">${Math.round(carbPct * 100)}%</div>
    </div>
    <div class="macro-card macro-fat">
      <div class="macro-icon">🥑</div>
      <div class="macro-label">Chất béo</div>
      <div class="macro-gram">${state.fatG}g</div>
      <div class="macro-cal">${fatCal} kcal</div>
      <div class="macro-pct">${Math.round(fatPct * 100)}%</div>
    </div>
  `;

  document.getElementById('water-row').innerHTML = `
    <div class="w-icon">💧</div>
    <div class="w-text">Uống ít nhất <strong>${waterL} lít nước / ngày</strong> (${Math.round(waterL * 1000)} ml) — tính theo cân nặng ${weight}kg × 33ml</div>
  `;

  // ── Render meals
  renderMeals();

  // ── Render Herbalife
  renderHerbalife();

  // ── Render Tips
  renderTips();

  hide('section-step2');
  show('section-step3');
  setStep(3);
  document.getElementById('calorie-card').scrollIntoView({ behavior: 'smooth' });
}

// ══════════════════════════════════════
//  MEAL PLAN – 3 STYLES × 3 OPTIONS
// ══════════════════════════════════════
function switchMealStyle(style) {
  state.mealStyle = style;
  ['balanced', 'asian', 'strict'].forEach(s => {
    document.getElementById('style-' + s).classList.toggle('active', s === style);
  });
  renderMeals();
}

function renderMeals() {
  const { targetCal, goal, mealStyle } = state;
  const style = mealStyle;

  // Meal templates — options = [A: cân bằng, B: món thứ 2, C: món thứ 3]
  const mealData = getMealData(targetCal, goal, style);

  document.getElementById('meal-plan').innerHTML = `
    <div class="meal-list">
      ${mealData.map(m => `
        <div class="meal-item">
          <div class="meal-header">
            <div class="meal-time-chip">${m.time}</div>
            <div class="meal-title">${m.name}</div>
            <div class="meal-kcal">~${m.kcal} kcal</div>
          </div>
          <div class="meal-options">
            <div class="meal-option opt-a">
              <div class="option-tag">Lựa chọn A</div>
              <div class="option-food">${m.optA.food}</div>
              <div class="option-note">${m.optA.note || ''}</div>
            </div>
            <div class="meal-option opt-b">
              <div class="option-tag">Lựa chọn B</div>
              <div class="option-food">${m.optB.food}</div>
              <div class="option-note">${m.optB.note || ''}</div>
            </div>
            <div class="meal-option opt-c">
              <div class="option-tag">Lựa chọn C</div>
              <div class="option-food">${m.optC.food}</div>
              <div class="option-note">${m.optC.note || ''}</div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function getMealData(cal, goal, style) {
  // Percentage distribution per meal
  const dist = [0.25, 0.10, 0.30, 0.10, 0.25];
  const names = ['🌅 Bữa sáng', '🍎 Bữa phụ sáng', '☀️ Bữa trưa', '☕ Bữa phụ chiều', '🌙 Bữa tối'];
  const times = ['06:30', '09:30', '12:00', '15:30', '18:30'];

  const templates = {
    balanced: {
      lose: [
        {
          optA: { food: 'Herbalife F1 (2 muỗng) + 300ml sữa ít béo + 1 quả chuối', note: '~220 kcal. Giàu protein, no lâu.' },
          optB: { food: '2 lát bánh mì nguyên cám + 2 trứng luộc + rau xà lách', note: '~280 kcal. Protein cao, tinh bột thấp.' },
          optC: { food: 'Yến mạch 50g + sữa không đường 200ml + 1 hộp sữa chua ít béo', note: '~260 kcal. Chất xơ tốt, ổn định đường huyết.' },
        },
        {
          optA: { food: '1 hộp sữa chua ít béo + 10 hạt hạnh nhân', note: '~120 kcal.' },
          optB: { food: '1 quả táo / lê + 1 miếng phô mai ít béo', note: '~100 kcal.' },
          optC: { food: 'Herbalife Protein Bar hoặc 1 muỗng PDM pha nước', note: '~110–130 kcal.' },
        },
        {
          optA: { food: '1 chén cơm gạo lứt + 120g ức gà/cá hấp + rau luộc + canh', note: '~450–500 kcal. Đủ chất, ít mỡ.' },
          optB: { food: 'Bún gạo lứt 200g + thịt bò xào rau củ + súp rau', note: '~430 kcal. Dễ chế biến, ngon miệng.' },
          optC: { food: 'Cơm trắng 1/2 chén + đậu phụ chiên ít dầu + rau cải + canh bí', note: '~380 kcal. Phù hợp ăn chay.' },
        },
        {
          optA: { food: '1 hộp sữa không đường + vài hạt óc chó', note: '~130 kcal.' },
          optB: { food: '1 hũ sữa chua ít đường + 1/2 quả bơ', note: '~150 kcal.' },
          optC: { food: 'Herbalife PDM 1 muỗng + nước lọc', note: '~100 kcal. Bổ sung protein chiều.' },
        },
        {
          optA: { food: 'Herbalife F1 Shake (2 muỗng) + 250ml sữa tách béo', note: '~200 kcal. Thay bữa tối, nhẹ dạ dày.' },
          optB: { food: 'Salad rau trộn + 100g cá hồi áp chảo + 1/2 chén khoai lang', note: '~350 kcal. Vitamin và omega-3.' },
          optC: { food: 'Súp gà rau củ (không cơm) + 2 lát bánh mì nguyên cám nướng', note: '~280 kcal. Nhẹ, dễ tiêu.' },
        },
      ],
      maintain: [
        {
          optA: { food: 'Herbalife F1 (2 muỗng) + 300ml sữa tươi + trái cây 1 phần', note: '~280 kcal.' },
          optB: { food: '2 lát bánh mì nguyên cám + bơ lạc tự nhiên + 1 ly sữa', note: '~350 kcal.' },
          optC: { food: 'Yến mạch + hạt chia + trái cây dầm', note: '~320 kcal. Chất xơ và omega-3.' },
        },
        {
          optA: { food: '1 hộp sữa chua Hy Lạp + granola', note: '~150 kcal.' },
          optB: { food: '1 quả chuối + 1 nắm hạt hỗn hợp', note: '~140 kcal.' },
          optC: { food: 'Bánh gạo lứt + cream cheese ít béo', note: '~130 kcal.' },
        },
        {
          optA: { food: '1.5 chén cơm + 150g protein (gà/cá/thịt) + rau xào + canh', note: '~550 kcal.' },
          optB: { food: 'Phở/Bún bò 1 tô vừa + rau sống + chanh', note: '~500 kcal. Thực phẩm truyền thống.' },
          optC: { food: 'Cơm chiên rau củ nhẹ + trứng + salad', note: '~480 kcal.' },
        },
        {
          optA: { food: 'Trái cây 1 phần + 1 hộp sữa', note: '~150 kcal.' },
          optB: { food: '1 hũ sữa chua + vài hạt điều', note: '~160 kcal.' },
          optC: { food: 'Herbalife Aloe + trái cây', note: '~80 kcal.' },
        },
        {
          optA: { food: '1.5 chén cơm + 120g cá/thịt nạc + rau củ + canh', note: '~500 kcal.' },
          optB: { food: 'Mì gạo + đậu phụ + rau xanh', note: '~430 kcal. Nhẹ nhàng cho buổi tối.' },
          optC: { food: 'Herbalife F1 Shake + 1 bữa nhẹ rau củ', note: '~350 kcal.' },
        },
      ],
      gain: [
        {
          optA: { food: 'F1 Shake (2 muỗng) + 1 scoop PDM + 400ml sữa nguyên chất', note: '~430 kcal. Protein cao, năng lượng.' },
          optB: { food: '3 trứng ốp la + 3 lát bánh mì + 1 ly sinh tố chuối–sữa', note: '~600 kcal.' },
          optC: { food: 'Yến mạch 70g + whey/PDM + sữa + bơ lạc 1 muỗng', note: '~550 kcal.' },
        },
        {
          optA: { food: '1 quả chuối + 1 hộp sữa nguyên chất + vài hạt', note: '~200 kcal.' },
          optB: { food: 'Bánh mì + trứng luộc + sữa', note: '~220 kcal.' },
          optC: { food: 'PDM shake hoặc protein bar', note: '~180–200 kcal.' },
        },
        {
          optA: { food: '2 chén cơm + 200g thịt nạc + rau xào + canh + tráng miệng', note: '~700 kcal.' },
          optB: { food: 'Cơm tấm sườn + trứng + bì + canh', note: '~680 kcal. Cân bằng macro.' },
          optC: { food: 'Pasta + sốt thịt (bolognese) + salad', note: '~650 kcal. Carb và protein tốt.' },
        },
        {
          optA: { food: 'Bánh mì + bơ lạc + chuối + sữa', note: '~250 kcal.' },
          optB: { food: 'Sinh tố chuối–sữa–bơ lạc', note: '~280 kcal.' },
          optC: { food: 'PDM shake + bánh gạo', note: '~200 kcal.' },
        },
        {
          optA: { food: '2 chén cơm + cá hồi nướng + rau củ + canh', note: '~650 kcal.' },
          optB: { food: 'Cơm + gà rang + đậu phụ nhồi thịt + canh bí', note: '~680 kcal.' },
          optC: { food: 'F1 Shake lớn (3 muỗng) + PDM + bánh mì', note: '~600 kcal. Bữa tối nhanh, đủ dinh dưỡng.' },
        },
      ],
    },
    asian: {
      lose: [
        {
          optA: { food: 'Cháo gà 1 tô nhỏ + trứng luộc + rau muống luộc', note: '~250 kcal. Dễ tiêu buổi sáng.' },
          optB: { food: 'Bánh cuốn nhân thịt không mỡ 3 miếng + nước mắm chua ngọt', note: '~230 kcal.' },
          optC: { food: 'Xôi đậu xanh 1 phần nhỏ + giò lụa + dưa leo', note: '~290 kcal.' },
        },
        {
          optA: { food: 'Trái cây theo mùa: cam / bưởi / thanh long', note: '~80–100 kcal.' },
          optB: { food: 'Sữa đậu nành không đường 300ml', note: '~90 kcal.' },
          optC: { food: 'Sữa chua ít đường 1 hộp', note: '~80–100 kcal.' },
        },
        {
          optA: { food: 'Cơm gạo lứt 1 chén + cá kho tộ (ít đường) + canh chua', note: '~460 kcal.' },
          optB: { food: 'Bún bò Huế 1 tô nhỏ (ít bánh bún) + rau sống nhiều', note: '~400 kcal.' },
          optC: { food: 'Phở bò nạm 1 tô vừa + thêm rau giá đậu + không nước béo', note: '~420 kcal.' },
        },
        {
          optA: { food: 'Chè đậu đen ít đường 1 chén nhỏ', note: '~100 kcal.' },
          optB: { food: 'Ổi / cóc miếng', note: '~70 kcal.' },
          optC: { food: 'Trà xanh không đường + 1 nắm đậu phộng rang', note: '~100 kcal.' },
        },
        {
          optA: { food: 'Cháo cá lóc rau ngổ 1 tô + rau luộc', note: '~300 kcal. Nhẹ, ít tinh bột.' },
          optB: { food: 'Canh khổ qua nhồi thịt nạc + 1/2 chén cơm + rau xào', note: '~320 kcal.' },
          optC: { food: 'Gỏi bắp cải tôm (ít dầu mè) + 1 chén cháo trắng nhỏ', note: '~280 kcal.' },
        },
      ],
      maintain: [
        {
          optA: { food: 'Phở gà 1 tô vừa + trứng + giá đỗ', note: '~430 kcal.' },
          optB: { food: 'Bánh mì pate ốp la (1 ổ nhỏ) + sữa đậu nành', note: '~420 kcal.' },
          optC: { food: 'Cơm tấm sườn (nhỏ) + canh + dưa leo', note: '~450 kcal.' },
        },
        {
          optA: { food: 'Bắp luộc hoặc khoai + sữa đậu nành', note: '~150 kcal.' },
          optB: { food: 'Xoài / ổi / chuối', note: '~100–130 kcal.' },
          optC: { food: 'Bánh tráng cuộn thịt + rau (phần nhỏ)', note: '~140 kcal.' },
        },
        {
          optA: { food: 'Cơm + canh chua + cá chiên + rau muống xào', note: '~550 kcal.' },
          optB: { food: 'Bún thịt nướng + rau sống + nước mắm', note: '~500 kcal.' },
          optC: { food: 'Cơm + đậu hũ chiên + cà ri chay + canh', note: '~480 kcal.' },
        },
        {
          optA: { food: 'Chè đậu ít đường hoặc bánh ít nhân đậu', note: '~150 kcal.' },
          optB: { food: 'Trà sữa ít đường (take away nhỏ)', note: '~150–180 kcal.' },
          optC: { food: 'Sữa chua nếp cẩm 1 hộp', note: '~130 kcal.' },
        },
        {
          optA: { food: 'Cơm + canh bí + cá hấp gừng + rau xào tỏi', note: '~500 kcal.' },
          optB: { food: 'Lẩu thái chay nhỏ + bún / rau nhiều rất', note: '~430 kcal. Vui, ít calo.' },
          optC: { food: 'Cháo sườn hoặc cháo tôm + rau + tiêu', note: '~380 kcal.' },
        },
      ],
      gain: [
        {
          optA: { food: 'Cơm tấm đầy đủ (sườn + trứng + bì) + sữa đậu nành', note: '~700 kcal.' },
          optB: { food: 'Bún bò 1 tô lớn + giò heo + trứng bắc thảo', note: '~680 kcal.' },
          optC: { food: 'Bánh mì thịt nguội đầy đủ + sinh tố chuối sữa', note: '~650 kcal.' },
        },
        {
          optA: { food: 'Bánh chuối / bánh khoai 1–2 miếng + sữa', note: '~220 kcal.' },
          optB: { food: 'Xôi gà / xôi xéo 1 gói nhỏ', note: '~300 kcal.' },
          optC: { food: '2 chuối + sữa đậu nành nguyên kem', note: '~200 kcal.' },
        },
        {
          optA: { food: '2 chén cơm + thịt kho trứng + canh + rau luộc + tráng miệng', note: '~750 kcal.' },
          optB: { food: 'Cơm gà hải nam 1 phần lớn + canh hành + nước gừng', note: '~720 kcal.' },
          optC: { food: 'Bún thịt nướng đầy đủ + nem + chả giò', note: '~700 kcal.' },
        },
        {
          optA: { food: 'Chè trôi nước / chè bà ba 1 tô', note: '~250 kcal.' },
          optB: { food: 'Sữa chua nếp cẩm + granola', note: '~220 kcal.' },
          optC: { food: 'Sinh tố bơ + sữa đặc', note: '~280 kcal.' },
        },
        {
          optA: { food: '2 chén cơm + canh chua cá + thịt kho + dưa giá', note: '~680 kcal.' },
          optB: { food: 'Lẩu cá / lẩu cua + bún + rau + trứng nhúng', note: '~650 kcal.' },
          optC: { food: 'Cháo lòng + giò cháo quẩy + hành phi', note: '~600 kcal.' },
        },
      ],
    },
    strict: {
      lose: [
        {
          optA: { food: 'Herbalife F1 (2 muỗng) + 300ml nước hoặc sữa hạnh nhân không đường', note: '~170 kcal. Thay bữa sáng hoàn toàn.' },
          optB: { food: '3 lòng trắng trứng hấp + 1 chén bông cải xanh luộc + 1/4 quả bơ', note: '~180 kcal. Keto-friendly, protein cao.' },
          optC: { food: 'Overnight oat: 40g yến mạch cán mỏng + sữa hạnh nhân + chia seed, không đường', note: '~230 kcal.' },
        },
        {
          optA: { food: '1 hũ sữa chua Hy Lạp 0% béo (100g)', note: '~60 kcal.' },
          optB: { food: 'Dưa chuột / cần tây + hummus 2 muỗng', note: '~80 kcal.' },
          optC: { food: '1 quả táo + trà xanh không đường', note: '~70 kcal.' },
        },
        {
          optA: { food: '150g ức gà nướng + 200g rau củ hấp + 1/2 chén quinoa', note: '~380 kcal. Macro cực sạch.' },
          optB: { food: '200g cá hồi áp chảo + rau xà lách + dầu olive + chanh', note: '~350 kcal. Omega-3 cao.' },
          optC: { food: '150g tôm hấp + 150g cải bó xôi xào tỏi + 50g lúa mì đen', note: '~330 kcal.' },
        },
        {
          optA: { food: '10 hạt hạnh nhân thô + trà xanh', note: '~70 kcal.' },
          optB: { food: 'Herbalife PDM 1 muỗng pha nước lạnh', note: '~100 kcal.' },
          optC: { food: '1 quả trứng luộc', note: '~70 kcal.' },
        },
        {
          optA: { food: 'Herbalife F1 Shake + 200ml sữa không đường + rau xà lách trộn dầu olive', note: '~200 kcal.' },
          optB: { food: '150g cá trắng hấp gừng + 200g rau bina xào tỏi (không tinh bột)', note: '~220 kcal.' },
          optC: { food: '2 lòng trắng trứng + 100g đậu phụ lụa + rau củ nướng', note: '~180 kcal.' },
        },
      ],
      maintain: [
        {
          optA: { food: 'F1 Shake (2 muỗng) + 300ml sữa ít béo + chia seed 1 muỗng', note: '~280 kcal.' },
          optB: { food: '2 trứng ốp la + rau + bánh mì nguyên cám 1 lát', note: '~300 kcal.' },
          optC: { food: 'Overnight oat 50g + whey protein + hoa quả', note: '~310 kcal.' },
        },
        {
          optA: { food: 'Táo + bơ lạc tự nhiên 1 muỗng cafe', note: '~120 kcal.' },
          optB: { food: 'Hũ sữa chua Hy Lạp + blueberry', note: '~110 kcal.' },
          optC: { food: 'Phô mai tươi + cần tây', note: '~110 kcal.' },
        },
        {
          optA: { food: '130g ức gà nướng + 1/2 chén quinoa + rau củ hấp', note: '~460 kcal.' },
          optB: { food: '200g cá hấp + cơm gạo lứt 3/4 chén + salad', note: '~450 kcal.' },
          optC: { food: '150g đậu lăng/đậu đen + rau + trứng + bánh mì đen', note: '~430 kcal.' },
        },
        {
          optA: { food: 'Protein shake (PDM 1 muỗng) + sữa', note: '~150 kcal.' },
          optB: { food: '1 nắm hạt hỗn hợp', note: '~160 kcal.' },
          optC: { food: 'Phô mai que 1 cái + 1 quả táo', note: '~140 kcal.' },
        },
        {
          optA: { food: '130g cá hồi nướng + cải bó xôi + khoai lang nướng 100g', note: '~480 kcal.' },
          optB: { food: '200g tôm nướng + salad rau xanh + rau củ nướng 200g', note: '~420 kcal.' },
          optC: { food: 'F1 Shake + 100g đậu phụ + rau xào', note: '~400 kcal.' },
        },
      ],
      gain: [
        {
          optA: { food: 'F1 (3 muỗng) + 1 scoop PDM + 400ml sữa nguyên chất + 1 quả chuối', note: '~560 kcal.' },
          optB: { food: '4 lòng trắng + 2 trứng nguyên + yến mạch 80g + sữa', note: '~600 kcal.' },
          optC: { food: 'Pancake yến mạch + mật ong + bơ lạc + whey shake', note: '~620 kcal.' },
        },
        {
          optA: { food: 'Chuối + bơ lạc 2 muỗng + sữa', note: '~280 kcal.' },
          optB: { food: 'MASS gainer shake / PDM 2 muỗng + sữa', note: '~300 kcal.' },
          optC: { food: 'Rice cake + cream cheese + quả việt quất', note: '~220 kcal.' },
        },
        {
          optA: { food: '200g ức gà + 1.5 chén quinoa + rau củ hấp + 1/2 quả bơ', note: '~700 kcal.' },
          optB: { food: '250g thịt bò nạc + khoai lang 200g + bông cải xanh', note: '~680 kcal.' },
          optC: { food: '200g cá hồi + cơm gạo lứt 1.5 chén + edamame + salad', note: '~660 kcal.' },
        },
        {
          optA: { food: 'MASS gainer shake + chuối', note: '~350 kcal.' },
          optB: { food: 'Bánh mì nguyên cám + ức gà + avocado', note: '~380 kcal.' },
          optC: { food: 'Sữa chua Hy Lạp + granola + mật ong', note: '~300 kcal.' },
        },
        {
          optA: { food: '200g thịt bò nạc + khoai tây nướng + rau xà lách', note: '~680 kcal.' },
          optB: { food: '200g cá ngừ áp chảo + gạo lứt 1.5 chén + rau củ', note: '~650 kcal.' },
          optC: { food: 'F1 Shake lớn (3 muỗng) + PDM + bánh mì nguyên cám', note: '~620 kcal.' },
        },
      ],
    },
  };

  const mealCount = 5;
  return Array.from({ length: mealCount }, (_, i) => {
    const t = templates[style][goal];
    return {
      time: times[i],
      name: names[i],
      kcal: Math.round(cal * dist[i]),
      optA: t[i].optA,
      optB: t[i].optB,
      optC: t[i].optC,
    };
  });
}

// ══════════════════════════════════════
//  HERBALIFE
// ══════════════════════════════════════
function renderHerbalife() {
  const { goal } = state;
  const subtitles = {
    lose: 'Combo giảm cân – thay thế 2 bữa bằng F1 Shake, tăng protein, hỗ trợ trao đổi chất',
    maintain: 'Combo duy trì – 1 bữa shake, bổ sung vi chất và tiêu hóa hàng ngày',
    gain: 'Combo tăng cơ – bổ sung protein đậm đặc và năng lượng sau tập',
  };
  document.getElementById('herbalife-subtitle').textContent = subtitles[goal];

  const products = {
    lose: [
      { icon:'🥤', name:'Formula 1 (F1)', role:'Thay bữa chính', desc:'Dinh dưỡng cân bằng, ~220 kcal/bữa, protein cao, hỗ trợ no lâu. Là thành phần cốt lõi của chương trình giảm cân.', usage:'2 bữa/ngày – sáng + tối' },
      { icon:'💪', name:'Protein Drink Mix (PDM)', role:'Tăng đạm', desc:'Bổ sung 25g protein chất lượng cao mỗi lần dùng, giúp giữ cơ trong quá trình giảm mỡ, tăng cảm giác no.', usage:'1 lần/ngày sau tập hoặc kết hợp F1' },
      { icon:'🌿', name:'Aloe Concentrate', role:'Tiêu hóa', desc:'Hỗ trợ tiêu hóa, giảm đầy bụng, tăng hấp thu dinh dưỡng từ F1 và thực phẩm hàng ngày.', usage:'30 phút trước bữa ăn (pha loãng)' },
      { icon:'🍵', name:'Instant Herbal Tea', role:'Trao đổi chất', desc:'Tăng nhẹ trao đổi chất, chống oxy hóa, giảm mệt mỏi. Dùng thay thế nước ngọt, cà phê.', usage:'1–2 lần/ngày – sáng và chiều' },
    ],
    maintain: [
      { icon:'🥤', name:'Formula 1 (F1)', role:'Dinh dưỡng cân bằng', desc:'Thay thế 1 bữa hoặc bổ sung. Cung cấp đầy đủ 21 vitamin & khoáng chất, duy trì cân nặng lý tưởng.', usage:'1 bữa/ngày – thường là sáng' },
      { icon:'🌿', name:'Aloe Concentrate', role:'Tiêu hóa', desc:'Duy trì hệ tiêu hóa khỏe mạnh, tăng hấp thu vi chất từ bữa ăn hàng ngày.', usage:'Uống hàng ngày trước bữa ăn' },
      { icon:'🍵', name:'Instant Herbal Tea', role:'Năng lượng', desc:'Duy trì năng lượng ổn định, chứa chất chống oxy hóa, hỗ trợ sức khỏe tim mạch và tuần hoàn.', usage:'Buổi sáng hoặc đầu chiều' },
      { icon:'🌟', name:'Formula 2 Multivitamin', role:'Vi chất bổ sung', desc:'Bổ sung đầy đủ vitamin A, B, C, D, E, K và các khoáng chất quan trọng thường thiếu trong chế độ ăn.', usage:'Uống cùng bữa ăn chính' },
    ],
    gain: [
      { icon:'🥤', name:'Formula 1 (F1)', role:'Năng lượng nền', desc:'Cung cấp carbohydrate và protein chất lượng, hỗ trợ tăng cân lành mạnh, cân bằng vi chất.', usage:'1–2 bữa/ngày (có thể pha 3 muỗng)' },
      { icon:'💪', name:'Protein Drink Mix (PDM)', role:'Tăng cơ', desc:'25g whey & casein protein/lần, bổ sung ngay sau tập để tối đa tổng hợp cơ bắp.', usage:'1–2 lần/ngày (sau tập + trước ngủ)' },
      { icon:'🌿', name:'Aloe Concentrate', role:'Hấp thụ', desc:'Tăng hấp thụ protein và carb vào cơ thể, hỗ trợ phục hồi nhanh sau các buổi tập nặng.', usage:'Trước và sau tập luyện' },
      { icon:'⚡', name:'H3O Pro / CR7 Drive', role:'Phục hồi', desc:'Bổ sung điện giải và carb nhanh trong/sau lúc tập nặng. Duy trì hiệu suất và giảm chuột rút.', usage:'Trong hoặc ngay sau tập' },
    ],
  };

  document.getElementById('products-grid').innerHTML = products[goal].map(p => `
    <div class="product-card">
      <div class="product-icon">${p.icon}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-role">${p.role}</div>
      <div class="product-desc">${p.desc}</div>
      <div class="product-usage">📋 ${p.usage}</div>
    </div>
  `).join('');

  const schedules = {
    lose: [
      { text: '<strong>06:30</strong> – Herbalife Herbal Tea + Aloe (pha loãng, uống ngay khi thức dậy)' },
      { text: '<strong>07:00</strong> – F1 Shake sáng: 2 muỗng F1 + 1 scoop PDM + 300ml sữa ít béo' },
      { text: '<strong>12:00</strong> – Bữa trưa ăn bình thường, ưu tiên protein + rau, ít tinh bột' },
      { text: '<strong>15:00</strong> – Tea chiều (giảm cơn thèm ăn vặt buổi chiều)' },
      { text: '<strong>18:30</strong> – F1 Shake tối: 2 muỗng F1 + 250ml sữa không đường + Aloe' },
      { text: '<strong>Nước uống:</strong> Tối thiểu 2.5 lít nước mỗi ngày, trải đều từ sáng đến tối' },
    ],
    maintain: [
      { text: '<strong>06:30</strong> – Herbal Tea nhẹ khi thức dậy' },
      { text: '<strong>07:00</strong> – F1 Shake sáng: 2 muỗng + 300ml sữa + Aloe kèm theo' },
      { text: '<strong>12:00</strong> – Bữa trưa đầy đủ 3 nhóm chất, ăn vừa đủ' },
      { text: '<strong>14:00</strong> – Tea hoặc Formula 2 Multivitamin với bữa trưa/chiều' },
      { text: '<strong>18:30</strong> – Bữa tối bình thường, hạn chế tinh bột sau 18h' },
    ],
    gain: [
      { text: '<strong>07:00</strong> – F1 Shake lớn: 3 muỗng F1 + 1 scoop PDM + 400ml sữa nguyên chất' },
      { text: '<strong>10:00</strong> – Bữa phụ: bánh mì + gà + quả + sữa 300ml' },
      { text: '<strong>12:00</strong> – Bữa trưa đầy đủ, ăn nhiều hơn bình thường' },
      { text: '<strong>15:00</strong> – PDM shake + trái cây + H3O' },
      { text: '<strong>Sau tập:</strong> 1–2 scoop PDM trong vòng 30 phút + H3O Pro để phục hồi tối đa' },
      { text: '<strong>19:00</strong> – Bữa tối đầy đủ. Tùy chọn: F1 trước ngủ để cung cấp amino acid qua đêm' },
    ],
  };

  document.getElementById('herbalife-schedule').innerHTML = `
    <div class="schedule-title">📅 Lịch dùng sản phẩm hàng ngày</div>
    ${schedules[goal].map(s => `
      <div class="schedule-item">
        <div class="schedule-dot"></div>
        <div class="schedule-text">${s.text}</div>
      </div>
    `).join('')}
  `;
}

// ══════════════════════════════════════
//  HEALTH TIPS
// ══════════════════════════════════════
function renderTips() {
  const { gender, goal, bmi, age, weight } = state;

  const tips = [
    {
      icon: '💧',
      title: 'Uống đủ nước mỗi ngày',
      text: `Mục tiêu: <strong>${(weight * 0.033).toFixed(1)} lít / ngày</strong>. Uống 1–2 ly nước ngay khi thức dậy trước khi uống bất cứ thứ gì. Chia đều trong ngày, không đợi khát mới uống. Nước hỗ trợ trao đổi chất và giảm cảm giác đói.`,
    },
    {
      icon: goal === 'gain' ? '🏋️' : '🏃',
      title: 'Kết hợp tập luyện phù hợp',
      text: goal === 'lose'
        ? 'Tập cardio 30–45 phút ít nhất 4 buổi/tuần (đi bộ nhanh, chạy bộ, đạp xe). Kết hợp 2–3 buổi tập tạ để duy trì cơ bắp khi giảm cân. Không nên cắt calo quá sâu mà thiếu tập luyện.'
        : goal === 'gain'
        ? 'Tập tạ 4–5 buổi/tuần theo nguyên tắc progressive overload (tăng dần trọng lượng). Ưu tiên bài compound: squat, deadlift, bench press, row. Nghỉ đủ 48 giờ giữa các buổi tập cùng nhóm cơ.'
        : 'Duy trì 150 phút hoạt động vừa phải mỗi tuần (WHO). Kết hợp cardio + tập sức mạnh để giữ cơ và mật độ xương. Yoga / pilates 2 buổi/tuần giúp linh hoạt và giảm stress.',
    },
    {
      icon: '😴',
      title: 'Ngủ đủ giấc – nền tảng của sức khỏe',
      text: `WHO khuyến nghị <strong>7–9 giờ ngủ mỗi đêm</strong> với người trưởng thành. Thiếu ngủ tăng cortisol (hormone stress), kích thích thèm đồ ngọt và tinh bột, tích mỡ bụng, và làm giảm khả năng đốt mỡ. Ngủ trước 23h là lý tưởng.`,
    },
    {
      icon: '📊',
      title: 'Theo dõi tiến trình khoa học',
      text: 'Đo cân nặng mỗi sáng sau khi vệ sinh, trước ăn uống. Xem trung bình tuần, không xem từng ngày (cân nặng dao động ±1–2kg là bình thường do nước). Chụp ảnh cơ thể mỗi 2 tuần để thấy thay đổi rõ hơn cân số.',
    },
    {
      icon: '🧠',
      title: 'Quản lý stress và hormone',
      text: 'Stress cao → cortisol tăng → cơ thể tích mỡ bụng và giảm cơ. Thực hành: thiền 10 phút/ngày, đi bộ trong thiên nhiên, giảm màn hình điện thoại trước khi ngủ. Mỡ nội tạng đặc biệt nhạy cảm với stress mãn tính.',
    },
    {
      icon: age >= 40 ? '🩺' : '🥗',
      title: age >= 40 ? 'Kiểm tra sức khỏe định kỳ (quan trọng với tuổi 40+)' : 'Ưu tiên thực phẩm thật, nguyên chất',
      text: age >= 40
        ? `Từ 40 tuổi: xét nghiệm máu 6 tháng/lần (đường huyết, cholesterol, triglyceride, ure, creatinine). Đo huyết áp thường xuyên. Bổ sung canxi, vitamin D, omega-3. Mật độ xương giảm dần sau 40 – tập tạ và ăn đủ canxi rất quan trọng.`
        : `Thực phẩm tự nhiên là nền tảng – Herbalife chỉ bổ trợ. Ưu tiên: protein nạc (gà, cá, trứng, đậu), rau xanh đa dạng màu sắc, ngũ cốc nguyên hạt, chất béo lành mạnh (bơ, cá, hạt). Hạn chế: đường tinh luyện, đồ chiên rán, thực phẩm chế biến sẵn.`,
    },
  ];

  if (bmi >= 27.5) {
    tips.push({
      icon: '⚠️',
      title: 'Lưu ý với BMI ở mức béo phì',
      text: 'Nên tham khảo bác sĩ / chuyên gia dinh dưỡng trước khi bắt đầu chương trình giảm cân nghiêm túc. Tránh giảm calo quá nhanh (dưới 1200 kcal/ngày). Tập thể dục nhẹ nhàng ban đầu (bơi lội, đi bộ) để tránh áp lực lên khớp.',
    });
  }

  document.getElementById('health-tips').innerHTML = `
    <div class="tips-list">
      ${tips.map(t => `
        <div class="tip-item">
          <div class="tip-icon">${t.icon}</div>
          <div class="tip-text">
            <strong>${t.title}</strong>
            ${t.text}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}
