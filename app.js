const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const header = document.querySelector("[data-header]");
const menu = document.querySelector("[data-menu]");
const menuToggle = document.querySelector("[data-menu-toggle]");

const setMenu = (open) => {
  menu?.classList.toggle("is-open", open);
  menuToggle?.setAttribute("aria-expanded", String(open));
  menuToggle?.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  document.body.classList.toggle("menu-open", open);
};

menuToggle?.addEventListener("click", () => setMenu(menuToggle.getAttribute("aria-expanded") !== "true"));
menu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const reveals = document.querySelectorAll(".reveal");

if (reduceMotion || !("IntersectionObserver" in window)) {
  reveals.forEach((element) => element.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver(
    (entries, revealObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -35px" },
  );
  reveals.forEach((element) => observer.observe(element));
}

const esc = (value) => (typeof CC === "undefined" ? String(value ?? "") : CC.escape(value));

// Carrossel do topo: usa os eventos cadastrados no admin (data.js).
const eventData = typeof CC === "undefined" ? [] : CC.load("events");
const eventSlidesRoot = document.querySelector(".event-slides");
if (eventSlidesRoot && eventData.length) {
  eventSlidesRoot.innerHTML = eventData
    .map((event, index) => `<figure class="event-slide${index === 0 ? " is-active" : ""}" data-event-slide><img src="${esc(event.image)}" alt="${esc(event.title)}" /></figure>`)
    .join("");
  const total = document.querySelector(".event-count span");
  if (total) total.textContent = `/ ${String(eventData.length).padStart(2, "0")}`;
}

const carousel = document.querySelector("[data-event-carousel]");
const eventSlides = [...document.querySelectorAll("[data-event-slide]")];
const eventCurrent = document.querySelector("[data-event-current]");
const eventProgress = document.querySelector("[data-event-progress]");
const eventTitle = document.querySelector("[data-event-title]");
const eventDescription = document.querySelector("[data-event-description]");
const eventDetails = eventData;
let eventIndex = 0;
let eventTimer;

const animateEventProgress = () => {
  if (!eventProgress || reduceMotion) return;
  eventProgress.classList.remove("is-running");
  void eventProgress.offsetWidth;
  eventProgress.classList.add("is-running");
};

const showEvent = (nextIndex, restart = true) => {
  if (!eventSlides.length) return;
  eventIndex = (nextIndex + eventSlides.length) % eventSlides.length;
  eventSlides.forEach((slide, index) => slide.classList.toggle("is-active", index === eventIndex));
  if (eventCurrent) eventCurrent.textContent = String(eventIndex + 1).padStart(2, "0");
  const detail = eventDetails[eventIndex];
  if (detail && eventTitle) {
    const words = detail.title.trim().split(/\s+/);
    eventTitle.innerHTML = words.length > 1 ? `${esc(words.slice(0, -1).join(" "))}<br /><em>${esc(words.at(-1))}</em>` : `<em>${esc(words[0])}</em>`;
  }
  if (detail && eventDescription) eventDescription.textContent = detail.description;
  animateEventProgress();
  if (restart) startEventTimer();
};

const startEventTimer = () => {
  window.clearInterval(eventTimer);
  if (eventSlides.length < 2) return;
  eventTimer = window.setInterval(() => showEvent(eventIndex + 1, false), 10000);
};

document.querySelector("[data-event-prev]")?.addEventListener("click", () => showEvent(eventIndex - 1));
document.querySelector("[data-event-next]")?.addEventListener("click", () => showEvent(eventIndex + 1));
showEvent(0);

const story = document.querySelector("[data-story]");
const storyPhoto = document.querySelector("[data-story-photo]");
const storyHeading = document.querySelector("[data-story-heading]");
const storyCards = [...document.querySelectorAll("[data-story-card]")];
const storyProgress = document.querySelector("[data-story-progress]");
const storyStep = document.querySelector("[data-story-step]");
const cardMotion = [
  { x: 70, y: 65, r: 7 },
  { x: -75, y: 55, r: -6 },
  { x: 70, y: 75, r: -5 },
  { x: -55, y: 70, r: 5 },
];
let storyTicking = false;

const updateStory = () => {
  storyTicking = false;
  if (!story || !storyPhoto) return;
  const rect = story.getBoundingClientRect();
  const distance = Math.max(1, story.offsetHeight - window.innerHeight);
  const progress = clamp(-rect.top / distance);
  const scale = 1 - progress * 0.58;
  storyPhoto.style.transform = `translate(-50%, 0) scale(${scale}) rotate(${progress * -2}deg)`;
  if (storyHeading) storyHeading.style.opacity = String(1 - clamp((progress - 0.03) / 0.19));
  if (storyProgress) storyProgress.style.height = `${progress * 100}%`;

  storyCards.forEach((card, index) => {
    const start = Number(card.dataset.start || 0);
    const local = clamp((progress - start) / 0.13);
    const motion = cardMotion[index];
    const mobileFactor = window.innerWidth < 790 ? 0.55 : 1;
    card.style.opacity = String(local);
    card.style.transform = `translate(${motion.x * (1 - local) * mobileFactor}px, ${motion.y * (1 - local) * mobileFactor}px) rotate(${motion.r}deg) scale(${0.78 + local * 0.22})`;
  });

  if (storyStep) {
    const step = Math.min(4, Math.max(1, Math.ceil(progress * 4)));
    storyStep.textContent = `${String(step).padStart(2, "0")} / 04`;
  }
};

const requestStoryUpdate = () => {
  header?.classList.toggle("is-sticky", window.scrollY > 36);
  if (storyTicking) return;
  storyTicking = true;
  window.requestAnimationFrame(updateStory);
};

window.addEventListener("scroll", requestStoryUpdate, { passive: true });
window.addEventListener("resize", requestStoryUpdate, { passive: true });
requestStoryUpdate();

// Livros de projetos: usa os projetos publicados no admin (data.js).
const projectColors = ["project-blue", "project-coral", "project-cyan", "project-lime"];
const projectVisual = (project) => {
  if (project.visual === "bot") return `<div class="project-bot"><img src="public/assets/brand/mascot-wave.png" alt="Ilustração do assistente virtual criado pelo clube" /></div>`;
  if (project.visual === "window") return `<div class="project-window" aria-hidden="true"><i></i><div><span></span><b></b><b></b></div></div>`;
  if (project.visual === "rings") return `<div class="project-rings" aria-hidden="true"><i></i><i></i><strong>ODS<br />+ TEC</strong></div>`;
  if (project.cover) return `<div class="project-photo"><img src="${esc(project.cover)}" alt="Capa do projeto ${esc(project.title)}" /></div>`;
  return `<div class="project-photo project-photo-empty" aria-hidden="true"><strong>{i}</strong></div>`;
};
const projectBook = (project, index) => {
  const number = String(index + 1).padStart(2, "0");
  const words = project.title.trim().split(/\s+/);
  const closedTitle = words.length > 1 ? `${esc(words.slice(0, -1).join(" "))}<br />${esc(words.at(-1))}` : esc(project.title);
  const gallery = (project.gallery || []).slice(0, 4).map((src) => `<img src="${esc(src)}" alt="Imagem do projeto ${esc(project.title)}" loading="lazy" />`).join("");
  return `<article class="project-card ${projectColors[index % projectColors.length]}" data-project-book>
    <div class="project-book">
      <div class="book-spread">
        <div class="book-page book-page-right"><span class="book-folio">${number}</span><div class="project-copy"><h3>${esc(project.title)}</h3><p>${esc(project.description)}</p>${gallery ? `<div class="project-gallery">${gallery}</div>` : ""}</div></div>
      </div>
      <div class="book-leaf">
        <div class="book-closed" aria-hidden="true"><span>PROJETO ${number}</span><strong>${closedTitle}</strong><small>${esc(project.category)}</small></div>
        <div class="book-page book-page-left"><div class="project-meta"><span>${number}</span><span>${esc(project.category).toUpperCase()}</span></div>${projectVisual(project)}</div>
      </div>
    </div>
  </article>`;
};
const publishedProjects = typeof CC === "undefined" ? [] : CC.load("projects").filter((project) => project.status === "Publicado");
const projectSliderRoot = document.querySelector("[data-project-slider]");
if (projectSliderRoot && publishedProjects.length) projectSliderRoot.innerHTML = publishedProjects.map(projectBook).join("");

const projectSlider = document.querySelector("[data-project-slider]");
const projectProgress = document.querySelector("[data-project-progress]");
const projectBooks = [...document.querySelectorAll("[data-project-book]")];
const projectStep = () => (projectSlider?.querySelector(".project-card")?.getBoundingClientRect().width || 780) + 20;
let activeProjectBook = -1;

const updateProjectBooks = () => {
  if (!projectSlider || !projectBooks.length) return;
  const sliderRect = projectSlider.getBoundingClientRect();
  const sliderCenter = sliderRect.left + sliderRect.width / 2;
  let closestIndex = 0;
  let closestDistance = Infinity;

  projectBooks.forEach((book, index) => {
    const rect = book.getBoundingClientRect();
    const distance = Math.abs(rect.left + rect.width / 2 - sliderCenter);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  });

  if (closestIndex === activeProjectBook) return;
  activeProjectBook = closestIndex;
  projectBooks.forEach((book, index) => {
    book.classList.toggle("is-book-open", index === activeProjectBook);
    book.classList.toggle("is-book-before", index === activeProjectBook - 1);
    book.classList.toggle("is-book-after", index === activeProjectBook + 1);
  });
};

const updateProjectProgress = () => {
  if (!projectSlider || !projectProgress) return;
  const max = projectSlider.scrollWidth - projectSlider.clientWidth;
  const progress = max <= 0 ? 100 : 25 + (projectSlider.scrollLeft / max) * 75;
  projectProgress.style.width = `${clamp(progress, 25, 100)}%`;
};

document.querySelector("[data-project-prev]")?.addEventListener("click", () => projectSlider?.scrollBy({ left: -projectStep(), behavior: "smooth" }));
document.querySelector("[data-project-next]")?.addEventListener("click", () => projectSlider?.scrollBy({ left: projectStep(), behavior: "smooth" }));
projectSlider?.addEventListener("scroll", () => {
  updateProjectProgress();
  updateProjectBooks();
}, { passive: true });
window.addEventListener("resize", updateProjectBooks, { passive: true });
updateProjectProgress();
updateProjectBooks();

// Frentes: em telas de toque, o toque abre e fecha a descrição.
document.querySelectorAll("[data-team-card]").forEach((card) => {
  card.addEventListener("click", () => {
    if (window.matchMedia("(hover: hover)").matches) return;
    const open = !card.classList.contains("is-open");
    document.querySelectorAll("[data-team-card].is-open").forEach((other) => other.classList.remove("is-open"));
    card.classList.toggle("is-open", open);
  });
});

document.querySelectorAll(".faq-item > button").forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest(".faq-item");
    const shouldOpen = !item.classList.contains("is-open");
    document.querySelectorAll(".faq-item").forEach((faq) => {
      faq.classList.remove("is-open");
      faq.querySelector("button")?.setAttribute("aria-expanded", "false");
    });
    if (shouldOpen) {
      item.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
    }
  });
});

