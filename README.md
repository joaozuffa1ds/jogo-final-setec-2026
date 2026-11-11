# Virus Waves 2D

Jogo de sobrevivência 2D feito **só com HTML, CSS e JavaScript puro** (sem bibliotecas, sem instalação).

## Como jogar

Abra o arquivo **`index.html`** com dois cliques (Chrome, Edge ou Firefox). No celular, abra no navegador de qualquer jeito.

- **Mover:** `WASD` ou setas (no celular: arraste na metade esquerda da tela)
- **Atacar:** é automático, sempre
- **Pausar:** `P` ou `Esc`
- **Abrir baú:** encoste nele (custa moedas) ou aperte `E`
- **Escolher melhoria ao subir de nível:** clique no card ou tecle `1` `2` `3` `4`
- **Próxima sala:** limpe a sala e ande na **SAÍDA** (o portal verde na parede direita)

## O XP não escapa mais

As gemas (XP) ficavam paradas no chão e sumiam quando você trocava de sala. Agora:

- Ao **limpar a sala**, todo o XP do chão é recolhido na hora (`+XP` aparece no personagem)
- Ao **passar pela saída**, o XP restante da sala anterior também entra na sua conta antes de a sala ser apagada
- Ao **morrer**, o XP que você ganhou no chão também conta
- Gema fora do ímã **persegue você devagar** (até 720px), e o ímã base foi de 100 → 130
- Gema abandonada some sozinha depois de **45s** (antes 30s) e vira XP em vez de sumir

## Parede é parede 🧱

Algumas salas têm obstáculos (pilares, colunas, labirinto, o anel...). Ninguém — nem você, nem bixo, nem tiro — atravessa:

- **O movimento vai por eixo, em passos pequenos:** encostou na parede, o corpo **escorrega rente** e trava só no eixo que bateu. Antes o empurrão tirava você pelo lado mais fundo e, numa parede fina, jogava você uns 20px para o outro lado (era o "teleporte").
- **Sem teleporte:** se um empurrão forte ou o nascimento te coloca dentro de uma parede, você volta **pelo mesmo lado que entrou** — nunca do lado de dentro.
- **A parede barra o ataque:** o projétil estoura nela, e área, cone e feixe só acertam quem está do **mesmo lado**. A mira e as armas também só enxergam o que está à vista.
- Vale para os dois lados: o tiro do bixo também morde a parede.

Testado com uma parede de 40px de espessura e passo de **800px por frame** (20x mais rápido que o jogo): nada atravessa, nada fica preso.

## Salas e fases

O jogo é dividido em **fases**, e cada fase tem **7 a 9 salas**.

| Modo | Fases | Salas |
|---|---|---|
| 🌱 Fácil | **5** (e você vence!) | 7 a 9 por fase |
| ♾️ Infinito | infinitas | 7 a 9 por fase, sem fim |
| 💀 Difícil | infinitas | 7 a 9 por fase, sem fim |
| 🧱 **Hardcore** | infinitas | 7 a 9 por fase, **com o mundo salvo** |

