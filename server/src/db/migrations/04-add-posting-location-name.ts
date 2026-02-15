import { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
    await db.schema
        .createTable('posting_location_name')
        .addColumn('id', 'integer', col => col.primaryKey().autoIncrement())
        .addColumn('name', 'varchar(128)', col => col.notNull())
        .execute();
}
export async function down(db: Kysely<unknown>): Promise<void> {
    await db.schema.dropTable('posting_location_name').execute();
}
