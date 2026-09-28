const adminSidebar = document.querySelector("[data-admin-sidebar]");
const adminMenuToggle = document.querySelector("[data-admin-menu-toggle]");
const adminViews = [...document.querySelectorAll("[data-admin-view]")];
const esc = CC.escape;

// Cada tipo de conteúdo tem uma lista, um formulário e textos próprios.
const entities = {
  projects: { list: "dashboard", form: "new-project", noun: "projeto", plural: "projetos", title: "Novo projeto", editTitle: "Editar projeto", add: "＋ Adicionar projeto", image: "cover" },
  events: { list: "events", form: "new-event", noun: "evento", plural: "eventos", title: "Novo evento", editTitle: "Editar evento", add: "＋ Adicionar evento", image: "image" },
  members: { list: "members", form: "new-member", noun: "membro", plural: "membros", title: "Novo membro", editTitle: "Editar membro", add: "＋ Adicionar membro", image: "photo" },
};
const store = Object.fromEntries(Object.keys(entities).map((key) => [key, CC.load(key)]));
const routeTitles = { dashboard: "Projetos", "new-project": "Novo projeto", events: "Eventos", "new-event": "Novo evento", members: "Membros", "new-member": "Novo membro", settings: "Configurações" };
const routeGroup = (route) => Object.keys(entities).find((key) => entities[key].list === route || entities[key].form === route) || route;

let editing = { key: null, id: null };
const draft = { image: "", gallery: [] };
let memberFront = "Todas";

const formatDate = (iso) => {
  if (!iso) return "—";
  const date = new Date(iso);
  const today = new Date();
  const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (date.toDateString() === today.toDateString()) return `Hoje, ${time}`;
  return `${date.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "")}, ${time}`;
};

const toastElement = document.querySelector("[data-toast]");
let toastTimer;
const toast = (message, tone = "success") => {
  if (!toastElement) return;
  toastElement.textContent = message;
  toastElement.dataset.tone = tone;
  toastElement.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastElement.classList.remove("is-visible"), 3200);
};

const persist = (key) => {
  if (CC.save(key, store[key])) return true;
  toast("Não foi possível salvar: o armazenamento do navegador está cheio. Use imagens menores.", "error");
  return false;
};

/* ---------- Navegação ---------- */