- **A sala de trás é apagada** quando você entra na seguinte: inimigos, baús e gemas do chão não vazam para a próxima.
- Dentro de cada sala o spawn vem em **ondas** (3 a 7 ondas). Quando acaba o orçamento da sala e não sobra nenhum bicho, a sala fica **LIMPA** e a saída abre.
- **Quanto mais fundo, mais bixos:** o total de inimigos da sala sobe a cada fase e a cada sala, e eles ficam mais fortes e mais elites aparecem.
- **A partir da sala 5 de cada fase tem chefe**: sala 5 traz o **☠️ CLEBER JR.** e sala 6 traz o **💠 PROFESSOR JR.** (mini-chefes: metade da vida, menores e batendo mais fraco). Nunca o mesmo boss aparece em salas em sequência — os mini-chefes entram em rotação.
- **💠 A SALA 7 SEMPRE TEM O BOSS SETEC**: em **toda fase**, a sala 7 é o território exclusivo do **SETEC** — o boss grande entra sozinho segundos depois de você atravessar a porta, com barra de vida com o nome dele. Ele é o único chefe que mora numa sala fixa: nunca aparece em outra sala e nunca vem em dupla. Vencê-lo abre a saída e conta como chefe derrotado na progressão (desbloqueios e save).
- **Chefe forte da fase**: nas fases de 8 salas, a última sala traz o chefe forte alternando **Cleber → Professor** (em fases de 9 salas o fechamento fica com o Cleber forte, garantindo boss diferente da sala 8). O próximo só nasce depois do anterior morrer — nunca dois ao mesmo tempo. As fases ficam com **7, 8 ou 9 salas**.
- **💠 SETEC — o boss da sala 7**: o terceiro rosto do trio de chefes, agora com sala própria. Ele **sempre é o boss da sala 7 de cada fase**. Nos modos **com fim** (Tutorial e Fácil) a última fase tem **exatamente 7 salas** — então a batalha da sala 7 contra ele é o **CHEFE FINAL do jogo**. Como todo boss, ele enfurece com metade da vida (fase 2: mais rápido, mais forte, golpes combinados) e alterna **3 habilidade**: **Estilhaços** (dois leques de tiro que acompanham o efeito de esquirlas), **Anel Sísmico** (dois anéis girando em sentidos opostos) e **Pisada Final** (investida com onda de choque e leque). A IA escolhe o golpe pela distância, prepara cada golpe (vento com o efeito crescendo no corpo dele) e descansa entre eles — dá pra aprender o ritmo dele e desviar.
- **🧪 Vida dos NPCs**: todos os inimigos (lacaios, elites e chefes) nasceram **35% mais resistentes** (multiplicador `HP_UP` em `js/entities.js`). As proporções entre os tipos ficam as mesmas — todos só duram mais na tela.

## 🎲 Mecânica da sala

Cada sala normal sorteia **uma das 20 mecânicas** quando você entra. Ela fica valendo até a sala ser limpa e some na próxima — o jogo nunca repete a mesma duas vezes seguidas. A **sala SETEC não ganha mecânica** (ela já é a sala bônus dos baús).

| | Mecânica | O que faz |
|---|---|---|
| 🌫️ | **Névoa** | Você só enxerga o que está pertinho. |
| ☄️ | **Chuva de Meteoros** | Meteoros caem sem parar e limpam a horda sozinhos. |
| 🧊 | **Piso de Gelo** | Você entra em velocidade e demora a parar. |
| 💣 | **Campo Minado** | Minas escondidas explodem com você em cima — e com a horda. |
| 🔺 | **Feixes Laser** | Feixes giram varrendo a sala e acertam todo mundo. |
| 🔵 | **Encolhendo** | Uma zona segura enorme começa a encolher; fora dela queima. |
| 🧛 | **Sede** | Sua vida escorre sozinha. Só matar cura. |
| 🔥 | **Chamas** | O chão pega fogo em todo lado. |
| ⚡ | **Grito Elétrico** | Raios em cadeia chamam os bichos de volta. |
| 🌀 | **Redemoinhos** | Vórtices arrastam a horda e deixam rastro tóxico. |
| 💰 | **Saldo em Moedas** | Todo abate cospe moedas (e às vezes uma gema). |
| 👥 | **Eco** | Cada bixo vem com uma cópia. |
| 👑 | **Elite** | Quase todo bixo nasce elite: mais vida, mais dano, mais recompensa. |
| 🪸 | **Parasitas** | Um bicho gruda em você e suga vida até você tirar ele na mão. |
| 🌊 | **Onda de Choque** | Anéis de choque saem do centro e varrem a sala. |
| 🚪 | **Saída Errante** | Depois de limpar a sala, a SAÍDA fica pulando de lugar. |
| 🍽️ | **Fome** | Abater enche a barriga. Cheio cura, vazio você fica lento. |
| 🌪️ | **Vendaval** | Um vento constante te empurra de um lado da sala. |
| 🛡️ | **Blindados** | Todo bixo nasce com escudo; acerte até quebrar. |
| ⏱️ | **Cronômetro** | Se o relógio zerar, cai uma horda extra e ele reinicia. |

