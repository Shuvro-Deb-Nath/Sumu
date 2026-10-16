const scenes = [...document.querySelectorAll(".scene")];
const backButton = document.getElementById("backButton");
const continueButton = document.getElementById("continueButton");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const music = document.getElementById("birthdayMusic");
const musicToggle = document.getElementById("musicToggle");
const musicLabel = document.getElementById("musicLabel");
const musicSource = music.querySelector("source");
const currentScript = document.currentScript;
let musicFailed = false;
let musicStartPromise = null;
if (musicSource && currentScript instanceof HTMLScriptElement && currentScript.src) {
  musicSource.src = new URL("assets/birthday-music.mp3", currentScript.src).href;
  music.load();
}
let currentScene = 0;
let typingTimer = null;
let confettiTimer = null;
let musicOn = false;
let musicUserPaused = false;
let memorySequenceRun = 0;
let memorySequenceComplete = false;
let likesSequenceRun = 0;
let likesSequenceComplete = false;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const scrollBehavior = () => (reducedMotion() ? "auto" : "smooth");
function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

/* ---------- The letter ---------- */
const letterText = `Happy birthday, Sumu!

First of all, congratulations on surviving another year of being you — which, honestly, sounds like a full-time job. 😌 I hope you get excellent food, ridiculous amounts of cake, and at least one day where absolutely nobody asks you to do anything stressful.

Jokes aside, I'm genuinely glad I know you. I hope this next chapter brings you peaceful days, brave new beginnings, unexpected little wins, and people who make life feel lighter. Keep your laugh loud, your standards high, and your heart kind.

And if life gets a bit chaotic, remember: you have made it through every weird plot twist so far. Main-character energy, clearly.

I hope you feel celebrated today — not just because it's your birthday, but because you deserve good things on ordinary days too. Here's to more memories, more laughter, and many more stories still waiting to happen.

Happy birthday, Sumu. Keep being wonderfully you. ♡`;

// Array.from splits by character (not UTF-16 unit) so emoji never render half-typed.
const letterChars = Array.from(letterText);
let letterIndex = 0;
const typedText = document.getElementById("typedText");
const typedGhost = document.getElementById("typedGhost");
// Screen readers get the whole letter at once instead of character-by-character.
document.getElementById("letterSr").textContent = letterText;

// The not-yet-typed text sits in an invisible span so the card keeps its final
// height and the page doesn't jump while typing.
function renderLetter() {
  typedText.textContent = letterChars.slice(0, letterIndex).join("");
  typedGhost.textContent = letterChars.slice(letterIndex).join("");
  typedText.classList.toggle("typing", letterIndex < letterChars.length);
}
renderLetter();

function startTypingLetter() {
  if (typingTimer || letterIndex >= letterChars.length) return;
  if (reducedMotion()) {
    letterIndex = letterChars.length;
    renderLetter();
    return;
  }
  function typeNext() {
    if (currentScene !== 3) { typingTimer = null; return; } // resumes when you come back
    letterIndex++;
    renderLetter();
    if (letterIndex < letterChars.length) {
      typingTimer = setTimeout(typeNext, letterChars[letterIndex - 1] === "\n" ? 180 : 22);
    } else {
      typingTimer = null;
    }
  }
  typeNext();
}

/* ---------- Scene navigation ---------- */
function showScene(index) {
  const currentlyFocused = document.activeElement;
  currentScene = Math.max(0, Math.min(index, scenes.length - 1));
  scenes.forEach((scene, i) => {
    const isActive = i === currentScene;
    scene.classList.toggle("active", isActive);
    scene.setAttribute("aria-hidden", isActive ? "false" : "true");
    if (!isActive && scene.contains(currentlyFocused)) {
      currentlyFocused.blur();
    }
  });
  if (currentScene === 1) {
    startMemorySequence();
  } else {
    memorySequenceRun++;
  }
  if (currentScene === 2) {
    startLikesSequence();
  } else {
    likesSequenceRun++;
  }
  backButton.disabled = currentScene === 0;
  continueButton.disabled = currentScene === scenes.length - 1;
  continueButton.style.opacity = currentScene === scenes.length - 1 ? ".3" : "1";
  progressText.textContent = `${String(currentScene + 1).padStart(2, "0")} / ${String(scenes.length).padStart(2, "0")}`;
  progressFill.style.width = `${((currentScene + 1) / scenes.length) * 100}%`;
  window.scrollTo({ top: 0, behavior: scrollBehavior() });
  if (currentScene === 3) startTypingLetter();
}
backButton.addEventListener("click", () => showScene(currentScene - 1));
continueButton.addEventListener("click", () => showScene(currentScene + 1));
document.querySelectorAll(".next-button").forEach(btn => btn.addEventListener("click", () => showScene(currentScene + 1)));

