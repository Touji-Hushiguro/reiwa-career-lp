const state = {
  currentStep: 1,
  answers: {
    mood: "",
    timing: "",
    jobTypes: [],
    zip: "",
    birthYear: "",
    name: "",
    kana: "",
    residency: "",
    phone: "",
    consent: false,
    bookingMethod: "",
    bookingDate: "",
    bookingDateIso: "",
    bookingTime: "",
    bookingEmail: ""
  }
};

const steps = {
  1: {
    title: "お気持ちはどちらに近いですか？",
    key: "mood",
    choices: ["転職活動をしたい", "今は情報収集したい"]
  },
  2: {
    title: "いつ頃の転職をご希望ですか？",
    key: "timing",
    choices: ["1か月以内", "3か月以内", "6か月以内", "よい求人があれば"]
  },
  3: {
    title: "ご希望の職種を教えてください",
    key: "jobTypes",
    multiple: true,
    choices: ["営業", "事務・アシスタント", "販売・サービス", "IT・エンジニア", "製造・軽作業", "クリエイティブ", "専門職", "その他"]
  }
};

const residencyOptions = [
  "選択してください",
  "日本国籍",
  "永住者",
  "定住者",
  "日本人の配偶者等",
  "永住者の配偶者等",
  "特定技能",
  "技能実習",
  "高度専門職",
  "技術・人文国際・国際業務",
  "その他、在留資格"
];

const lpContent = document.getElementById("lpContent");
const surveyOverlay = document.getElementById("surveyOverlay");
const surveyForm = document.getElementById("surveyForm");
const stepContainer = document.getElementById("stepContainer");
const progressText = document.getElementById("progressText");
const landingPage = document.getElementById("landingPage");
const thanksPage = document.getElementById("thanksPage");
const thanksName = document.getElementById("thanksName");
const methodGrid = document.getElementById("methodGrid");
const dateGrid = document.getElementById("dateGrid");
const timeGrid = document.getElementById("timeGrid");
const bookingPanel = document.getElementById("bookingPanel");
const bookingComplete = document.getElementById("bookingComplete");
const bookingEmail = document.getElementById("bookingEmail");
const bookingSubmit = document.getElementById("bookingSubmit");
const completeDate = document.getElementById("completeDate");
const completeMethod = document.getElementById("completeMethod");
const moreDatesButton = document.getElementById("moreDatesButton");
const moreTimesButton = document.getElementById("moreTimesButton");
const googleCalendarButton = document.getElementById("googleCalendarButton");
const icsCalendarButton = document.getElementById("icsCalendarButton");
const lineChatButton = document.getElementById("lineChatButton");
const primaryBookingTimes = ["14:00〜", "19:00〜"];
const extraBookingTimes = ["10:00〜", "11:00〜", "16:00〜", "18:00〜"];
const SPREADSHEET_ENDPOINT = "https://script.google.com/macros/s/AKfycbwvb-2dIF4ZT9QVk41nRaMgwIIbSEdwUnkErtyvbSDLgtHUTGvhoqxPlU0ZyHr1Xf0xRw/exec";
const LINE_CHAT_URL = "https://liff.line.me/2008784499-92DR4hmy/landing?follow=%40872lluqj&lp=7hDJTd&liff_id=2008784499-92DR4hmy";
let allBookingDates = [];
let datesExpanded = false;
let timesExpanded = false;

function renderStep() {
  progressText.textContent = `STEP ${state.currentStep} / 6`;

  if (state.currentStep <= 3) {
    renderChoiceStep();
    return;
  }

  if (state.currentStep === 4) {
    renderZipStep();
    return;
  }

  if (state.currentStep === 5) {
    renderProfileStep();
    return;
  }

  renderPhoneStep();
}

function renderChoiceStep() {
  const step = steps[state.currentStep];
  const buttons = step.choices
    .map((choice) => {
      const isSelected = step.multiple
        ? state.answers[step.key].includes(choice)
        : state.answers[step.key] === choice;
      const selectedClass = isSelected ? " is-selected" : "";
      return `<button class="choice-button${selectedClass}" type="button" data-choice="${choice}">${choice}</button>`;
    })
    .join("");

  const multipleNote = step.multiple ? '<p class="note center-note">複数選択可</p>' : "";
  const nextButton = step.multiple ? '<button class="primary-button" type="button" id="multiNext" disabled>次へ</button>' : "";
  const back = state.currentStep > 1 ? '<button class="back-link" type="button" data-back>戻る</button>' : "";
  stepContainer.innerHTML = `<h1 class="step-title">${step.title}</h1>${multipleNote}${buttons}${nextButton}${back}`;

  stepContainer.querySelectorAll("[data-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      if (step.multiple) {
        toggleMultiChoice(step.key, button.dataset.choice);
        button.classList.toggle("is-selected");
        updateMultiNextButton(step.key);
      } else {
        state.answers[step.key] = button.dataset.choice;
        button.classList.add("is-selected");
        window.setTimeout(() => goToStep(state.currentStep + 1), 180);
      }
    });
  });

  if (step.multiple) {
    const multiNext = document.getElementById("multiNext");
    multiNext.addEventListener("click", () => goToStep(state.currentStep + 1));
    updateMultiNextButton(step.key);
  }

  bindBackLink();
}

