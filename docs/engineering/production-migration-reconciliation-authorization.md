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
## Restricción de ejecución

Este repositorio solo prepara el paquete. No existe un comando de ejecución en
este cambio. Datos y arquitectura deben aprobar el fingerprint y una nueva
autorización explícita será obligatoria justo antes de cualquier escritura.