const envelope = document.getElementById("envelope");
function openInvitation() {
  envelope.classList.add("opened");
  setTimeout(() => showScene(1), 550);
  startMusicAfterGesture();
}
envelope.addEventListener("click", openInvitation);
envelope.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openInvitation(); } });
document.getElementById("openButton").addEventListener("click", openInvitation);

/* ---------- Chapter 2: favorite things ---------- */
const likeCards = [...document.querySelectorAll(".like-card")];
const likesPreview = document.getElementById("likesPreview");
const likesPreviewIcon = document.getElementById("likesPreviewIcon");
const likesPreviewLabel = document.getElementById("likesPreviewLabel");
const likesPreviewTitle = document.getElementById("likesPreviewTitle");
const likesPreviewCopy = document.getElementById("likesPreviewCopy");
const likeCardDetails = likeCards.map(card => ({
  icon: card.querySelector(".like-icon").textContent,
  label: card.querySelector(".like-label").textContent,
  title: card.querySelector("h3").textContent,
  copy: card.querySelector("p:not(.like-label)").textContent
}));

async function startLikesSequence() {
  if (likesSequenceComplete) return;
  const runId = ++likesSequenceRun;
  const firstUnrevealed = likeCards.findIndex(card => !card.classList.contains("revealed"));
  if (firstUnrevealed === -1) {
    likesSequenceComplete = true;
    likesPreview.classList.remove("show");
    return;
  }

  for (let index = firstUnrevealed; index < likeCards.length; index++) {
    if (runId !== likesSequenceRun || currentScene !== 2) return;
    const detail = likeCardDetails[index];
    likesPreviewIcon.textContent = detail.icon;
    likesPreviewLabel.textContent = detail.label;
    likesPreviewTitle.textContent = detail.title;
    likesPreviewCopy.textContent = detail.copy;
    likesPreview.classList.add("show");
    await wait(1350);
    if (runId !== likesSequenceRun || currentScene !== 2) return;
    likeCards[index].classList.add("revealed");
    likeCards[index].setAttribute("aria-hidden", "false");
    await wait(850);
    if (runId !== likesSequenceRun || currentScene !== 2) return;
    likesPreview.classList.remove("show");
    await wait(300);
  }

  likesSequenceComplete = true;
}

/* ---------- Chapter 1: photo clothesline ---------- */
const memorySequence = document.getElementById("memorySequence");
const sequenceYear = document.getElementById("sequenceYear");
const hangingPhotos = [...document.querySelectorAll(".hanging-photo")];

// Single source of truth: photo data is read from the HTML, so captions are edited in one place.
const capitalize = text => text.charAt(0).toUpperCase() + text.slice(1);
const photoData = hangingPhotos.map(button => {
  const year = button.querySelector(".memory-year").textContent.trim();
  const caption = button.querySelector(".photo-caption").textContent.trim();
  return {
    src: button.querySelector("img").getAttribute("src"),
    year,
    caption: `${capitalize(caption)} · ${year}`
  };
});

async function startMemorySequence() {
  if (memorySequenceComplete) return;
  const runId = ++memorySequenceRun;
  for (let index = hangingPhotos.filter(button => button.classList.contains("hung")).length; index < photoData.length; index++) {
    if (runId !== memorySequenceRun || currentScene !== 1) return;
    const photo = photoData[index];
    sequenceYear.textContent = photo.year;
    memorySequence.classList.add("show");
    await wait(700);
    if (runId !== memorySequenceRun || currentScene !== 1) return;
    const hangingPhoto = hangingPhotos[index];
    hangingPhoto.disabled = false;
    hangingPhoto.setAttribute("aria-hidden", "false");
    hangingPhoto.classList.add("hung");
    await wait(1050);
    if (runId !== memorySequenceRun || currentScene !== 1) return;
  }

  memorySequence.classList.remove("show");
  memorySequenceComplete = true;
}

/* ---------- Photo modal (with focus management) ---------- */
const modal = document.getElementById("photoModal");
const modalClose = document.getElementById("modalClose");
let lastFocusedBeforeModal = null;

function openModal(button) {
  const photo = photoData[Number(button.dataset.photo)];
  const modalPhoto = document.getElementById("modalPhoto");
  modalPhoto.src = photo.src;
  modalPhoto.alt = `Sumu, ${photo.caption}`;
  document.getElementById("modalCaption").textContent = photo.caption;
  lastFocusedBeforeModal = button;
  modal.classList.add("show");
  modalClose.focus();
}
function closeModal() {
  if (!modal.classList.contains("show")) return;
  modal.classList.remove("show");
  if (lastFocusedBeforeModal) lastFocusedBeforeModal.focus();
  lastFocusedBeforeModal = null;
}
hangingPhotos.forEach(button => button.addEventListener("click", () => openModal(button)));
modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
  // The close button is the only focusable control in the dialog, so keep focus on it.
  if (e.key === "Tab" && modal.classList.contains("show")) { e.preventDefault(); modalClose.focus(); }
});

