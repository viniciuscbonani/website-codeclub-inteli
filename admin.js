const adminSidebar = document.querySelector("[data-admin-sidebar]");
const adminMenuToggle = document.querySelector("[data-admin-menu-toggle]");
const adminViews = [...document.querySelectorAll("[data-admin-view]")];

const showAdminView = (route, updateHistory = true) => {
  const nextRoute = adminViews.some((view) => view.dataset.adminView === route) ? route : "dashboard";
  adminViews.forEach((view) => {
    const active = view.dataset.adminView === nextRoute;
    view.hidden = !active;
    view.classList.toggle("is-active", active);
  });
  document.querySelectorAll("[data-admin-route]").forEach((button) => button.classList.toggle("is-active", button.dataset.adminRoute === nextRoute));
  if (updateHistory) history.pushState({ route: nextRoute }, "", `#${nextRoute}`);
  document.title = `${nextRoute === "dashboard" ? "Projetos" : nextRoute === "settings" ? "Configurações" : "Novo projeto"} — Admin Code Club`;
  adminSidebar?.classList.remove("is-open");
  adminMenuToggle?.setAttribute("aria-expanded", "false");
  window.scrollTo({ top: 0, behavior: "smooth" });
};

document.querySelectorAll("[data-admin-route]").forEach((button) => button.addEventListener("click", () => showAdminView(button.dataset.adminRoute)));
window.addEventListener("popstate", () => showAdminView(location.hash.slice(1), false));
const initialAdminRoute = location.hash.slice(1) || "dashboard";
showAdminView(initialAdminRoute === "import" ? "new-project" : initialAdminRoute, false);
if (initialAdminRoute === "import") requestAnimationFrame(() => document.querySelector("[data-import-dialog]")?.showModal());

adminMenuToggle?.addEventListener("click", () => {
  const open = adminSidebar.classList.toggle("is-open");
  adminMenuToggle.setAttribute("aria-expanded", String(open));
  adminMenuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
});

const projectRows = [...document.querySelectorAll("[data-project-list] tr")];
const projectCount = document.querySelector("[data-project-count]");
document.querySelector("[data-project-search]")?.addEventListener("input", (event) => {
  const query = event.target.value.trim().toLocaleLowerCase("pt-BR");
  let visible = 0;
  projectRows.forEach((row) => {
    const match = row.textContent.toLocaleLowerCase("pt-BR").includes(query);
    row.hidden = !match;
    if (match) visible += 1;
  });
  if (projectCount) projectCount.textContent = `${visible} ${visible === 1 ? "projeto" : "projetos"}`;
});

document.querySelector("[data-settings-form]")?.addEventListener("submit", (event) => {
  event.preventDefault();
  document.querySelector("[data-settings-notice]")?.classList.add("is-visible");
});

const importDialog = document.querySelector("[data-import-dialog]");
const fileInput = document.querySelector("[data-file-input]");
const dropZone = document.querySelector("[data-drop-zone]");
let selectedFile = null;

document.querySelector("[data-open-import]")?.addEventListener("click", () => importDialog?.showModal());

const setSelectedFile = (file) => {
  if (!file) return;
  selectedFile = file;
  dropZone?.classList.add("has-file");
  const title = dropZone?.querySelector("strong");
  const subtitle = dropZone?.querySelector(":scope > span");
  if (title) title.textContent = file.name;
  if (subtitle) subtitle.textContent = `${Math.max(1, Math.round(file.size / 1024))} KB · pronto para importar`;
};

fileInput?.addEventListener("change", () => setSelectedFile(fileInput.files?.[0]));
["dragenter", "dragover"].forEach((type) => dropZone?.addEventListener(type, (event) => { event.preventDefault(); dropZone.classList.add("is-dragging"); }));
["dragleave", "drop"].forEach((type) => dropZone?.addEventListener(type, (event) => { event.preventDefault(); dropZone.classList.remove("is-dragging"); }));
dropZone?.addEventListener("drop", (event) => setSelectedFile(event.dataTransfer?.files?.[0]));

document.querySelector("[data-submit-import]")?.addEventListener("click", () => {
  if (!selectedFile) { fileInput?.click(); return; }
  const preview = document.querySelector("[data-media-preview]");
  preview?.classList.add("has-file");
  if (preview) preview.innerHTML = `<span>✓</span><p>${selectedFile.name}</p>`;
  importDialog?.close();
});

document.querySelector("[data-project-form]")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const submit = event.currentTarget.querySelector("[type='submit']");
  if (submit) submit.textContent = "Projeto adicionado ✓";
  setTimeout(() => showAdminView("dashboard"), 700);
});
