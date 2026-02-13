import { Kysely } from 'kysely';

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('organization_account')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('name', 'varchar', col => col.notNull())
    .addColumn('email', 'varchar(128)', col => col.notNull().unique())
    .addColumn('phone_number', 'varchar(32)', col => col.notNull().unique())
    .addColumn('url', 'varchar(256)', col => col.notNull().unique())
    .addColumn('latitude', 'numeric')
    .addColumn('longitude', 'numeric')
    .addColumn('password', 'varchar(256)', col => col.notNull().unique())
    .addColumn('location_name', 'varchar(256)', col => col.notNull())
    .execute();

  await db.schema
    .createTable('organization_request')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('email', 'varchar(128)', col => col.notNull().unique())
    .addColumn('name', 'varchar(128)', col => col.notNull())
    .addColumn('phone_number', 'varchar(32)')
    .addColumn('url', 'varchar(256)', col => col.notNull().unique())
    .addColumn('latitude', 'numeric')
    .addColumn('longitude', 'numeric')
    .addColumn('location_name', 'varchar(256)', col => col.notNull())
    .execute();

  await db.schema
    .createTable('volunteer_account')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('first_name', 'varchar(128)', col => col.notNull())
    .addColumn('last_name', 'varchar(128)', col => col.notNull())
    .addColumn('gender', 'varchar(64)', col => col.notNull())
    .addColumn('email', 'varchar(128)', col => col.notNull().unique())
    .addColumn('phone_number', 'varchar(32)', col => col.notNull().unique())
    .addColumn('password', 'varchar(256)', col => col.notNull().unique())
    .addColumn('description', 'text')
    .addColumn('date_of_birth', 'date', col => col.notNull())
    .addColumn('skills', 'text')

    .execute();

  await db.schema
    .createTable('admin_account')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('email', 'varchar(128)', col => col.notNull().unique())
    .addColumn('first_name', 'varchar(64)', col => col.notNull())
    .addColumn('last_name', 'varchar(64)', col => col.notNull())
    .execute();

  await db.schema
    .createTable('organization_posting')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('organization_id', 'integer', col => col.notNull().references('organization_account.id').onDelete('cascade'))
    .addColumn('title', 'varchar(256)', col => col.notNull())
    .addColumn('description', 'text', col => col.notNull())
    .addColumn('latitude', 'numeric', col => col.notNull())
    .addColumn('longitude', 'numeric', col => col.notNull())
    .addColumn('max_volunteers', 'integer')
    .addColumn('start_time', 'timestamp', col => col.notNull())
    .addColumn('end_time', 'timestamp')
    .addColumn('minimum_age', 'integer')
    .addColumn('skills', 'text')
    .addColumn('status', 'boolean')
    .execute();

  await db.schema
    .createTable('posting_skill')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('posting_id', 'integer', col => col.notNull().references('organization_posting.id').onDelete('cascade'))
    .addColumn('name', 'text', col => col.notNull())
    .execute();
  await db.schema
    .createTable('volunteer_skill')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('volunteer_id', 'integer', col => col.notNull().references('volunteer_account.id').onDelete('cascade'))
    .addColumn('name', 'text', col => col.notNull())
    .execute();

  await db.schema
    .createTable('organization_password_reset')
    .addColumn('organization_id', 'integer', col => col.notNull().references('organization_account.id').onDelete('cascade'))
    .addColumn('token', 'varchar(256)', col => col.notNull().unique())
    .execute();

  await db.schema
    .createTable('volunteer_password_reset')
    .addColumn('volunteer_id', 'integer', col => col.notNull().references('volunteer_account.id').onDelete('cascade'))
    .addColumn('token', 'varchar(256)', col => col.notNull().unique())
    .execute();
  await db.schema
    .createTable('admin_password_reset')
    .addColumn('admin_id', 'integer', col => col.notNull().references('admin_account.id').onDelete('cascade'))
    .addColumn('token', 'varchar(256)', col => col.notNull().unique())
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('admin_account').execute();
  await db.schema.dropTable('volunteer_account').execute();
  await db.schema.dropTable('organization_request').execute();
  await db.schema.dropTable('organization_account').execute();
  await db.schema.dropTable('organization_posting').execute();
  await db.schema.dropTable('posting_skill').execute();
  await db.schema.dropTable('volunteer_skill').execute();
  await db.schema.dropTable('organization_password_reset').execute();
  await db.schema.dropTable('volunteer_password_reset').execute();
  await db.schema.dropTable('admin_password_reset').execute();
}