const showAdminView = (route, updateHistory = true) => {
  const nextRoute = adminViews.some((view) => view.dataset.adminView === route) ? route : "dashboard";
  adminViews.forEach((view) => {
    const active = view.dataset.adminView === nextRoute;
    view.hidden = !active;
    view.classList.toggle("is-active", active);
  });
  const group = routeGroup(nextRoute);
  document.querySelectorAll("[data-nav-group]").forEach((button) => {
    const active = button.dataset.navGroup === group;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  if (updateHistory) history.pushState({ route: nextRoute }, "", `#${nextRoute}`);
  const isEdit = editing.id && entities[group]?.form === nextRoute;
  document.title = `${isEdit ? entities[group].editTitle : routeTitles[nextRoute]} — Admin Code Club`;
  adminSidebar?.classList.remove("is-open");
  adminMenuToggle?.setAttribute("aria-expanded", "false");
  window.scrollTo({ top: 0, behavior: "smooth" });
};

// Abrir um formulário pelo menu sempre começa um cadastro novo.
document.querySelectorAll("[data-admin-route]").forEach((button) =>
  button.addEventListener("click", () => {
    const route = button.dataset.adminRoute;
    const key = Object.keys(entities).find((entity) => entities[entity].form === route);
    if (key) openForm(key);
    else showAdminView(route);
  }),
);
window.addEventListener("popstate", () => showAdminView(location.hash.slice(1), false));

adminMenuToggle?.addEventListener("click", () => {
  const open = adminSidebar.classList.toggle("is-open");
  adminMenuToggle.setAttribute("aria-expanded", String(open));
  adminMenuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
});

/* ---------- Listas ---------- */

const searchValue = (key) => document.querySelector(`[data-search="${key}"]`)?.value.trim().toLocaleLowerCase("pt-BR") || "";
const rowActions = (key, item, extra = "") => `<div class="row-actions">${extra}<button class="icon-action" type="button" data-edit="${key}" data-id="${item.id}" aria-label="Editar ${esc(item.title || item.name)}"><img src="public/assets/admin/pencil.svg" alt="" /></button><button class="icon-action icon-danger" type="button" data-remove="${key}" data-id="${item.id}" aria-label="Remover ${esc(item.title || item.name)}"><span aria-hidden="true">×</span></button></div>`;
const statusClass = { Publicado: "status-green", "Em edição": "status-purple", Rascunho: "status-yellow" };
const initials = (name) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

const renderers = {
  projects: (items) =>
    items
      .map((project) => {
        const thumb = project.cover ? `<img src="${esc(project.cover)}" alt="" />` : `<span>{i}</span>`;
        const images = (project.cover ? 1 : 0) + (project.gallery?.length || 0);
        return `<tr><td><div class="row-title"><span class="row-thumb">${thumb}</span><span><strong>${esc(project.title)}</strong><small>${esc(project.description)}</small></span></div></td><td>${esc(project.category)}</td><td><div class="display-tags">${project.showInHero ? `<span class="front-tag" data-front="Marketing">Carrossel</span>` : ""}${project.showInProjects !== false ? `<span class="front-tag" data-front="Relações">Projetos</span>` : ""}${!project.showInHero && project.showInProjects === false ? "—" : ""}</div></td><td>${images || "—"}</td><td><span class="status ${statusClass[project.status] || "status-purple"}">${esc(project.status)}</span></td><td>${formatDate(project.updatedAt)}</td><td>${rowActions("projects", project)}</td></tr>`;
      })
      .join(""),
  events: (items) =>
    items
      .map((event) => {
        const position = store.events.indexOf(event);
        const move = `<button class="icon-action" type="button" data-move="-1" data-id="${event.id}" aria-label="Mover ${esc(event.title)} para antes" ${position === 0 ? "disabled" : ""}>↑</button><button class="icon-action" type="button" data-move="1" data-id="${event.id}" aria-label="Mover ${esc(event.title)} para depois" ${position === store.events.length - 1 ? "disabled" : ""}>↓</button>`;
        const date = event.date ? `<span>${new Date(`${event.date}T12:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}</span>` : "";
        return `<article class="event-admin-card"><figure><img src="${esc(event.image)}" alt="" /><b>${String(position + 1).padStart(2, "0")}</b></figure><div><h2>${esc(event.title)}</h2>${date}<p>${esc(event.description)}</p></div>${rowActions("events", event, move)}</article>`;
      })
      .join(""),
  members: (items) =>
    items
      .map((member) => {
        const avatar = member.photo ? `<img src="${esc(member.photo)}" alt="" />` : `<span>${esc(initials(member.name))}</span>`;
        return `<tr><td><div class="row-title"><span class="row-avatar">${avatar}</span><span><strong>${esc(member.name)}</strong><small>${esc(member.email)}</small></span></div></td><td><span class="front-tag" data-front="${esc(member.front)}">${esc(member.front)}</span></td><td>${esc(member.role)}</td><td>${formatDate(member.updatedAt)}</td><td>${rowActions("members", member)}</td></tr>`;
      })
      .join(""),
};

const render = (key) => {
  const query = searchValue(key);
  const items = store[key].filter((item) => {
    if (key === "members" && memberFront !== "Todas" && item.front !== memberFront) return false;
    return Object.values(item).some((value) => typeof value === "string" && !value.startsWith("data:") && value.toLocaleLowerCase("pt-BR").includes(query));
  });
  const list = document.querySelector(`[data-list="${key}"]`);
  if (list) list.innerHTML = renderers[key](items);
  const empty = document.querySelector(`[data-empty="${key}"]`);
  if (empty) empty.hidden = items.length > 0;
  list?.closest(".admin-table-scroll")?.toggleAttribute("hidden", items.length === 0);
  const { noun, plural } = entities[key];
  const count = document.querySelector(`[data-count="${key}"]`);
  if (count) count.textContent = `${items.length} ${items.length === 1 ? noun : plural}`;
  const navCount = document.querySelector(`[data-nav-count="${key}"]`);
  if (navCount) navCount.textContent = store[key].length;
};

document.querySelectorAll("[data-search]").forEach((input) => input.addEventListener("input", () => render(input.dataset.search)));

const frontFilter = document.querySelector("[data-front-filter]");
if (frontFilter) {
  frontFilter.innerHTML = ["Todas", ...CC.FRONTS].map((front) => `<button type="button" aria-pressed="${front === memberFront}" data-front-option="${front}">${front}</button>`).join("");
  frontFilter.addEventListener("click", (event) => {
    const option = event.target.closest("[data-front-option]");
    if (!option) return;
    memberFront = option.dataset.frontOption;
    frontFilter.querySelectorAll("button").forEach((button) => button.setAttribute("aria-pressed", String(button === option)));
    render("members");
  });
}
const frontSelect = document.querySelector("[data-front-select]");
if (frontSelect) frontSelect.innerHTML = CC.FRONTS.map((front) => `<option>${front}</option>`).join("");

// Remover pede um segundo clique em vez de abrir um alerta do navegador.
document.querySelector(".admin-main")?.addEventListener("click", (event) => {
  const edit = event.target.closest("[data-edit]");
  if (edit) {
    openForm(edit.dataset.edit, edit.dataset.id);
    return;
  }

  const move = event.target.closest("[data-move]");
  if (move) {
    const index = store.events.findIndex((item) => item.id === move.dataset.id);
    const target = index + Number(move.dataset.move);
    if (target < 0 || target >= store.events.length) return;
    [store.events[index], store.events[target]] = [store.events[target], store.events[index]];
    persist("events");
    render("events");
    return;
  }

  const remove = event.target.closest("[data-remove]");
  if (!remove) return;
  if (!remove.classList.contains("is-confirming")) {
    remove.classList.add("is-confirming");
    remove.innerHTML = "Remover?";
    setTimeout(() => {
      if (!remove.isConnected) return;
      remove.classList.remove("is-confirming");
      remove.innerHTML = `<span aria-hidden="true">×</span>`;
    }, 3000);
    return;
  }
  const key = remove.dataset.remove;
  const item = store[key].find((entry) => entry.id === remove.dataset.id);
  store[key] = store[key].filter((entry) => entry.id !== remove.dataset.id);
  persist(key);
  render(key);
  toast(`${item?.title || item?.name || "Item"} removido.`);
});

/* ---------- Formulários ---------- */

const formFor = (key) => document.querySelector(`[data-entity-form="${key}"]`);

const setImagePreview = (slot, src) => {
  const preview = document.querySelector(`[data-image-preview="${slot}"]`);
  if (!preview) return;
  if (slot === "photo") {
    preview.innerHTML = src ? `<img class="is-photo" src="${esc(src)}" alt="Foto do membro" />` : `<img src="public/assets/admin/user.svg" alt="" />`;
    return;
  }
  preview.classList.toggle("has-file", Boolean(src));
  preview.innerHTML = src
    ? `<img src="${esc(src)}" alt="Pré-visualização" /><button class="media-remove" type="button" data-clear-image="${slot}" aria-label="Remover imagem">×</button>`
    : `<span>◇</span><p>${slot === "cover" ? "Nenhuma capa selecionada" : "Nenhuma foto selecionada"}</p>`;
};

const renderGallery = () => {
  const preview = document.querySelector("[data-gallery-preview]");
  if (!preview) return;
  preview.innerHTML = draft.gallery.length
    ? draft.gallery.map((src, index) => `<figure><img src="${esc(src)}" alt="Imagem ${index + 1} do projeto" /><button type="button" data-remove-gallery="${index}" aria-label="Remover imagem ${index + 1}">×</button></figure>`).join("")
    : `<p class="gallery-empty">Nenhuma imagem adicionada.</p>`;
};

const updateCharCounts = (form) =>
  form.querySelectorAll("textarea").forEach((textarea) => {
    const counter = textarea.parentElement.querySelector("[data-char-count]");
    if (counter) counter.textContent = textarea.value.length;
  });

function openForm(key, id = null) {
  const form = formFor(key);
  const config = entities[key];
  const item = id ? store[key].find((entry) => entry.id === id) : null;
  editing = { key, id: item ? item.id : null };
  form.reset();
  form.querySelectorAll(".is-invalid").forEach((element) => element.classList.remove("is-invalid"));
  form.querySelector("[data-image-error]")?.classList.remove("is-visible");
  if (item) {
    [...form.elements].forEach((field) => {
      if (field.type === "checkbox") return;
      if (field.name && item[field.name] !== undefined) field.value = item[field.name];
    });
  }
  // Projetos antigos sem esses campos continuam aparecendo na seção de projetos.
  if (form.elements.showInHero) form.elements.showInHero.checked = Boolean(item?.showInHero);
  if (form.elements.showInProjects) form.elements.showInProjects.checked = item ? item.showInProjects !== false : true;
  draft.image = item?.[config.image] || "";
  draft.gallery = [...(item?.gallery || [])];
  setImagePreview(config.image, draft.image);
  if (key === "projects") renderGallery();
  updateCharCounts(form);
  document.querySelector(`[data-form-title="${key}"]`).textContent = item ? config.editTitle : config.title;
  document.querySelector(`[data-submit-label="${key}"]`).textContent = item ? "Salvar alterações" : config.add;
  showAdminView(config.form);
}

document.querySelectorAll("[data-entity-form]").forEach((form) => {
  form.addEventListener("input", (event) => {
    event.target.closest(".is-invalid")?.classList.remove("is-invalid");
    if (event.target.name === "showInHero" && !event.target.checked) form.querySelector("[data-image-error]")?.classList.remove("is-visible");
    if (event.target.matches("textarea")) updateCharCounts(form);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const key = form.dataset.entityForm;
    const config = entities[key];

    let firstInvalid = null;
    form.querySelectorAll("[required]").forEach((field) => {
      const valid = field.value.trim() && field.checkValidity();
      field.closest("label")?.classList.toggle("is-invalid", !valid);
      if (!valid && !firstInvalid) firstInvalid = field;
    });
    const needsImage = !draft.image && (key === "events" || (key === "projects" && form.elements.showInHero.checked));
    form.querySelector("[data-image-error]")?.classList.toggle("is-visible", needsImage);
    if (firstInvalid || needsImage) {
      (firstInvalid || form.querySelector("[data-open-import]"))?.focus();
      return;
    }

    const values = Object.fromEntries([...new FormData(form)].map(([name, value]) => [name, typeof value === "string" ? value.trim() : value]));
    const previous = store[key].find((entry) => entry.id === editing.id);
    const item = { ...previous, ...values, [config.image]: draft.image, id: previous?.id || CC.id(), updatedAt: new Date().toISOString() };
    if (key === "projects") {
      item.gallery = draft.gallery;
      item.showInHero = form.elements.showInHero.checked;
      item.showInProjects = form.elements.showInProjects.checked;
      // Projeto com capa própria deixa de usar a ilustração padrão.
      if (draft.image) item.visual = "photo";
    }

    const backup = store[key];
    store[key] = previous ? store[key].map((entry) => (entry.id === previous.id ? item : entry)) : [item, ...store[key]];
    if (key === "events" && !previous) store[key] = [...backup, item];
    if (!persist(key)) {
      store[key] = backup;
      return;
    }
    render(key);
    toast(previous ? `${item.title || item.name} atualizado.` : `${item.title || item.name} adicionado.`);
    editing = { key: null, id: null };
    showAdminView(config.list);
  });
});

/* ---------- Imagens ---------- */

const galleryInput = document.querySelector("[data-gallery-input]");
galleryInput?.addEventListener("change", async () => {
  const files = [...galleryInput.files].slice(0, 4 - draft.gallery.length);
  if (galleryInput.files.length > files.length) toast("O limite é de 4 imagens por projeto.", "error");
  for (const file of files) draft.gallery.push(await CC.readImage(file, 600));
  galleryInput.value = "";
  renderGallery();
});

document.querySelector(".admin-main")?.addEventListener("click", (event) => {
  const galleryButton = event.target.closest("[data-remove-gallery]");
  if (galleryButton) {
    draft.gallery.splice(Number(galleryButton.dataset.removeGallery), 1);
    renderGallery();
  }
  const clear = event.target.closest("[data-clear-image]");
  if (clear) {
    draft.image = "";
    setImagePreview(clear.dataset.clearImage, "");
  }
});

const importDialog = document.querySelector("[data-import-dialog]");
const fileInput = document.querySelector("[data-file-input]");
const dropZone = document.querySelector("[data-drop-zone]");
let selectedFile = null;
let importSlot = "cover";

const resetDropZone = () => {
  selectedFile = null;
  if (fileInput) fileInput.value = "";
  dropZone?.classList.remove("has-file");
  const title = dropZone?.querySelector("strong");
  const subtitle = dropZone?.querySelector(":scope > span");
  if (title) title.textContent = "Arraste e solte seu arquivo aqui";
  if (subtitle) subtitle.textContent = "ou clique para procurar no computador";
};

document.querySelectorAll("[data-open-import]").forEach((button) =>
  button.addEventListener("click", () => {
    importSlot = button.dataset.openImport;
    resetDropZone();
    importDialog?.showModal();
  }),
);

const setSelectedFile = (file) => {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    toast("Escolha um arquivo de imagem (JPG, PNG ou WebP).", "error");
    return;
  }
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

document.querySelector("[data-submit-import]")?.addEventListener("click", async () => {
  if (!selectedFile) { fileInput?.click(); return; }
  draft.image = await CC.readImage(selectedFile, importSlot === "photo" ? 400 : 1200);
  setImagePreview(importSlot, draft.image);
  document.querySelectorAll("[data-image-error]").forEach((error) => error.classList.remove("is-visible"));
  importDialog?.close();
});

/* ---------- Configurações ---------- */

document.querySelector("[data-settings-form]")?.addEventListener("submit", (event) => {
  event.preventDefault();
  toast("Alterações salvas.");
});

const resetButton = document.querySelector("[data-reset-data]");
resetButton?.addEventListener("click", () => {
  if (!resetButton.classList.contains("is-confirming")) {
    resetButton.classList.add("is-confirming");
    resetButton.textContent = "Clique de novo para confirmar";
    setTimeout(() => {
      resetButton.classList.remove("is-confirming");
      resetButton.textContent = "Restaurar padrão";
    }, 3000);
    return;
  }
  Object.keys(entities).forEach((key) => {
    CC.reset(key);
    store[key] = CC.load(key);
    render(key);
  });
  resetButton.classList.remove("is-confirming");
  resetButton.textContent = "Restaurar padrão";
  toast("Conteúdo padrão restaurado.");
});

/* ---------- Início ---------- */

Object.keys(entities).forEach(render);
const initialAdminRoute = location.hash.slice(1) || "dashboard";
const initialForm = Object.keys(entities).find((key) => entities[key].form === initialAdminRoute);
if (initialForm) {
  openForm(initialForm);
  history.replaceState({ route: initialAdminRoute }, "", `#${initialAdminRoute}`);
} else {
  showAdminView(initialAdminRoute === "import" ? "new-project" : initialAdminRoute, false);
}
if (initialAdminRoute === "import") requestAnimationFrame(() => document.querySelector("[data-open-import]")?.click());
