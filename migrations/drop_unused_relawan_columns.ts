import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('🔌 Terhubung ke database...');

        // Cek apakah kolom masih ada sebelum drop
        const checkQuery = `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'relawan'
              AND column_name IN ('tempat_lahir', 'tanggal_lahir', 'alamat_domisili');
        `;
        const existing = await client.query(checkQuery);
        const existingCols = existing.rows.map((r: any) => r.column_name);

        if (existingCols.length === 0) {
            console.log('✅ Kolom sudah tidak ada. Tidak ada yang perlu dihapus.');
            return;
        }

        console.log(`📋 Kolom yang akan dihapus: ${existingCols.join(', ')}`);

        await client.query('BEGIN');

        // Hapus kolom yang tidak diperlukan
        const dropStatements = existingCols.map((col: string) =>
            `ALTER TABLE relawan DROP COLUMN IF EXISTS ${col}`
        );

        for (const stmt of dropStatements) {
            console.log(`  ⚙️  ${stmt}`);
            await client.query(stmt);
        }

        await client.query('COMMIT');
        console.log('✅ Migration berhasil! Kolom berhasil dihapus dari tabel relawan.');

        // Verifikasi hasil
        const verifyQuery = `
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'relawan'
            ORDER BY ordinal_position;
        `;
        const result = await client.query(verifyQuery);
        console.log('\n📊 Kolom tabel relawan sekarang:');
        result.rows.forEach((row: any) => {
            console.log(`  - ${row.column_name} (${row.data_type})`);
        });

    } catch (err: any) {
        await client.query('ROLLBACK');
        console.error('❌ Migration GAGAL:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
