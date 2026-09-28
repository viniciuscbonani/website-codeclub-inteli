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

// Carrossel do topo: eventos + projetos marcados para o carrossel (data.js).
const titleMarkup = (title) => {
  const words = String(title).trim().split(/\s+/);
  return words.length > 1 ? `${esc(words.slice(0, -1).join(" "))}<br /><em>${esc(words.at(-1))}</em>` : `<em>${esc(words[0])}</em>`;
};
const heroItems = typeof CC === "undefined"
  ? []
  : [
      ...CC.load("events").map((event) => ({ kind: "Evento", title: event.title, description: event.description, image: event.image })),
      ...CC.load("projects")
        .filter((project) => project.status === "Publicado" && project.showInHero && project.cover)
        .map((project) => ({ kind: "Projeto", title: project.title, description: project.description, image: project.cover, href: "#projetos" })),
    ];
const heroTrack = document.querySelector("[data-hero-track]");
if (heroTrack && heroItems.length) {
  heroTrack.innerHTML = heroItems
    .map(
      (item, index) => `<article class="hero-slide" data-hero-slide aria-roledescription="slide" aria-label="${index + 1} de ${heroItems.length}: ${esc(item.title)}">
        <img src="${esc(item.image)}" alt="" ${index > 1 ? 'loading="lazy"' : ""} />
        <div class="hero-slide-copy">
          <span class="hero-kind">${item.kind}</span>
          <h2>${titleMarkup(item.title)}</h2>
          <p>${esc(item.description)}</p>
          <div class="event-actions">
            <a class="button button-light" href="login.html#signup">Quero participar <span>↗</span></a>
            <a class="button button-ghost-light" href="${item.href || "#sobre"}">Saiba mais</a>
          </div>
        </div>
        <span class="hero-peek" aria-hidden="true"><small>Próximo</small>${esc(item.title)}</span>
      </article>`,
    )
    .join("");
}

const carousel = document.querySelector("[data-event-carousel]");
const eventSlides = [...document.querySelectorAll("[data-hero-slide]")];
const eventCurrent = document.querySelector("[data-event-current]");
const eventTotal = document.querySelector("[data-event-total]");
const eventProgress = document.querySelector("[data-event-progress]");
if (eventTotal) eventTotal.textContent = `/ ${String(eventSlides.length).padStart(2, "0")}`;
let eventIndex = 0;
let eventTimer;

const animateEventProgress = () => {
  if (!eventProgress || reduceMotion) return;
  eventProgress.classList.remove("is-running");
  void eventProgress.offsetWidth;
  eventProgress.classList.add("is-running");
};

