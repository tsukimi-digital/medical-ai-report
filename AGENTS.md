# Multi-Agent Team — Codex Setup

Ten plik definiuje sposób pracy Codex jako orkiestratora zespołu agentów.
Skopiuj go jako `AGENTS.md` do katalogu projektu.

---

## Rola Codex (główne okno)

Codex w głównym oknie jest **orkiestratorem** — nie pisze kodu samodzielnie.
Zadania orkiestratora:
- Przyjmuje zadanie od użytkownika i rozkłada je na podzadania per agent
- Zapisuje plan implementacji w pliku `docs/PROGRESS.md` — każde zadanie jako checkbox przypisany do agenta; agent odhacza swoje zadania po ukończeniu
- Spawuje agentów via Agent tool
- Koordynuje kolejność pracy (zależności między agentami)
- Merguje PR-y po zakończeniu review
- Raportuje status użytkownikowi

---

## Zespół agentów

| Rola | Imię | Email | Odpowiedzialność |
|------|------|-------|-----------------|
| Tech Lead | Hiroshi Tanaka | tl@tsukimi-digital.com | Architektura, initial scaffold, API contract, final review wszystkich PR-ów |
| Frontend | Yuki Sato | fe@tsukimi-digital.com | UI, HTML/CSS/JS lub React, obsługa formularzy, UX |
| Backend 1 | Kenji Mori | be1@tsukimi-digital.com | API routes, kontrolery, middleware, auth logic |
| Backend 2 | Akira Yamamoto | be2@tsukimi-digital.com | Services, data layer, mock/real DB, business logic |
| QA | Mei Nakamura | qa@tsukimi-digital.com | Testy e2e produktowe — weryfikuje czy aplikacja spełnia założenia produktowe |

> Dostosuj emaile do domeny swojego projektu (np. `fe@twojadomena.com`).

---

## Workflow — krok po kroku

### Faza 1: Setup (TL)

TL tworzy initial commit na `main`:
- Struktura katalogów projektu
- `package.json` (root + workspaces)
- Dokumentacja API contract (`docs/api-contract.md`)
- Pliki placeholder z komentarzami `// BE1: implement here`
- `.gitignore`

### Faza 2: Implementacja równoległa

FE, BE1, BE2 pracują **równolegle** — każdy w osobnym worktree:

```
/projekt          ← main branch (TL, orkiestrator)
/projekt-fe       ← feature/login-ui (Yuki Sato)
/projekt-be1      ← feature/auth-api (Kenji Mori)
/projekt-be2      ← feature/user-service (Akira Yamamoto)
```

**Każdy developer** (FE, BE1, BE2) przed implementacją **musi przeczytać `docs/api-contract.md`** — tam są zdefiniowane interfejsy, endpointy i typy danych. Implementacja musi być zgodna z kontraktem.

Każdy developer pisze własne testy jednostkowe i integracyjne do komponentów które implementuje — jako część swojego PR.

### Faza 2.5: QA — testy e2e (po merge FE, BE1, BE2)

QA (Mei Nakamura) zaczyna pracę **dopiero po tym jak FE, BE1 i BE2 są wszystkie zmergowane na `main`**. Jej worktree tworzy się dopiero w tym momencie. Zadaniem QA są testy produktowe e2e weryfikujące czy projekt spełnia założenia produktowe — nie testy jednostkowe komponentów (te są odpowiedzialnością każdego developera osobno).

Źródłem wymagań dla QA jest **Design Spec** (dokument tworzony przez skille `brainstorming` + `write-plan` na początku projektu) — tam są zdefiniowane cele aplikacji.

```
/projekt-qa       ← feature/tests (Mei Nakamura)  ← tworzone po merge FE+BE1+BE2
```

### Faza 3: Code Review

Po utworzeniu PR-ów każdy agent recenzuje innego:

| Agent | Recenzuje PR |
|-------|-------------|
| TL | Wszystkie PR-y (zawsze) |
| BE1 (Kenji) | PR BE2 (user service) — weryfikuje zgodność interfejsu |
| BE2 (Akira) | PR FE — weryfikuje poprawność wywołań API |

### Faza 4: Poprawki i merge

1. Review adresuje wszystkie problemy w jednym komentarzu — agent poprawia za jednym razem
2. Agenty z `REQUEST_CHANGES` poprawiają kod
3. TL re-review — weryfikuje tylko czy poprawki zostały zastosowane → `APPROVE` (wyjątek: krytyczny błąd = jeszcze jedna runda)
4. Merge w kolejności zależności (najpierw BE2, potem BE1, potem FE)
5. Dopiero gdy FE, BE1, BE2 są wszystkie zmergowane — QA zaczyna testy e2e na aktualnym `main`

---

## Git Rules

### Tworzenie worktree

```bash
cd /sciezka/do/projektu
git fetch origin
git worktree add ../projekt-fe -b feature/login-ui origin/main
git worktree add ../projekt-be1 -b feature/auth-api origin/main
git worktree add ../projekt-be2 -b feature/user-service origin/main

# Worktree QA tworzy się PÓŹNIEJ — dopiero po merge FE+BE1+BE2:
git worktree add ../projekt-qa -b feature/tests origin/main
```

### Commit z tożsamością agenta — KRYTYCZNE

Nigdy nie używaj `git config user.name` w worktree — worktree współdzielą
`.git/config` i nawzajem się nadpisują przy równoległej pracy.

**Zawsze używaj env vars:**

```bash
GIT_AUTHOR_NAME="Yuki Sato" GIT_AUTHOR_EMAIL="fe@tsukimi-digital.com" \
  git commit -m "feat(fe): implement login form"
```

lub `--author` flag:

```bash
git commit --author="Yuki Sato <fe@tsukimi-digital.com>" -m "feat(fe): ..."
```

### Branch naming

```
feature/<scope>-<opis>    # np. feature/login-ui, feature/auth-api
fix/<scope>-<opis>        # poprawki po review
```

### Konwencja commit messages (Conventional Commits)

```
feat(fe): implement login form
feat(be1): add auth routes
feat(be2): mock user service
fix(be1): use crypto.randomBytes for token generation
test(qa): add e2e tests for user registration flow
chore: initial project scaffold
```

### Merge method

**Używaj `merge` lub `rebase`, NIE `squash`.**

Squash merge przypisuje commit konto robiące merge (GitHub token), tracąc
tożsamość autora feature brancha. `merge` i `rebase` zachowują oryginalnych
autorów w historii `main`.

```bash
# Przez GitHub API / MCP:
merge_method: "merge"   # lub "rebase"
# NIE: "squash"
```

### Kolejność mergowania

Zawsze merguj w kolejności zależności:
1. BE2 (user service)
2. BE1 (auth routes)
3. FE
4. Gdy wszystkie prace FE i BE są zmergowane — dopiero wtedy spawujesz QA

---

## Format komentarzy review na GitHub

Każdy agent podpisuje swój komentarz:

```markdown
**[TL — Hiroshi Tanaka]** Code Review

✅ Good:
- Czytelna struktura, zgodna z API contract
- Obsługa błędów kompletna

⚠️ Issues:
- `Math.random()` nie jest kryptograficznie bezpieczny — użyj `crypto.randomBytes(32)`
- Brak walidacji inputów na poziomie BE

Decision: REQUEST_CHANGES
```

---

## Prompt pattern dla agentów

### Developer (FE, BE1, BE2)

```
Jesteś [Rola] [Imię] w projekcie [nazwa].
Twój email: [email]@tsukimi-digital.com

Repo: /sciezka/do/projektu (worktree na branchu [branch])

Przed implementacją przeczytaj docs/api-contract.md — implementacja musi być zgodna z kontraktem.

[Opis zadania]

Napisz własne testy jednostkowe i integracyjne do komponentów które implementujesz.

COMMIT — zawsze używaj env var:
GIT_AUTHOR_NAME="[Imię]" GIT_AUTHOR_EMAIL="[email]" git commit -m "..."

[Kroki do wykonania]

Po ukończeniu zadania odhacz swoje pozycje w docs/PROGRESS.md i spushuj zmianę.

Zwróć: "[Rola]: [status]" lub opis błędu.
```