function toggleMultiChoice(key, choice) {
  if (state.answers[key].includes(choice)) {
    state.answers[key] = state.answers[key].filter((item) => item !== choice);
  } else {
    state.answers[key] = [...state.answers[key], choice];
  }
}

function updateMultiNextButton(key) {
  const multiNext = document.getElementById("multiNext");
  if (multiNext) {
    multiNext.disabled = state.answers[key].length === 0;
  }
}

function renderZipStep() {
  stepContainer.innerHTML = `
    <h1 class="step-title">お住まいの郵便番号</h1>
    <div class="field">
      <label for="zip">お住まいの郵便番号</label>
      <input id="zip" name="zip" inputmode="numeric" autocomplete="postal-code" maxlength="7" placeholder="例: 1234567" value="${escapeHtml(state.answers.zip)}">
    </div>
    <p class="note">※ 郵便番号を入れていただくことで、お住まいの地域に合わせた求人をご紹介しやすくなります</p>
    <p class="error-text" id="zipError"></p>
    <button class="primary-button" type="button" id="zipNext" disabled>残り2ステップ</button>
    <button class="back-link" type="button" data-back>戻る</button>
  `;

  const zipInput = document.getElementById("zip");
  const nextButton = document.getElementById("zipNext");
  const error = document.getElementById("zipError");

  const validate = () => {
    state.answers.zip = onlyDigits(zipInput.value).slice(0, 7);
    zipInput.value = state.answers.zip;
    const valid = /^\d{7}$/.test(state.answers.zip);
    nextButton.disabled = !valid;
    error.textContent = state.answers.zip && !valid ? "7桁の数字で入力してください" : "";
  };

  zipInput.addEventListener("input", validate);
  nextButton.addEventListener("click", () => goToStep(5));
  bindBackLink();
  validate();
  zipInput.focus();
}

function renderProfileStep() {
  stepContainer.innerHTML = `
    <h1 class="step-title">プロフィールを教えてください</h1>
    <div class="field">
      <label for="birthYear">生まれ年</label>
      <input id="birthYear" name="birthYear" inputmode="numeric" maxlength="4" placeholder="例: 1998" value="${escapeHtml(state.answers.birthYear)}">
    </div>
    <div class="field">
      <label for="name">お名前</label>
      <input id="name" name="name" autocomplete="name" placeholder="例: 山田太郎" value="${escapeHtml(state.answers.name)}">
    </div>
    <div class="field">
      <label for="kana">フリガナ（カタカナ）</label>
      <input id="kana" name="kana" placeholder="例: ヤマダタロウ" value="${escapeHtml(state.answers.kana)}">
    </div>
    <div class="field">
      <label for="residency">在留資格など、該当するものをお選びください</label>
      <select id="residency" name="residency">
        ${residencyOptions.map((option, index) => `<option value="${index === 0 ? "" : option}" ${state.answers.residency === option ? "selected" : ""}>${option}</option>`).join("")}
      </select>
    </div>
    <p class="error-text" id="profileError"></p>
    <button class="primary-button" type="button" id="profileNext" disabled>残り1ステップ</button>
    <button class="back-link" type="button" data-back>戻る</button>
  `;

  const inputs = {
    birthYear: document.getElementById("birthYear"),
    name: document.getElementById("name"),
    kana: document.getElementById("kana"),
    residency: document.getElementById("residency")
  };
  const nextButton = document.getElementById("profileNext");
  const error = document.getElementById("profileError");

  const validate = () => {
    state.answers.birthYear = onlyDigits(inputs.birthYear.value).slice(0, 4);
    inputs.birthYear.value = state.answers.birthYear;
    state.answers.name = inputs.name.value.trim();
    state.answers.kana = toKatakana(inputs.kana.value.trim());
    inputs.kana.value = state.answers.kana;
    state.answers.residency = inputs.residency.value;

    const year = Number(state.answers.birthYear);
    const valid = year >= 1950 && year <= 2010 && state.answers.name && state.answers.kana && state.answers.residency;
    nextButton.disabled = !valid;
    error.textContent = state.answers.birthYear && (year < 1950 || year > 2010) ? "生まれ年は1950〜2010の数字で入力してください" : "";
  };

  Object.values(inputs).forEach((input) => input.addEventListener("input", validate));
  inputs.residency.addEventListener("change", validate);
  nextButton.addEventListener("click", () => goToStep(6));
  bindBackLink();
  validate();
  inputs.birthYear.focus();
}

