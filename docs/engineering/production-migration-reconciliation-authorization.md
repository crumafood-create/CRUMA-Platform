# Autorización de reconciliación de migraciones en Production

## Objetivo

Preparar evidencia inmutable para revisión sin habilitar escrituras remotas.

Generar el paquete local de autorización:

```bash
pnpm db:reconciliation:prepare-production
```

Este preflight no requiere `SUPABASE_ACCESS_TOKEN`, no se conecta a Production
y no ejecuta `migration repair`, `db push` ni SQL remoto. Solo acepta el
project ref vinculado `poglpqvmbrfcvtuspvtx` y el plan exacto derivado de la
evidencia aprobada.

La salida debe confirmar:

- `PRODUCTION_PREPARATION_STATUS=OK`;
- `PREP_EVIDENCE_SECRET_SCAN=OK`;
- `REMOTE_WRITES_AUTHORIZED=false`;
- `EXECUTION_COMMAND=null`;
- un `PLAN_FINGERPRINT` SHA-256;
- un `EVIDENCE_DIR` con el plan y el paquete de autorización.

El fingerprint identifica el plan que datos y arquitectura deben revisar. Este
procedimiento no implementa ni autoriza la ejecución: cualquier escritura
posterior exige autorización explícita en el momento de ejecutarla.
## Ejecutor protegido

El ejecutor exige el paquete generado, el project ref, el fingerprint exacto y
un `SUPABASE_ACCESS_TOKEN` activo que nunca se imprime. Sin indicar un modo,
solo consulta el inventario de Production y previsualiza `db push`:

```bash
CRUMA_PRODUCTION_PROJECT_REF=poglpqvmbrfcvtuspvtx \
CRUMA_PRODUCTION_PLAN_FINGERPRINT=40ebeaf66ab56d5b8cb675fb0b3b5584d0865c6700e3a49459f78c4faffb3004 \
pnpm db:reconciliation:execute-production \
  /ruta/segura/authorization-packet.json
```

El modo `execute` permanece bloqueado salvo que, en el momento de ejecución,
se proporcionen también estas dos variables:

```text
CRUMA_PRODUCTION_EXECUTION_MODE=execute
CRUMA_PRODUCTION_EXECUTION_CONFIRMATION=AUTORIZO_RECONCILIACION_PRODUCTION
```

La secuencia protegida verifica que el inventario remoto esté vacío, vuelve a
capturar el drift de `public` y exige el SHA-256 aprobado
`112eaa0b8899c0f3f489f9d3d7c950688171a8b40085085fc76c3d5b52a7b524`
antes de ejecutar un preflight `db push --dry-run`. Después registra como aplicadas
exclusivamente las versiones `20260801000000` y `20260802000000`, confirma ese
checkpoint, aplica las cinco migraciones pendientes y exige las siete versiones
al finalizar.

Este cambio implementa y prueba el ejecutor, pero no autoriza su uso. Datos y
arquitectura deben aprobar el fingerprint y se requiere una autorización humana
independiente justo antes de cualquier escritura en Production.