// O ativo fica à esquerda, o próximo aparece em seguida e o anterior encolhe para fora pela esquerda.
const showEvent = (nextIndex, restart = true) => {
  if (!eventSlides.length) return;
  const total = eventSlides.length;
  eventIndex = (nextIndex + total) % total;
  eventSlides.forEach((slide, index) => {
    const position = (index - eventIndex + total) % total;
    slide.style.order = position === total - 1 && total > 2 ? -1 : position;
    slide.classList.toggle("is-active", position === 0);
    slide.classList.toggle("is-next", position === 1);
    slide.toggleAttribute("inert", position !== 0);
    slide.setAttribute("aria-hidden", String(position !== 0));
  });
  if (eventCurrent) eventCurrent.textContent = String(eventIndex + 1).padStart(2, "0");
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
heroTrack?.addEventListener("click", (event) => {
  if (event.target.closest(".hero-slide.is-next")) showEvent(eventIndex + 1);
});
carousel?.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") showEvent(eventIndex + 1);
  if (event.key === "ArrowLeft") showEvent(eventIndex - 1);
});
let swipeStart = null;
heroTrack?.addEventListener("pointerdown", (event) => { swipeStart = event.clientX; });
heroTrack?.addEventListener("pointerup", (event) => {
  if (swipeStart === null) return;
  const delta = event.clientX - swipeStart;
  swipeStart = null;
  if (Math.abs(delta) > 50) showEvent(eventIndex + (delta < 0 ? 1 : -1));
});
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
  const images = [project.cover, ...(project.gallery || [])].filter(Boolean);
  if (images.length) {
    const slides = images.map((src, index) => `<img class="${index === 0 ? "is-active" : ""}" src="${esc(src)}" alt="Foto ${index + 1} do projeto ${esc(project.title)}" loading="lazy" />`).join("");
    const dots = images.length > 1
      ? `<div class="photo-dots">${images.map((_, index) => `<button type="button" class="${index === 0 ? "is-active" : ""}" data-photo-dot="${index}" aria-label="Mostrar foto ${index + 1}"></button>`).join("")}</div><span class="photo-count"><b data-photo-current>1</b>/${images.length}</span>`
      : "";
    return `<div class="project-photo project-photo-carousel" data-photo-carousel>${slides}${dots}</div>`;
  }
  return `<div class="project-photo project-photo-empty" aria-hidden="true"><strong>{i}</strong></div>`;
};
const projectBook = (project, index) => {
  const number = String(index + 1).padStart(2, "0");
  const words = project.title.trim().split(/\s+/);
  const closedTitle = words.length > 1 ? `${esc(words.slice(0, -1).join(" "))}<br />${esc(words.at(-1))}` : esc(project.title);
  return `<article class="project-card ${projectColors[index % projectColors.length]}" data-project-book>
    <div class="project-book">
      <div class="book-spread">
        <div class="book-page book-page-right"><span class="book-folio">${number}</span><div class="project-copy"><h3>${esc(project.title)}</h3><p>${esc(project.description)}</p></div></div>
      </div>
      <div class="book-leaf">
        <div class="book-closed" aria-hidden="true"><span>PROJETO ${number}</span><strong>${closedTitle}</strong><small>${esc(project.category)}</small></div>
        <div class="book-page book-page-left"><div class="project-meta"><span>${number}</span><span>${esc(project.category).toUpperCase()}</span></div>${projectVisual(project)}</div>
      </div>
    </div>
  </article>`;
};
const publishedProjects = typeof CC === "undefined" ? [] : CC.load("projects").filter((project) => project.status === "Publicado" && project.showInProjects !== false);
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

// Fotos dentro do livro aberto trocam sozinhas; o hover pausa e os pontos escolhem a foto.
const showProjectPhoto = (carouselElement, index) => {
  const photos = [...carouselElement.querySelectorAll(":scope > img")];
  const next = (index + photos.length) % photos.length;
  photos.forEach((photo, photoIndex) => photo.classList.toggle("is-active", photoIndex === next));
  carouselElement.querySelectorAll("[data-photo-dot]").forEach((dot, dotIndex) => dot.classList.toggle("is-active", dotIndex === next));
  const current = carouselElement.querySelector("[data-photo-current]");
  if (current) current.textContent = next + 1;
  carouselElement.dataset.index = next;
};
document.querySelectorAll("[data-photo-carousel]").forEach((carouselElement) => {
  carouselElement.addEventListener("click", (event) => {
    const dot = event.target.closest("[data-photo-dot]");
    if (dot) showProjectPhoto(carouselElement, Number(dot.dataset.photoDot));
  });
  carouselElement.addEventListener("pointerenter", () => { carouselElement.dataset.paused = "true"; });
  carouselElement.addEventListener("pointerleave", () => { delete carouselElement.dataset.paused; });
});
if (!reduceMotion) {
  window.setInterval(() => {
    const active = document.querySelector(".project-card.is-book-open [data-photo-carousel]");
    if (!active || active.dataset.paused || active.querySelectorAll(":scope > img").length < 2) return;
    showProjectPhoto(active, Number(active.dataset.index || 0) + 1);
  }, 3500);
}

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