O nome da mecânica aparece no aviso ao entrar na sala, na marca d'água do chão e no HUD (📍 `FASE 1 · SALA 2/8 🌫️NEBLINA`). A sala do chefe **não tem mecânica** — o chefe já é o desafio.

### 👊 CLEBER — combo de 3 golpes

O Cleber não é um chefe de tiro: ele é de pressão corpo a corpo. Ele nunca ataca sozinho, ele **encadeia três golpes** e só recua depois do terceiro:

| # | Golpe | O que faz | Recarga |
|---|---|---|---|
| 1 | **Jab** | investida curta, leque de 3 tiros apertado | 0,85s |
| 2 | **Cruzado** | investida mais forte, leque de 5 bem aberto | 1,10s |
| 3 | **Soco final** | pisada que abre uma **onda de choque** no chão + leque de 7 | 2,30s |

- A onda de choque é um anel que cresce do corpo dele e **acerta uma vez só** — dá pra passar por dentro dela correndo pra cima dela, ou ficar longe.
- Cada golpe segura a pose de soco (`cleber_atk_*`) durante a preparação.
- Com metade da vida (`phase2`) o combo ganha **anel giratório** no meio, no 2º e no 3º golpe.
- O Cleber é mais rápido que o Professor: ele avança com o corpo a cada golpe, então a distância importa.
- Passar pela saída abre a próxima fase: fase nova, salas novas, mais bixos.

### 🔐 SALA SETEC (sala bônus de baús)

Toda vez que você avança de sala tem **5% de chance** de cair na **SALA SETEC bônus** (a tag `🔐 007`, no lugar de uma sala normal — nunca no lugar de uma sala de chefe, logo **nunca na sala 7**).

> ⚠️ Não confunda: a **sala bônus de baús** (tag `007`) é uma recompensa; a **sala 7 de cada fase** é sempre a batalha contra o **BOSS SETEC**.

- Vem **6 a 10 baús**, e pelo menos **3 são grátis** (basta encostar e apertar `E`)
- Poucos inimigos de guarda
- Paga moedas e gemas na entrada
- Visual turquesa com a marca `007` no chão

## Personagens 🧙

14 personagens. Cada um **destrava uma arma a mais** para usar na partida (uma arma é liberada por personagem).

**Como funciona em 2 passos:**

1. **Destrava** — jogando. Cada personagem tem um requisito (limpar salas, abrir baús, criar fusões, derrubar chefes, terminar uma fase, chegar a um nível). Quando você cumpre, o personagem é liberado sozinho e aparece um aviso.
2. **Compra** — vá em 🧙 PERSONAGENS e pague com gemas para poder usar. Só dá pra comprar o que já foi destravado.

Comprar um personagem **libera a arma dele no sorteio** (baús e level-up) e dá o bônus de stats dele. Fusões também contam como armas: o Arquiteto (Martelo), o Alquimista (Machados em Chamas) e o Tecelão (Ondas Infernais) tiram as 3 fusões do sorteio direto.

| Personagem | Destrava | Requisito | Bônus |
|---|---|---|---|
| 🧭 Viajante | ⚔️ Espada | já começa | — |
| 💰 Mercador | 🪓 Machado | limpar 3 salas | +2 sorte, +25% moedas |
| 🏹 Caçadora | 🏹 Arco de Ferro | limpar 5 salas | +12% velocidade, +10% crítico |
| 🗡️ Ladina | 🗡️ Adagas Tóxicas | abrir 8 baús | +15% velocidade |
| 🔥 Piromante | 🔥 Cajado de Fogo | terminar 1 fase | +20% dano, +40 vida |
| ❄️ Glaciador | ❄️ Cajado Gélido | chegar ao nível 8 | +60 vida, +2 armadura |
| 🌊 Mareada | 🌊 Onda de Choque | abrir 18 baús | +15% dano, +1 armadura |
| 🔮 Oráculo | 🔮 Orbes Arcanos | limpar 12 salas | +3 sorte, +70% ímã |
| 🧛 Vampira | 🩸 Sangue Vital | derrubar 2 chefes | +20% crítico, +50 vida |
| ⚡ Tempestário | ⚡ Bastão de Raios | chegar ao nível 20 | +25% dano, -18% recarga |
| 🏛️ Arquiteto | ⛈️ Martelo de Trovão | criar 2 fusões | +30% dano, +1 slot |
| ⚗️ Alquimista | 🔥🪓 Machados em Chamas | criar 4 fusões | +35% dano, -20% recarga, +60 vida |
| 🌀 Tecelão do Caos | 🌋 Ondas Infernais | criar 6 fusões | +40% dano, +3 armadura, +15% velocidade |
| 👑 **GOD** | 🔓 **todas as 35 armas** (20 + 15 fusões) | **só pelo código 2026** | tudo no máximo |

