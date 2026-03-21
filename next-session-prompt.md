Leia o arquivo analysis.md antes de qualquer coisa — ele é a source of truth do projeto.

Estamos no Specwright. Na Session 30 fixamos BUG-037b e BUG-039, e rodamos Run 9b (parcial).
Último commit: e57289e. 475/475 testes passam.

## O que foi feito na Session 30

### Bugs fixados
- **BUG-037b** (HIGH): typecheck falhava com TS6053 mesmo após build PASS porque `.next/types/` não existia. Fix: guard `if [[ -d .next/types ]]` antes dos 3 call sites de typecheck em codex_bundle.py.
- **BUG-039** (CRITICAL): `enforce_owned_files()` revertia `progress.txt` e `.openclaw/progress/` via `git checkout HEAD --`, destruindo o histórico de slices DONE. Isso quebrava resume mode e crashava o pipeline. Fix: adicionados à `always_allowed` list com prefix match.

### Run 9b — Resultados parciais (12/38 DONE)
Gerado fresh, rodou com BUG-037b + BUG-039 fixes. Progresso:
- SH-ST-003 DONE, FE-ST-901 DONE (auto-skip), FE-ST-006 DONE, BE-ST-004 DONE
- **FE-ST-002 DONE** — confirmou fix BUG-037b (antes falhava)
- BE-ST-005 DONE, BE-ST-901 DONE (auto-skip), FE-ST-007 DONE
- FE-ST-008/903/010 DONE (auto-skip), BE-ST-001 DONE
- **FE-ST-013 BLOCKED** (3 retries) — BUG-038 reapareceu
- **BE-ST-900 BLOCKED** — cascata do BUG-038

### Por que BUG-038 reapareceu
O Run 9b usou `initializer new --spec` com spec do Run 7 (gerado antes do fix BUG-038). O `--spec` copia o spec sem re-executar o story_engine, então `expected_files` antigos não incluem `src/app/(app)/page.tsx` nos owned_files de `product.public-site-rendering`. O fix no story_engine (linha 1610) existe mas só se aplica a specs gerados do zero.

### Lock stale encontrado
Ao resumir após crash, `validation.lock` (mkdir-based) ficou pendurado, causando deadlock. Liberado manualmente. Considerar timeout ou PID-based locking no futuro.

## Tarefa: Session 31

### 1. PRIORIDADE: Fix do `prepare` para re-derivar owned_files (BUG-040)
O `run_prepare_project()` em `prepare_project.py` regenera `ralph.sh` e `.openclaw/` plans mas usa `execution` metadata do `spec.json` original. Quando o story_engine tem fixes novos (como BUG-038), os owned_files ficam stale.

**Fix proposto**: No `prepare`, re-executar `_build_execution_metadata()` em cada story para re-derivar `frontend_files`, `backend_files`, etc. a partir dos `expected_files` atuais. Isso garante que qualquer spec antigo ganhe os fixes do story_engine.

Investigar:
- `prepare_project.py` → `write_openclaw_bundle()` — como os plans são gerados
- `openclaw_bundle.py` linhas 303-314 — como `owned_files` são derivados do `execution`
- `story_engine.py` → `_build_execution_metadata()` — a função que classifica expected_files em tracks

### 2. Run 10 E2E
Após o fix do prepare:
1. Gerar projeto fresh: `python -m initializer new --spec output/editorial-run7/spec.json`
2. Rodar prepare: `python -m initializer prepare output/editorial-e2e-test`
3. Executar: `cd output/editorial-e2e-test && ./ralph.sh 2>&1 | tee ../run10.log`

Espera-se que FE-ST-013 agora passe (BUG-038 fix aplicado via prepare).

### 3. Atualizar analysis.md
Registrar BUG-037b, BUG-039 como FIXED e resultados do Run 10.

### 4. NÃO fazer nesta session
- Caching de node_modules entre runs (otimização prematura)
- Camada de persistência de gerações (precisa de pipeline estável primeiro)
- Essas otimizações fazem sentido mas o pipeline precisa completar um run E2E inteiro sem bugs antes
