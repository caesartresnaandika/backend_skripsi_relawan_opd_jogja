-- db_opd_constraints.sql
-- Run this script to add CHECK constraints to the PostgreSQL database for OPD data validation

BEGIN;

-- Constraints for 'opd' table
ALTER TABLE opd 
  ADD CONSTRAINT chk_nama_opd_length CHECK (char_length(nama_opd) >= 3 AND char_length(nama_opd) <= 100),
  ADD CONSTRAINT chk_nama_opd_no_digits CHECK (nama_opd !~ '\d'),
  ADD CONSTRAINT chk_nama_opd_valid_chars CHECK (nama_opd ~ '^[a-zA-Z\s]+$');

ALTER TABLE opd
  ADD CONSTRAINT chk_alamat_length CHECK (alamat IS NULL OR char_length(alamat) >= 5),
  ADD CONSTRAINT chk_alamat_not_only_digits CHECK (alamat IS NULL OR alamat !~ '^\d+$');

COMMIT;