### 👑 GOD

O GOD é o personagem final e tem **TODAS as armas do jogo**:

- **No começo da partida ele já entra com os 6 slots preenchidos** (espada, machado, arco, fogo, raio e orbes), todas já no **nível 3** — ou seja, dá pra **fundir 4 pares de cara** e criar fusões já na primeira sala
- **O sorteio dele tem as 35 armas**: as 20 armas + as 15 fusões, direto nos baús e nos cards de level-up (as outras personagens só recebem as armas que destravaram)
- **Todas as habilidades ligadas ao mesmo tempo**: vida, dano, velocidade, crítico, armadura, sorte, ímã, moedas, XP, recarga rápida, **3 renascer** e **2 slots de arma a mais** (8 slots no total)

Ele **não** pode ser destravado nem comprado jogando — só sai pelo código abaixo.

## 🧱 Modo Hardcore (mundo salvo, igual Minecraft)

Um mundo que **fica salvo em disco**: você fecha o jogo, volta outro dia e continua exatamente de onde parou. Se **morrer, perde o mundo inteiro**.

**O que fica salvo no mundo:**
- Nome do mundo (sorteado) e **dia** (conta cada vez que você entra)
- Fase e sala em que você está
- Nível, XP, vida, **armas e níveis delas**, passivas
- **Relíquias** que você pegou
- Gemas, personagens comprados, melhorias da loja, estatísticas

**O que acontece quando você morre:**
- O save do mundo é **apagado do navegador**
- Tudo volta a zero: fase 1 sala 1, nível 1, sem armas, sem relíquias, sem gemas, sem personagens, sem melhorias
- Aparece a tela **🧱 MUNDO PERDIDO** listando o que você perdeu (fases, salas, nível, abates, tempo, armas, relíquias, personagens, gemas)

Detalhes do modo:
- Não tem renascer (morrer é definitivo mesmo)
- Dano dos inimigos um pouco maior (+10%) e eles têm um pouco mais de vida (+15%)
- Salva sozinho ao limpar sala, trocar de sala/fase, abrir baú, subir de nível, pegar relíquia, comprar na loja, sair do menu e **ao fechar a aba**
- O menu mostra o **painel do mundo** com ▶ CONTINUAR MUNDO e 🗑 APAGAR MUNDO (com confirmação em 2 cliques)
- O progresso dos **outros modos não é afetado** — só o mundo do hardcore é apagado

## 🧑‍🎨 Skins

**21 skins** que mudam a cor do seu personagem (e algumas dão bônus).

- Cada **personagem comprado** libera a skin dele **de graça**
- As **extras** já nascem liberadas e se compram com gemas (300 a 1400)
- Algumas têm bônus: Pele de Ouro (+12% gemas, +5% XP), Pele de Lava (dano queima), Gelo Eterno (dano congela), Osso Antigo (+1 armadura), Arco-Íris (+2 sorte), Vazio do Fim (+12% dano, +60 vida)...
- O código `2026` libera e compra **todas as 21 skins**
- A skin fica valendo em todas as partidas, em qualquer modo

## Códigos

Na tela inicial tem um campo **🔑 CÓDIGO** — digite o código e aperte `Enter` (ou o botão OK). Não aceitam espaço, acento nem diferenciar maiúsculas de minúsculas, e cada um vale **uma vez só**.

