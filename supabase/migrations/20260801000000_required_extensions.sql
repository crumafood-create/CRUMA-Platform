-- Reproduce la ubicación actual de pgvector en Production.
-- Su migración al schema extensions requiere un cambio posterior independiente.
create extension if not exists vector with schema public;
