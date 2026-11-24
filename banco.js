// banco.js: um "fetch simplificado" para conversar com a API do banco de dados
//
// No mundo real, o fetch é assim:
//
//   let resposta = await fetch(url, { method: "POST", body: JSON.stringify(dados) });
//   let json = await resposta.json();
//
// Para a aula, este arquivo deixa o fetch mais simples:
//
//   await fetch(API, "POST", reserva);       → envia a reserva para a API
//   let lista = await fetch(API, "GET");     → recebe a lista de reservas, já arrumada
//
// O fetch normal continua funcionando. Este só entra em ação
// quando o 2º item é um texto: "GET", "POST"...

(function () {
  const fetchDeVerdade = window.fetch.bind(window);
  window.__arenaBanco = true;
  window.__arenaGetOk = false;
  window.__arenaUltimaLista = [];

  window.fetch = async function (url, verbo, dados) {
    if (typeof verbo !== "string") return fetchDeVerdade(url, verbo);   // jeito normal

    verbo = verbo.toUpperCase();
    const opcoes = { method: verbo };
    if (dados !== undefined) opcoes.body = JSON.stringify(arrumarReserva(dados));

    const resposta = await fetchDeVerdade(url, opcoes);       // aqui acontece o fetch de verdade
    if (!resposta.ok) throw new Error("A API respondeu com erro " + resposta.status);
    const json = await resposta.json();                       // texto JSON → objeto JavaScript

    if (verbo === "GET") {
      const lista = virarLista(json);
      window.__arenaGetOk = true;
      window.__arenaUltimaLista = lista;
      return lista;
    }
    return json;
  };

  // O banco (Firebase) devolve { "id1": {...}, "id2": {...} }.
  // Aqui viramos uma lista [ {...}, {...} ], em ordem de data e horário.
  function virarLista(json) {
    return Object.values(json || {})
      .map(r => ({
        nome: limpar(r.nome),
        quadra: nomeDaQuadra(r.quadra),
        data: limpar(r.data),
        horario: limpar(r.horario)
      }))
      .sort((a, b) => (a.data + a.horario).localeCompare(b.data + b.horario));
  }

  // Deixa a reserva no formato que o banco aceita
  function arrumarReserva(r) {
    return {
      nome: limpar(r.nome).slice(0, 30) || "Anônimo",
      quadra: chaveDaQuadra(r.quadra),
      data: limpar(r.data).slice(0, 10) || hoje(),
      horario: limpar(r.horario).slice(0, 8),
      criadaEm: Date.now()
    };
  }

  // Segurança: tira < > e aspas, para ninguém colocar código no nome
  function limpar(texto) {
    return String(texto || "").replace(/[<>"'`]/g, "").trim();
  }

  // "Vôlei" → "volei", "Futebol" → "futebol" (é assim que fica guardado no banco)
  function chaveDaQuadra(texto) {
    return limpar(texto).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(" ")[0] || "futebol";
  }

  function nomeDaQuadra(chave) {
    return { futebol: "Futebol", volei: "Vôlei" }[chave] || limpar(chave);
  }

  function hoje() {
    const d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
})();