| Código | O que faz |
|---|---|
| `jl` | dá **99.999 gemas** |
| `2026` | **libera TODOS os personagens E TODAS as 21 skins**, já deixados comprados, com o GOD equipado (que tem todas as armas) e a skin do GOD em uso |
| `1602` | **apaga o progresso** salvo no navegador (gemas, personagens, melhorias da loja e códigos já usados) e recarrega a página |

Para criar novos, basta adicionar uma linha em `CODES` no fim de `js/data.js`.

## Armas e fusões

**20 armas, cada uma com um ataque diferente:**

| | Arma | O que ela faz |
|---|---|---|
| 1 | ⚔️ Espada | corte em arco na direção da mira |
| 2 | 🪓 Machado de Guerra | lança machados que atravessam e voltam |
| 3 | 🏹 Arco de Ferro | flechas automáticas nos inimigos mais próximos |
| 4 | 🔥 Cajado de Fogo | leque de fogo que incendeia |
| 5 | ⚡ Bastão de Raios | raios que caem do céu e saltam em cadeia |
| 6 | 🔮 Orbes Arcanos | esferas que giram ao seu redor |
| 7 | 🌊 Onda de Choque | anéis que se expandem e arremessam |
| 8 | 🗡️ Adagas Tóxicas | adagas em todas as direções que envenenam |
| 9 | ❄️ Cajado Gélido | estilhaços que congelam |
| 10 | 🩸 Sangue Vital | pulsa e drena vida, curando você |
| 11 | 🔗 **Cruz de Ferro** | braços girando que raspam tudo em volta |
| 12 | ⚡ **Lâmina de Luz** | feixe contínuo na direção da mira |
| 13 | 🌵 **Espinho de Palha** | finca espinhos no chão que atiram sozinhos |
| 14 | ☄️ **Chuva de Meteoros** | meteoros caem em cima dos inimigos e queimam o chão |
| 15 | ☁️ **Nuvem Tóxica** | nuvens de veneno que corroem quem passar |
| 16 | 🌪️ **Tornado** | vórtices que puxam e giram os inimigos |
| 17 | 🐝 **Vespa Sucata** | vespas teleguiadas que perseguem e explodem |
| 18 | ☀️ **Raios Solares** | pulso de 8 raios em volta de você |
| 19 | 🧱 **Muralha de Espinhos** | fileira de espinhos na direção da mira |
| 20 | 👻 **Alma Flamejante** | aura de fogo que gruda em você |

**6 passivas novas:** ⏱️ Cadência (-8% recarga) · 🔭 Alcance (+14% de área) · 🧛 Vampirismo (cura por abate) · 💣 Reação em Cadeia (abates explodem) · 🔥 Incêndio (seu dano queima) · 📚 Memória (+18% de XP).

**7 itens novos na loja:** Cadência, Alcance, Vampirismo, Reação em Cadeia, Incêndio, Memória e 🧭 **Bússola de Relíquias** (+12% de chance de achar relíquia).

**15 fusões:** leve **duas** armas ao **nível 3** e a fusão aparece como card ao subir de nível (com banner avisando). A fusão **sempre cabe**: ela come as duas armas que deram origem.
Chama Ardente · Martelo de Trovão · Flechas Gélidas · Adagas Carmesins · Orbes de Tempestade · Ondas Infernais · Ceifa Carmesim · Machados em Chamas · Onda Trovejante · 🧱🔗 Bastião de Ferro · ☄️💫 Colapso Estelar · 🌪️☁️ Ciclone Tóxico · 🐝☁️ Enxame de Vespa · ☀️⚡ Eclipse Total · 🔗🪓 Serra Rotativa

## 🛠 Arsenal (banco de armas, loja, venda e raridades)

Durante a partida, aperte **Esc** (ou o botão 🛠 no HUD) para abrir o **ARSENAL**: gerência completa de armas estilo deck — PC (teclado + mouse), tudo pausado enquanto está aberto.

