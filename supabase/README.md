# Supabase: spike de baseline y migraciones

Esta carpeta inicia la validación de ADR-0002. `config.toml` permite preparar el workflow local, pero todavía no existe un baseline canónico.

## Estado

- Supabase CLI está fijado en `2.109.1` mediante `devDependencies`.
- El inventario de referencias del código se obtiene con `pnpm db:inventory`.
- La extracción del esquema alojado, el baseline, los seeds y las pruebas de reconstrucción permanecen pendientes.

El inventario del código no es autoridad del esquema: puede omitir objetos no referenciados por la aplicación y no demuestra columnas, constraints, índices, triggers, grants ni RLS.

## Guardas

- No añadir credenciales, contraseñas, tokens ni datos productivos al repositorio.
- No vincular ni modificar Production durante el spike.
- No ejecutar un baseline sobre una base existente.
- No crear una migración vacía o inventada para simular avance.
- Exportar definiciones autorizadas sin filas ni datos de clientes.
- Probar primero cada migración mediante reset local y CI aislado.

## Secuencia pendiente

1. seleccionar un proyecto no productivo autorizado para el ensayo;
2. inventariar schemas, extensiones, tablas, vistas, funciones, triggers, grants, RLS y policies;
3. extraer únicamente definiciones;
4. comparar el inventario remoto con código y documentación;
5. revisar y depurar objetos administrados por Supabase;
6. crear el baseline timestamped;
7. reconstruir una base vacía;
8. probar RLS, funciones, constraints y seed;
9. generar tipos;
10. integrar el reset y las pruebas en CI;
11. reconciliar el historial remoto sin aplicar el baseline sobre Production.
