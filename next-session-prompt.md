Leia o arquivo analysis.md antes de qualquer coisa — ele é a source of truth do projeto.

Estamos no Specwright. Na Session 32 fixamos BUG-040/041/042, implementamos modo sequencial (SEQ-001), e rodamos Run 11.
Último commit: 908cbee. 477/477 testes passam.

## O que foi feito na Session 32

### Bugs fixados
- **BUG-041** (HIGH): `enforce_owned_files()` deletava arquivos novos criados por tracks paralelas. Fix: guard `git cat-file -e HEAD:"$changed"` — só reverte arquivos que existem em HEAD.
- **BUG-040** (HIGH): `prepare` não re-derivava execution metadata de specs antigos. Fix em 2 partes: (1) `prepare_project.py` limpa stale execution e regenera via `generate_stories()`; (2) `_story_execution()` em `openclaw_bundle.py` prioriza derived file fields quando story tem expected_files.
- **BUG-042** (MEDIUM): Modo sequencial cascateava falha — slice BLOCKED no backend impedia frontend de rodar. Fix: ambos tracks sempre executam.

### SEQ-001 — Modo sequencial
- ralph.sh agora roda shared → backend → frontend → integration por padrão
- Parallelismo opt-in via `PARALLEL_TRACKS=true`
- Elimina toda a classe de race conditions que causou BUG-036 a BUG-041

### Run 11 — Resultados
- **14/15 backend DONE** — melhor run até agora
- **BE-ST-012 BLOCKED** — scheduled publishing precisa modificar `src/lib/content-status.ts` mas o arquivo não está nos owned_files
- Frontend e integration nunca rodaram (BUG-042, fixado depois)
- Run 11b tentou resumir mas `prepare` apagou os progress files (BUG-043)

## Diretriz principal

O editorial/Payload é a stack mais complexa do Specwright — Payload v3 strict types, route groups, migrations, CMS collections, preview, scheduled publishing. Todos os bugs que resolvemos (owned_files, enforcement, sequencing, resume) são genéricos do pipeline, não específicos do Payload. Quando o pipeline completar um run E2E limpo nesta stack (shared → backend → frontend → integration, zero BLOCKED), as outras stacks (node-api, Next simples) vão funcionar de graça.

**Foque 100% em completar um run E2E limpo na stack editorial.** Não pule para otimizações, outras stacks, ou features novas. Pipeline estável primeiro — todo o resto depende disso.

## Tarefa: Session 33

### 1. Fix BUG-043 — `prepare` deve preservar progress files
O `prepare` regenera toda a pasta `.openclaw/`, apagando `.openclaw/progress/`. Isso destrói o estado de resume.

**Fix proposto**: Em `prepare_project.py`, antes de chamar `write_openclaw_bundle()`, salvar os progress files em memória e restaurá-los depois. Ou melhor: `write_openclaw_bundle()` já cria `.openclaw/` — garantir que ele não apague `progress/`.

Investigar:
- `prepare_project.py` → `write_openclaw_bundle()` call
- `openclaw_bundle.py` → `write_openclaw_bundle()` — como cria a pasta `.openclaw/`
- Verificar se `mkdir -p` ou `shutil.rmtree` é usado

### 2. Fix owned_files de BE-ST-012 (scheduled publishing)
O story_engine não inclui `src/lib/content-status.ts` nos owned_files do story de scheduled-publishing. Codex precisa modificar esse arquivo para adicionar o status `"scheduled"` e o campo `publishAt`.

Investigar:
- `story_engine.py` → `_build_execution_metadata()` — como classifica expected_files
- Qual story tem `content-status.ts` nos expected_files
- Se precisa adicionar ao expected_files do story de scheduled-publishing ou criar regra no story_engine

### 3. Run 12 E2E
Após os fixes:
1. Gerar projeto fresh: `python -m initializer new --spec output/editorial-run7/spec.json`
2. Rodar prepare: `python -m initializer prepare output/editorial-e2e-test`
3. Executar: `cd output/editorial-e2e-test && ./ralph.sh 2>&1 | tee ../run12.log`

Objetivo: backend completo (14/14 DONE) + frontend track inteiro + integration gate.

### 4. Atualizar analysis.md
Registrar BUG-043 fix, owned_files fix, e resultados do Run 12.

### 5. NÃO fazer nesta session
- Caching de node_modules entre runs
- Camada de persistência de gerações
- Melhorias nos prompts do Codex para typing do Payload (investigar se necessário após Run 12)
- Otimizações de performance