| Aba | O que faz |
|---|---|
| ⚔️ ARSENAL | **EQUIPADAS** (slots do personagem) e **INVENTÁRIO** (armas guardadas). Cada card mostra ícone, nome, raridade, nível, atributos reais e botões |
| 🪙 LOJA | 6 ofertas de armas base (a mesma fonte dos baús) pagas com **moedas**. 🎲 **TROCAR OFERTAS** rerrola por um custo que cresce com a fase |

**5 raridades** (afetam dano, recarga e área de verdade — Comum é idêntico ao balanceamento original):

| Raridade | Dano | Recarga | Área | Preço |
|---|---|---|---|---|
| ⚪ Comum | ×1,00 | ×1,00 | ×1,00 | 🪙 30 |
| 🟢 Incomum | ×1,25 | ×0,94 | ×1,05 | 🪙 60 |
| 🔵 Rara | ×1,50 | ×0,88 | ×1,10 | 🪙 115 |
| 🟣 Épica | ×1,85 | ×0,82 | ×1,15 | 🪙 195 |
| 🟡 Lendária | ×2,30 | ×0,75 | ×1,20 | 🪙 320 |

O sorteio da loja melhora com a **fase** e com **sorte**; preços sobem com a profundidade das salas.

**Ações por card:** ⚔️ EQUIPAR (usa slot livre) · 🎒 GUARDAR (desequipar) · ↔ TROCAR (equipa a do inventário no lugar da equipada — nada se perde) · 🔮 **FUNDIR** (duas armas **iguais**: mesmo id E mesma raridade → uma de raridade acima, no nível mais alto das duas; se umas das duas estava equipada, a fundida ocupa o slot) · VENDER (modal de confirmação, devolve ~45% do preço; a Lendária é o topo, não funde).

**Regras:** slots nunca estouram; comprar já equipa se houver slot livre; armaduras de venda não têm volta na partida; tudo integrado ao dinheiro real (🪙) e às armas reais — o que você compra atira na sala seguinte. No **Hardcore**, equipadas (com raridade) e inventário são salvos no mundo e voltam quando você retoma o jogo.

## Relíquias ✨

Dentro das salas aparece um **pedestal com uma relíquia** (coluna de luz). É só encostar que ela é sua, e vale **a partida inteira**. As 20 são diferentes e **cada uma muda alguma coisa de verdade**:

| Relíquia | Função |
|---|---|
| 🪨 Coração de Basalto | +45 de vida máxima |
| ⚔️ Fio de Navalha | +18% de dano |
| 🔥 Cinzas Quentes | **todo seu dano passa a queimar** |
| ❄️ Gelo Eterno | **todo seu dano passa a congelar** |
| 🛡️ Placa de Ferro | +3 de armadura |
| 👟 Coturno Leve | +20% de velocidade |
| 🎯 Óptica Perfeita | +20% de chance crítica |
| 🧲 Núcleo Imantado | +100% de alcance do ímã de XP |
| 🍀 Trevo de Ouro | +3 de sorte |
| ⏳ Ampulheta de Elã | +16% de velocidade de recarga |
| 💣 Pólvora Compacta | **todo inimigo que você mata explode** |
| 🩸 Presa de Vampiro | cura 4% da vida a cada abate |
| 📜 Tomo da Sabedoria | +25% de experiência |
| 🪙 Bolsa Pesada | +30% de moedas |
| 📢 Corneta do Écho | +30% no tamanho de todas as áreas |
| ⏱️ Relógio Quebrado | as ondas desaceleram 35% |
| 🪞 Espelho Maldito | +1 renascer |
| 🌋 Coroa de Lava | +1 slot de arma |
| 💎 Cristal Eterno | +45% de gemas no fim da partida |
| 👑 Trono do Rei | melhora **todas** as habilidades de uma vez |

- **Onde aparecem:** ~34% das salas normais, **sempre** na SALA SETEC, e a 🧭 Bússola de Relíquias da loja aumenta a chance
- **Não repetem** na mesma partida: as 20 só aparecem uma vez cada
- Os bônus **somam** com as passivas, com o personagem e com a loja
- **É só encostar** no pedestal (raio de 82px) que a relíquia é sua; quando ela está a menos de 320px de você, o nome dela aparece em cima do pedestal
- As que ficam na partida aparecem na barra embaixo da tela (canto inferior esquerdo)

