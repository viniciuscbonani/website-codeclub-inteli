// Camada de dados do protótipo: tudo fica no localStorage do navegador.
const CC = (() => {
  const FRONTS = ["Educacional", "Marketing", "Financeiro", "Relações"];

  const defaults = {
    projects: [
      { id: "lab-aberto", title: "Lab Aberto", category: "Desenvolvimento", status: "Publicado", description: "Oficinas que aproximam crianças de novas tecnologias por meio de experiências práticas.", cover: "public/assets/events/event-03.png", gallery: [], visual: "photo", updatedAt: "2026-09-12T10:15:00" },
      { id: "clubinho-ai", title: "Clubinho AI", category: "Inteligência artificial", status: "Publicado", description: "Um assistente amigável para orientar atividades, projetos e descobertas dentro do clube.", cover: "", gallery: [], visual: "bot", updatedAt: "2026-09-10T16:32:00" },
      { id: "portal-atividades", title: "Portal de Atividades", category: "Produto & design", status: "Em edição", description: "Uma experiência para cada criança aprender, experimentar e avançar no próprio ritmo.", cover: "", gallery: [], visual: "window", updatedAt: "2026-09-08T09:05:00" },
      { id: "codigo-escola", title: "Código na Escola", category: "Impacto social", status: "Publicado", description: "Encontros que conectam educação, criatividade e tecnologia dentro da comunidade.", cover: "", gallery: [], visual: "rings", updatedAt: "2026-09-05T11:50:00" },
    ],
    events: [
      { id: "hackathon", title: "CodeClub Hackathon", description: "Um hackathon para jovens do ensino médio transformarem ideias em protótipos.", image: "public/assets/events/event-01.png", date: "", updatedAt: "2026-09-20T14:20:00" },
      { id: "code-kids", title: "Code Kids", description: "Aulas práticas para crianças descobrirem tecnologia e programação criando.", image: "public/assets/programs/code-kids.jpg", date: "", updatedAt: "2026-09-19T18:40:00" },
      { id: "code-teens", title: "Code Teens", description: "Tecnologia e programação para adolescentes aprenderem construindo com a gente.", image: "public/assets/programs/code-teens.jpg", date: "", updatedAt: "2026-09-12T10:15:00" },
      { id: "code-start-educafro", title: "Code Start com Educafro", description: "Tecnologia, programação e negócios para jovens das turmas Mentes em Expansão e Educafro.", image: "public/assets/events/code-start-educafro.jpg", date: "", updatedAt: "2026-09-08T09:30:00" },
      { id: "natal-ebenezer", title: "Ação de Natal", description: "Uma tarde de atividades com as crianças do Instituto Ebenézer.", image: "public/assets/events/natal-ebenezer.jpg", date: "", updatedAt: "2026-09-02T16:00:00" },
    ],
    members: [
      { id: "m1", name: "Ana Clara", email: "ana.clara@inteli.edu.br", front: "Educacional", role: "Líder", photo: "", updatedAt: "2026-09-18T10:00:00" },
      { id: "m2", name: "Marina Costa", email: "marina.costa@inteli.edu.br", front: "Marketing", role: "Líder", photo: "", updatedAt: "2026-09-17T10:00:00" },
      { id: "m3", name: "Pedro Lima", email: "pedro.lima@inteli.edu.br", front: "Financeiro", role: "Membro", photo: "", updatedAt: "2026-09-15T10:00:00" },
      { id: "m4", name: "Rafael Dias", email: "rafael.dias@inteli.edu.br", front: "Relações", role: "Líder", photo: "", updatedAt: "2026-09-14T10:00:00" },
    ],
  };

  const storageKey = (key) => `cc.${key}`;

  const load = (key) => {
    try {
      const raw = localStorage.getItem(storageKey(key));
      if (raw) return JSON.parse(raw);
    } catch {}
    return structuredClone(defaults[key]);
  };

  // Retorna false quando o navegador recusa (cota cheia ou storage bloqueado).
  const save = (key, list) => {
    try {
      localStorage.setItem(storageKey(key), JSON.stringify(list));
      return true;
    } catch {
      return false;
    }
  };

  const reset = (key) => {
    try { localStorage.removeItem(storageKey(key)); } catch {}
  };

  const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // Reduz a imagem antes de guardar como data URL, para caber no localStorage.
  const readImage = (file, maxWidth = 1200) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const image = new Image();
        image.onerror = reject;
        image.onload = () => {
          const scale = Math.min(1, maxWidth / image.width);
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);
          canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });

  const escape = (value = "") =>
    String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

  return { FRONTS, load, save, reset, id, readImage, escape };
})();