document.querySelectorAll("[data-password-toggle]").forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const input = toggle.parentElement?.querySelector("input");
    if (!input) return;
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    toggle.setAttribute("aria-label", show ? "Ocultar senha" : "Mostrar senha");
  });
});

document.querySelectorAll("[data-auth-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = form.closest("[data-auth-view]")?.querySelector("[data-auth-message]");
    message?.classList.add("is-visible");
    const submit = form.querySelector("[type='submit']");
    if (submit) submit.innerHTML = "Tudo certo <span aria-hidden='true'>✓</span>";
    if (form.dataset.authKind === "login") setTimeout(() => { window.location.href = "admin.html"; }, 650);
  });
});

document.querySelectorAll("[data-demo-google]").forEach((button) => {
  button.addEventListener("click", () => {
    const message = button.closest("[data-auth-view]")?.querySelector("[data-auth-message]");
    if (!message) return;
    message.textContent = "A autenticação do Google será conectada na versão final.";
    message.classList.add("is-visible");
  });
});

const authShell = document.querySelector("[data-auth-shell]");
if (authShell) {
  const authViews = [...authShell.querySelectorAll("[data-auth-view]")];

  const showAuthView = (mode) => {
    const nextMode = mode === "signup" ? "signup" : "login";
    authShell.dataset.authMode = nextMode;
    authViews.forEach((view) => {
      const isActive = view.dataset.authView === nextMode;
      view.classList.toggle("is-active", isActive);
      view.setAttribute("aria-hidden", String(!isActive));
      view.toggleAttribute("inert", !isActive);
    });
    document.title = nextMode === "signup" ? "Criar conta — CodeClub" : "Entrar — CodeClub";
  };

  showAuthView(location.hash === "#signup" ? "signup" : "login");

  authShell.querySelectorAll("[data-auth-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.authTarget;
      history.pushState({ authMode: mode }, "", mode === "signup" ? "#signup" : "#login");
      showAuthView(mode);
    });
  });

  window.addEventListener("popstate", () => {
    showAuthView(location.hash === "#signup" ? "signup" : "login");
  });
}