function renderPhoneStep() {
  stepContainer.innerHTML = `
    <h1 class="step-title">電話番号</h1>
    <div class="field">
      <label for="phone">電話番号</label>
      <input id="phone" name="phone" inputmode="tel" autocomplete="tel" maxlength="11" placeholder="例: 09012345678" value="${escapeHtml(state.answers.phone)}">
    </div>
    <p class="error-text" id="phoneError">正しい電話番号を入力してください</p>
    <label class="consent">
      <input id="consent" type="checkbox" ${state.answers.consent ? "checked" : ""}>
      <span>利用規約 / プライバシーポリシーを読んで、サービス利用に同意する</span>
    </label>
    <button class="primary-button" type="submit" id="submitButton" disabled>無料で求人を見てみる</button>
    <button class="back-link" type="button" data-back>戻る</button>
  `;

  const phoneInput = document.getElementById("phone");
  const consentInput = document.getElementById("consent");
  const submitButton = document.getElementById("submitButton");
  const error = document.getElementById("phoneError");

  const validate = () => {
    state.answers.phone = onlyDigits(phoneInput.value).slice(0, 11);
    phoneInput.value = state.answers.phone;
    state.answers.consent = consentInput.checked;
    const validPhone = /^\d{10,11}$/.test(state.answers.phone);
    submitButton.disabled = !(validPhone && state.answers.consent);
    error.style.visibility = state.answers.phone && !validPhone ? "visible" : "hidden";
  };

  phoneInput.addEventListener("input", validate);
  consentInput.addEventListener("change", validate);
  bindBackLink();
  validate();
  phoneInput.focus();
}

function bindBackLink() {
  const back = stepContainer.querySelector("[data-back]");
  if (back) {
    back.addEventListener("click", () => goToStep(state.currentStep - 1));
  }
}

function goToStep(step) {
  state.currentStep = Math.max(1, Math.min(6, step));
  renderStep();
}

function onlyDigits(value) {
  return value.replace(/\D/g, "");
}

function toKatakana(value) {
  return value.replace(/[\u3041-\u3096]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) + 0x60)
  );
}