/* ---------- Secret star ---------- */
document.getElementById("secretStar").addEventListener("click", () => {
  document.getElementById("secretMessage").classList.add("show");
  document.getElementById("secretStar").textContent = "★";
});

/* ---------- Music ---------- */
function setMusicUI(on) {
  musicOn = on;
  musicLabel.textContent = on ? "Music on" : "Music off";
  musicToggle.setAttribute("aria-pressed", String(on));
}

async function startMusicAfterGesture() {
  if (musicOn) return true;
  if (musicUserPaused) return false; // never override a visitor who switched it off
  if (musicStartPromise) return musicStartPromise;
  if (musicFailed || music.error) {
    musicFailed = false;
    music.load();
  }
  musicStartPromise = (async () => {
    try {
      music.volume = 0.32;
      music.muted = false;
      await music.play();
      setMusicUI(true);
      musicToggle.title = "Turn background music off";
      return true;
    } catch (_) {
      // Browsers can block audible playback until a visitor interacts.
      musicLabel.textContent = "Tap for music";
      musicToggle.title = "Tap to start the soft birthday music";
      return false;
    } finally {
      musicStartPromise = null;
    }
  })();
  return musicStartPromise;
}

function reportMusicError() {
  musicFailed = true;
  setMusicUI(false);
  musicLabel.textContent = "Music unavailable";
  musicToggle.title = "Music could not load. Tap to retry.";
}
music.addEventListener("playing", () => {
  if (musicUserPaused) return;
  if (music.muted) {
    musicLabel.textContent = "Tap anywhere for music";
    musicToggle.title = "Tap anywhere to enable background music";
    return;
  }
  setMusicUI(true);
  musicToggle.title = "Turn background music off";
});
music.addEventListener("error", reportMusicError);
if (musicSource) musicSource.addEventListener("error", reportMusicError);

startMusicAfterGesture();

// Retry after the first user gesture if the browser blocked audible autoplay.
// Presses on the music button itself are ignored here, otherwise that first press
// would start the music and its own click handler would immediately switch it off.
const gestureEvents = ["pointerdown", "keydown", "touchstart"];
function onFirstGesture(e) {
  if (e.target instanceof Element && e.target.closest("#musicToggle")) return;
  startMusicAfterGesture().then(started => {
    if (started || musicUserPaused) {
      gestureEvents.forEach(name => document.removeEventListener(name, onFirstGesture));
    }
  });
}
gestureEvents.forEach(name => document.addEventListener(name, onFirstGesture, { passive: true }));

musicToggle.addEventListener("click", async () => {
  if (musicOn) {
    music.pause();
    musicUserPaused = true;
    setMusicUI(false);
    musicToggle.title = "Turn background music on";
  } else {
    musicUserPaused = false;
    await startMusicAfterGesture();
  }
});

/* ---------- Finale ---------- */
const cake = document.querySelector(".cake");
const blowButton = document.getElementById("blowButton");
const micStatus = document.getElementById("micStatus");
const confettiLayer = document.getElementById("confettiLayer");
const birthdayReveal = document.getElementById("birthdayReveal");
let candlesBlown = false;

blowButton.addEventListener("click", blowCandles);

function clearConfetti() {
  clearTimeout(confettiTimer);
  confettiLayer.innerHTML = "";
}
function launchConfetti() {
  clearConfetti();
  if (reducedMotion()) return;
  const colors = ["#e8c98c", "#fff0c9", "#c98d8d", "#f5e7d0", "#a98bce"];
  for (let i = 0; i < 100; i++) {
    const piece = document.createElement("i");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.setProperty("--confetti-color", colors[i % colors.length]);
    piece.style.setProperty("--fall-time", `${2.5 + Math.random() * 3.5}s`);
    piece.style.setProperty("--drift", `${Math.random() * 180 - 90}px`);
    piece.style.animationDelay = `${Math.random() * .8}s`;
    confettiLayer.appendChild(piece);
  }
  confettiTimer = setTimeout(clearConfetti, 7000);
}
function blowCandles() {
  if (candlesBlown) return;
  candlesBlown = true;
  cake.classList.add("blown");
  blowButton.disabled = true;
  micStatus.textContent = "Wish sent into the universe ✨";
  setTimeout(() => {
    birthdayReveal.classList.add("show");
    launchConfetti();
    birthdayReveal.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
  }, 650);
}
document.getElementById("replayButton").addEventListener("click", () => {
  candlesBlown = false;
  cake.classList.remove("blown");
  birthdayReveal.classList.remove("show");
  blowButton.disabled = false;
  micStatus.textContent = "Make a wish, then tap to blow out the candles. ✨";
  document.getElementById("secretMessage").classList.remove("show");
  document.getElementById("secretStar").textContent = "✦";
  clearConfetti();
  clearTimeout(typingTimer);
  typingTimer = null;
  letterIndex = 0;
  renderLetter();
  envelope.classList.remove("opened");
  showScene(0);
});