**Durante a partida:** você ganha XP, **moedas** e **baús** (que só abrem pagando moedas — menos os da SETEC).

**Depois da partida:** as **gemas** são calculadas (tempo + abates + nível + baús + salas) e você gasta na **loja**:
slot de arma extra, poder das armas, vitalidade, sorte, agilidade, magnetismo, crítico, armadura, nível inicial, renascer e bolsa de ouro.

> O progresso (gemas, personagens e melhorias da loja) é salvo no navegador (`localStorage`) e continua valendo depois de fechar o Chrome. O código `1602` apaga tudo.

## O que foi feito para o jogo não travar

O travamento vinha do **spawn dos bixos**: podia ter 620 inimigos vivos, cada arma varrendo a lista inteira de inimigos todo frame, criando milhares de objetos por segundo.

- **Grade espacial**: inimigos ficam em células de 64px e toda busca de alvo (mira, flechas, área, projéteis, orbes, repulsão) só olha as células próximas
- **Nada de alocar memória por frame**: as buscas de "inimigo mais próximo" usam buffers reaproveitados, sem `sort` e sem criar objetos
- **Teto de inimigos vivos por sala** (e o jogo mede o próprio FPS: se engasgar, ele reduz a carga sozinho)
- **Desenho**: `shadowBlur` só em elite e chefe, gemas/balas/partículas com corte de tela (culling) e sem `save/restore` por item
- **HUD leve**: os números da tela atualizam 12x por segundo em vez de 60

Medido com **300 inimigos + 20 armas + 15 fusões + 20 relíquias** todos ao mesmo tempo: **~0,6 ms por frame** de lógica e desenho (o orçamento de um frame de 60 fps é 16,7 ms).

## Arquivos

```
index.html          tela e elementos da interface
css/style.css       estilo de tudo
css/arsenal.css     estilo do ARSENAL (cards de raridade, loja, confirmação)
js/utils.js         matemática, cores, helpers
js/data.js          armas, fusões, passivas, modos, sala SETEC, 20 relíquias, personagens, loja, códigos
js/save.js          progresso normal + o MUNDO do hardcore em localStorage
js/chars.js         destrave, compra e seleção de personagens (e a lista de armas liberadas)
js/input.js         teclado + joystick de toque
js/audio.js         efeitos sonoros (sintetizados)
js/sprites.js       carrega as imagens (olhos, professores, Cleber, relíquias) e pinta skins
js/entities.js      tipos de inimigo, IA e desenho deles
js/mechanics.js     as 20 mecânicas de sala (sorteadas uma por sala)
js/game.js          salas, fases, mundo, player, projéteis, XP, baús, relíquias, grade espacial, câmera e a colisão com as paredes (`moveBody`, `losBlocked`)
js/arsenal.js       ARSENAL: inventário, equipar/trocar, loja de armas, venda com confirmação, raridades e fusão de iguais
js/ui.js            HUD, cards de level-up, loja, personagens e resultados
js/main.js          inicialização e loop principal
```

Para mudar alguma coisa fácil: armas, fusões e personagens ficam todas em `js/data.js`; as regras de sala e fase ficam no começo de `js/game.js` (`enterRoom`, `nextRoom`, `nextPhase`).

Para mexer nas paredes: tudo está em `js/game.js`, na parte de **ARENAS / COLISÃO COM OBSTÁCULOS** — `moveBody` (andar sem atravessar), `pushOutOfObstacles` (tirar alguém de dentro de uma parede) e `losBlocked` (parede barra o ataque).

Para mexer nas mecânicas: tudo está em `js/mechanics.js`. Cada mecânica é um objeto com `id`, `nome`, `icon`, `desc` e as funções opcionais `init`, `update`, `draw`, `drawScreen`, `onSpawn` e `onKill` — é só adicionar o objeto na lista `LIST` que ele passa a ser sorteado.