function getMergedFullName() {
  if (state.answers.name && state.answers.kana) {
    return `${state.answers.name}（${state.answers.kana}）`;
  }
  return state.answers.name || state.answers.kana;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getUrlParam(name) {
  return new URLSearchParams(window.location.search).get(name) || "";
}

function getInterviewLabel() {
  if (!state.answers.bookingDate || !state.answers.bookingTime) {
    return "";
  }
  return `${state.answers.bookingDate} ${state.answers.bookingTime}`;
}

function getInterviewStartEnd() {
  if (!state.answers.bookingDateIso || !state.answers.bookingTime) {
    return { start: "", end: "" };
  }
  const start = getBookingStartDate();
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

function buildSubmissionPayload(stage) {
  const isFinal = stage === "booking_completed";
  const interview = getInterviewStartEnd();
  const conditionValues = [
    state.answers.mood,
    isFinal && state.answers.bookingMethod ? `面談方法: ${state.answers.bookingMethod}` : ""
  ].filter(Boolean);

  return {
    action: isFinal ? "finalSubmit" : "firstSubmit",
    workStart: state.answers.timing,
    jobType: state.answers.jobTypes,
    condition: conditionValues,
    education: state.answers.zip,
    employmentStatus: state.answers.residency,
    fullName: getMergedFullName(),
    birthDate: state.answers.birthYear,
    gender: "",
    phone: state.answers.phone,
    email: isFinal ? state.answers.bookingEmail : "",
    prefecture: "",
    postalCode: state.answers.zip,
    residenceStatus: state.answers.residency,
    interviewMethod: state.answers.bookingMethod,
    interviewDateTime1: isFinal ? getInterviewLabel() : "",
    interviewDateTime2: "",
    interviewDateTime3: "",
    interviewStart: isFinal ? interview.start : "",
    interviewEnd: isFinal ? interview.end : "",
    utmSource: getUrlParam("utm_source") || getUrlParam("source") || getUrlParam("channel"),
    utmContent: getUrlParam("utm_content") || getUrlParam("content") || getUrlParam("creative") || getUrlParam("cp"),
    pageUrl: location.href,
    lpStage: stage,
    consent: state.answers.consent ? "同意" : ""
  };
}

async function submitToSpreadsheet(stage) {
  if (!SPREADSHEET_ENDPOINT) {
    return true;
  }

  const payload = buildSubmissionPayload(stage);
  const body = new URLSearchParams({
    data: JSON.stringify(payload)
  });

  await fetch(SPREADSHEET_ENDPOINT, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  return true;
}

function finishSurvey() {
  surveyOverlay.style.display = "none";
  lpContent.classList.remove("is-blurred");
  document.body.classList.remove("modal-open");
  landingPage.hidden = true;
  thanksPage.hidden = false;
  thanksName.textContent = state.answers.name || "あなた";
  thanksPage.classList.add("booking-focus");
  renderBookingOptions();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderBookingOptions() {
  allBookingDates = getBookingDates();
  datesExpanded = false;
  timesExpanded = false;
  renderDateOptions();
  renderTimeOptions();

  methodGrid.querySelectorAll("[data-method]").forEach((button) => {
    button.addEventListener("click", () => {
      state.answers.bookingMethod = button.dataset.method;
      methodGrid.querySelectorAll(".booking-option").forEach((item) => item.classList.remove("is-selected"));
      button.classList.add("is-selected");
      showBookingCard("date");
    });
  });

  moreDatesButton.addEventListener("click", () => {
    datesExpanded = !datesExpanded;
    renderDateOptions();
  });

  moreTimesButton.addEventListener("click", () => {
    timesExpanded = !timesExpanded;
    renderTimeOptions();
  });

  bookingEmail.addEventListener("input", () => {
    state.answers.bookingEmail = bookingEmail.value.trim();
    updateBookingState();
  });
  bookingSubmit.addEventListener("click", confirmBooking);
  googleCalendarButton.addEventListener("click", openGoogleCalendar);
  icsCalendarButton.addEventListener("click", downloadIcsCalendar);
  updateBookingState();
}

function renderDateOptions() {
  const visibleDates = datesExpanded ? allBookingDates : allBookingDates.slice(0, 2);
  dateGrid.innerHTML = visibleDates
    .map((date) => {
      const selectedClass = state.answers.bookingDate === date.value ? " is-selected" : "";
      return `<button class="date-option${selectedClass}" type="button" data-date="${date.value}" data-date-iso="${date.iso}">${date.label}<small>${date.weekday}</small></button>`;
    })
    .join("");

  moreDatesButton.innerHTML = datesExpanded ? '日付を閉じる <span>▲</span>' : 'その他の日付 <span>▼</span>';

  dateGrid.querySelectorAll("[data-date]").forEach((button) => {
    button.addEventListener("click", () => {
      state.answers.bookingDate = button.dataset.date;
      state.answers.bookingDateIso = button.dataset.dateIso;
      dateGrid.querySelectorAll(".date-option").forEach((item) => item.classList.remove("is-selected"));
      button.classList.add("is-selected");
      showBookingCard("time");
      updateBookingState();
    });
  });
}

function renderTimeOptions() {
  const visibleTimes = timesExpanded ? [...primaryBookingTimes, ...extraBookingTimes] : primaryBookingTimes;
  timeGrid.innerHTML = visibleTimes
    .map((time) => {
      const selectedClass = state.answers.bookingTime === time ? " is-selected" : "";
      return `<button class="time-option${selectedClass}" type="button" data-time="${time}">${time}</button>`;
    })
    .join("");

  moreTimesButton.innerHTML = timesExpanded ? '時間を閉じる <span>▲</span>' : 'その他の時間 <span>▼</span>';

  timeGrid.querySelectorAll("[data-time]").forEach((button) => {
    button.addEventListener("click", () => {
      state.answers.bookingTime = button.dataset.time;
      timeGrid.querySelectorAll(".time-option").forEach((item) => item.classList.remove("is-selected"));
      button.classList.add("is-selected");
      showBookingCard("email");
      updateBookingState();
    });
  });
}

function getBookingDates() {
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const dates = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() + 1);

  while (dates.length < 6) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      dates.push({
        value: `${cursor.getMonth() + 1}/${cursor.getDate()}(${weekdays[day]})`,
        iso: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`,
        label: dates.length === 0 ? `明日` : `${cursor.getMonth() + 1}/${cursor.getDate()}`,
        weekday: dates.length === 0 ? `(${String(cursor.getMonth() + 1).padStart(2, "0")}/${String(cursor.getDate()).padStart(2, "0")})` : `(${weekdays[day]})`
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function showBookingCard(cardName) {
  const card = document.querySelector(`[data-booking-card="${cardName}"]`);
  if (card) {
    card.classList.add("is-visible");
  }
}

function updateBookingState() {
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.answers.bookingEmail);
  bookingSubmit.disabled = !(state.answers.bookingMethod && state.answers.bookingDate && state.answers.bookingTime && validEmail);
}

async function confirmBooking() {
  if (bookingSubmit.disabled) {
    return;
  }
  bookingSubmit.disabled = true;
  bookingSubmit.textContent = "送信中...";

  try {
    await submitToSpreadsheet("booking_completed");
  } catch (error) {
    bookingSubmit.disabled = false;
    bookingSubmit.textContent = "予約をする";
    alert("送信に失敗しました。時間をおいてもう一度お試しください。");
    return;
  }

  bookingPanel.hidden = true;
  bookingComplete.hidden = false;
  completeDate.textContent = `${state.answers.bookingDateIso} ${state.answers.bookingTime.replace("〜", "")}`;
  completeMethod.textContent = state.answers.bookingMethod;
  thanksPage.classList.remove("booking-focus");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getBookingStartDate() {
  const [year, month, day] = state.answers.bookingDateIso.split("-").map(Number);
  const [hour, minute] = state.answers.bookingTime.replace("〜", "").split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute || 0, 0);
}

function formatCalendarDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    "T",
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    "00"
  ].join("");
}

function getCalendarEvent() {
  const start = getBookingStartDate();
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const method = state.answers.bookingMethod || "未選択";
  const label = `${state.answers.bookingDate || ""} ${state.answers.bookingTime || ""}`.trim();
  return {
    title: "れいわキャリア 無料面談",
    details: [
      `面談方法: ${method}`,
      label ? `予約日時: ${label}` : "",
      "担当アドバイザーとの無料面談です。",
      "当日は登録いただいた電話番号、またはオンライン面談にてご案内します。"
    ].filter(Boolean).join("\n"),
    location: method === "オンライン" ? "オンライン" : "電話",
    start,
    end
  };
}

function openGoogleCalendar() {
  const event = getCalendarEvent();
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatCalendarDate(event.start)}/${formatCalendarDate(event.end)}`,
    details: event.details,
    location: event.location,
    ctz: "Asia/Tokyo"
  });
  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, "_blank", "noopener");
}

function formatIcsDate(date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
    "T",
    String(date.getUTCHours()).padStart(2, "0"),
    String(date.getUTCMinutes()).padStart(2, "0"),
    "00Z"
  ].join("");
}

function escapeIcsText(value) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function downloadIcsCalendar() {
  const event = getCalendarEvent();
  const now = new Date();
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Reiwa Career//Landing Page//JA",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@reiwa-career.local`,
    `DTSTAMP:${formatIcsDate(now)}`,
    `DTSTART;TZID=Asia/Tokyo:${formatCalendarDate(event.start)}`,
    `DTEND;TZID=Asia/Tokyo:${formatCalendarDate(event.end)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(event.details)}`,
    `LOCATION:${escapeIcsText(event.location)}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "reiwa-career-interview.ics";
  document.body.appendChild(link);
  link.click();
  URL.revokeObjectURL(link.href);
  link.remove();
}

if (lineChatButton) {
  lineChatButton.addEventListener("click", () => {
    window.open(LINE_CHAT_URL, "_blank", "noopener");
  });
}

surveyForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const validPhone = /^\d{10,11}$/.test(state.answers.phone);
  if (validPhone && state.answers.consent) {
    const submitButton = document.getElementById("submitButton");
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "送信中...";
    }

    try {
      await submitToSpreadsheet("lead_submitted");
      finishSurvey();
    } catch (error) {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "無料で求人を見てみる";
      }
      alert("送信に失敗しました。時間をおいてもう一度お試しください。");
    }
  }
});

history.replaceState({ page: "lp" }, "", location.href);
history.pushState({ page: "survey" }, "", location.href);

lpContent.classList.add("is-blurred");
document.body.classList.add("modal-open");
renderStep();