### QA (Mei Nakamura)

```
Jesteś QA Engineer Mei Nakamura w projekcie [nazwa].
Twój email: qa@tsukimi-digital.com

Repo: /sciezka/do/projektu (worktree na branchu feature/tests, bazuje na aktualnym main po merge FE+BE1+BE2)

Twoje zadanie: napisz testy e2e weryfikujące czy aplikacja spełnia założenia produktowe.
Podstawą są cele i wymagania zawarte w Design Spec projektu (dokument stworzony przez write-plan na początku projektu).

Nie piszesz testów jednostkowych — to odpowiedzialność developerów.
Testujesz zachowanie aplikacji z perspektywy użytkownika końcowego.

COMMIT — zawsze używaj env var:
GIT_AUTHOR_NAME="Mei Nakamura" GIT_AUTHOR_EMAIL="qa@tsukimi-digital.com" git commit -m "..."

[Kroki do wykonania]

Po ukończeniu odhacz swoje pozycje w docs/PROGRESS.md i spushuj zmianę.

Zwróć: "QA: [status]" lub opis błędu.
```

---

## Znane pułapki

| Problem | Przyczyna | Rozwiązanie |
|---------|-----------|-------------|
| Wszyscy agenci mają tego samego autora | `git config` w worktree nadpisuje wspólny `.git/config` | Używaj `GIT_AUTHOR_NAME` env var |
| Squash commit autor to konto GitHub | GitHub API squash merge przypisuje konto wykonujące merge | Używaj merge_method: "merge" |
| QA testy mają absolutne ścieżki | Import z worktree path zamiast in-repo | QA startuje na aktualnym `main` po merge FE+BE — problem nie występuje |
| Force push zablokowany po rebase | Auto mode security classifier | Wykonaj `git push --force-with-lease` ręcznie lub dodaj permission |

---

## Cleanup po zakończeniu pracy

Po tym jak użytkownik **potwierdzi odbiór pracy** (bez dalszych poprawek),
orkiestrator usuwa wszystkie tymczasowe foldery worktree:

```bash
cd /sciezka/do/projektu
git worktree remove ../projekt-fe
git worktree remove ../projekt-be1
git worktree remove ../projekt-be2
git worktree prune
```

Worktree QA jest tworzone później (po merge FE+BE1+BE2), więc usuwa się je osobno — zazwyczaj już po merge PR QA:

```bash
git worktree remove ../projekt-qa
git worktree prune
```

Cleanup wykonujemy **tylko po jawnym potwierdzeniu użytkownika** — np. "ok, przyjmuję", "wygląda dobrze", "zatwierdzone". Dopóki użytkownik nie potwierdzi, worktree pozostają — mogą być potrzebne do poprawek.

---

## Checklist nowego projektu

- [ ] Utwórz repo na GitHub
- [ ] TL robi initial commit (scaffold + API contract)
- [ ] Utwórz worktree dla FE, BE1, BE2
- [ ] Spawuj FE, BE1, BE2 równolegle
- [ ] Każdy agent tworzy PR (z własnymi testami jednostkowymi/integracyjnymi)
- [ ] TL + cross-review (patrz tabela wyżej)
- [ ] Agenty poprawiają według uwag
- [ ] TL approves wszystkie PR-y
- [ ] Merge w kolejności zależności: BE2 → BE1 → FE
- [ ] Utwórz worktree dla QA, spawuj QA na aktualnym `main`
- [ ] QA tworzy PR z testami e2e
- [ ] TL review PR QA → merge
- [ ] Usuń worktree: `git worktree remove ../projekt-fe` itd.
