const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const crypto = require('crypto');

// Load environment variables from the backend development.env to avoid hardcoding credentials
let envPath = path.resolve(__dirname, '../../../../variamos_ms_admin/env/development.env');
if (!fs.existsSync(envPath)) {
  // Fallback for when running in a nested git worktree (.worktrees/feature-name)
  const worktreeEnvPath = path.resolve(__dirname, '../../../../../../variamos_ms_admin/env/development.env');
  if (fs.existsSync(worktreeEnvPath)) {
    envPath = worktreeEnvPath;
  }
}

let dbConfig = {
  user: 'variamos_admin',
  host: 'localhost',
  database: 'variamos_db',
  password: 'variamos_db_password',
  port: 5432
};

if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  dbConfig = {
    user: envConfig.DB_USER || dbConfig.user,
    host: envConfig.DB_HOST || dbConfig.host,
    database: envConfig.DB_DATABASE || dbConfig.database,
    password: envConfig.DB_PASSWORD || dbConfig.password,
    port: parseInt(envConfig.DB_PORT || dbConfig.port, 10)
  };
}

/**
 * Helper client creator
 */
function getDbClient() {
  return new Client(dbConfig);
}

module.exports = {
  /**
   * Resets database state for password recovery testing.
   * Ensures test users exist in correct states and old tokens are deleted.
   */
  async seedTestUsers() {
    const client = getDbClient();
    await client.connect();

    try {
      // Helper subquery to target test user IDs
      const targetUserIdsQuery = `SELECT "id" FROM "variamos"."user" WHERE "email" LIKE '%@variamos-test.com'`;

      // 0. Delete existing test bugs (cascade-deletes attachments, notes, logs)
      await client.query(`
        DELETE FROM "variamos"."bugs" 
        WHERE "reporter_email" LIKE '%@variamos-test.com'
           OR "created_by_id" IN (${targetUserIdsQuery})
      `);

      // 1. Delete existing password reset tokens for testing domains
      await client.query(`
        DELETE FROM "variamos"."password_reset_tokens" 
        WHERE "user_id" IN (${targetUserIdsQuery})
      `);
      // 2. Cascade delete other relations
      await client.query(`
        DELETE FROM "variamos"."user_role" 
        WHERE "user_id" IN (${targetUserIdsQuery})
      `);

      await client.query(`
        DELETE FROM "variamos"."user_language" 
        WHERE "user_id" IN (${targetUserIdsQuery})
      `);

      await client.query(`
        DELETE FROM "variamos"."user_project" 
        WHERE "user_id" IN (${targetUserIdsQuery})
      `);

      // 3. Delete existing test users
      await client.query(`
        DELETE FROM "variamos"."user" 
        WHERE "email" LIKE '%@variamos-test.com'
      `);

      // 4. Find the Administrator Role ID to link to our test admin
      const roleRes = await client.query(`
        SELECT "id" FROM "variamos"."role" 
        WHERE "name" = 'Administrator' OR "name" = 'Admin' 
        LIMIT 1
      `);
      
      const adminRoleId = roleRes.rows[0] ? roleRes.rows[0].id : null;

      // 5. Insert fresh test users
      const adminId = crypto.randomUUID();
      const userId = crypto.randomUUID();
      const disabledId = crypto.randomUUID();
      const deletedId = crypto.randomUUID();

      const testHash = '$2b$10$yvGBiHMF5aWRj35v4A1RAOe.Zl1A037si8N5TEVYRcQOj3L1737ma'; // Hash for Password123!

      // Active Admin
      await client.query(`
        INSERT INTO "variamos"."user" ("id", "user", "name", "email", "password", "is_enabled", "is_deleted", "country_code", "created_at") 
        VALUES ($1, 'admin_test', 'Admin Test', 'admin@variamos-test.com', $2, true, false, 'CO', NOW())
      `, [adminId, testHash]);

      // Link Admin User to Administrator Role if role exists
      if (adminRoleId) {
        await client.query(`
          INSERT INTO "variamos"."user_role" ("user_id", "role_id") 
          VALUES ($1, $2)
        `, [adminId, adminRoleId]);
      }

      // Active User (Admin flow)
      await client.query(`
        INSERT INTO "variamos"."user" ("id", "user", "name", "email", "password", "is_enabled", "is_deleted", "country_code", "created_at") 
        VALUES ($1, 'user_test', 'User Test', 'user-test@variamos-test.com', $2, true, false, 'CO', NOW())
      `, [userId, testHash]);

      // Active User (SMTP flow)
      const smtpUserId = crypto.randomUUID();
      await client.query(`
        INSERT INTO "variamos"."user" ("id", "user", "name", "email", "password", "is_enabled", "is_deleted", "country_code", "created_at") 
        VALUES ($1, 'user_smtp', 'User SMTP Test', 'user-smtp@variamos-test.com', $2, true, false, 'CO', NOW())
      `, [smtpUserId, testHash]);

      // Disabled User
      await client.query(`
        INSERT INTO "variamos"."user" ("id", "user", "name", "email", "password", "is_enabled", "is_deleted", "country_code", "created_at") 
        VALUES ($1, 'disabled_test', 'Disabled Test', 'disabled-user@variamos-test.com', $2, false, false, 'CO', NOW())
      `, [disabledId, testHash]);

      // Deleted User
      await client.query(`
        INSERT INTO "variamos"."user" ("id", "user", "name", "email", "password", "is_enabled", "is_deleted", "country_code", "created_at") 
        VALUES ($1, 'deleted_test', 'Deleted Test', 'deleted-user@variamos-test.com', $2, true, true, 'CO', NOW())
      `, [deletedId, testHash]);

      return { success: true };
    } catch (error) {
      console.error('Failed to seed test database:', error);
      throw error;
    } finally {
      await client.end();
    }
  },

  async getLatestResetToken(email) {
    const client = getDbClient();
    await client.connect();

    try {
      const res = await client.query(`
        SELECT t."token_hash", t."user_id" FROM "variamos"."password_reset_tokens" t
        JOIN "variamos"."user" u ON CAST(u."id" AS text) = t."user_id"
        WHERE u."email" = $1
        ORDER BY t."created_at" DESC
        LIMIT 1
      `, [email]);

      if (!res.rows[0]) {
        return null;
      }

      const userId = res.rows[0].user_id;
      const oldHash = res.rows[0].token_hash;

      // Generate a new raw token (UUID) and hash it
      const rawToken = crypto.randomUUID();
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      // Overwrite the token hash in the database so that verification succeeds
      await client.query(`
        UPDATE "variamos"."password_reset_tokens"
        SET "token_hash" = $1
        WHERE "user_id" = $2 AND "token_hash" = $3
      `, [tokenHash, userId, oldHash]);

      return rawToken;
    } catch (error) {
      console.error('Failed to query reset token:', error);
      throw error;
    } finally {
      await client.end();
    }
  },

  /**
   * Inserts an expired token manually in DB to test the expiration edge case.
   */
  async insertExpiredToken({ email, token }) {
    const client = getDbClient();
    await client.connect();

    try {
      const userRes = await client.query('SELECT "id" FROM "variamos"."user" WHERE "email" = $1', [email]);
      if (!userRes.rows[0]) {
        throw new Error(`User not found: ${email}`);
      }
      const userId = userRes.rows[0].id;

      // Hash the token in SHA-256 just like the backend does before saving
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      // Set expiration in the past (e.g., 25 hours ago)
      const expiresAt = new Date(Date.now() - 25 * 60 * 60 * 1000);

      await client.query(`
        INSERT INTO "variamos"."password_reset_tokens" ("user_id", "token_hash", "expires_at", "created_at")
        VALUES ($1, $2, $3, NOW() - INTERVAL '26 hours')
      `, [userId, tokenHash, expiresAt]);

      return { success: true };
    } catch (error) {
      console.error('Failed to insert expired token:', error);
      throw error;
    } finally {
      await client.end();
    }
  },

  /**
   * Clean all test user records.
   */
  async cleanTestUsers() {
    const client = getDbClient();
    await client.connect();

    try {
      const targetUserIdsQuery = `SELECT "id" FROM "variamos"."user" WHERE "email" LIKE '%@variamos-test.com'`;

      // Clean up bugs first (cascade-deletes attachments, notes, logs)
      await client.query(`
        DELETE FROM "variamos"."bugs"
        WHERE "reporter_email" LIKE '%@variamos-test.com'
           OR "created_by_id" IN (${targetUserIdsQuery})
      `);

      await client.query(`
        DELETE FROM "variamos"."password_reset_tokens" 
        WHERE "user_id" IN (${targetUserIdsQuery})
      `);

      await client.query(`
        DELETE FROM "variamos"."user_role" 
        WHERE "user_id" IN (${targetUserIdsQuery})
      `);

      await client.query(`
        DELETE FROM "variamos"."user_language" 
        WHERE "user_id" IN (${targetUserIdsQuery})
      `);

      await client.query(`
        DELETE FROM "variamos"."user_project" 
        WHERE "user_id" IN (${targetUserIdsQuery})
      `);

      await client.query(`
        DELETE FROM "variamos"."user" 
        WHERE "email" LIKE '%@variamos-test.com'
      `);

      return { success: true };
    } catch (error) {
      console.error('Failed to clean test users:', error);
      throw error;
    } finally {
      await client.end();
    }
  },

  async getUserState(email) {
    const client = getDbClient();
    await client.connect();
    try {
      const res = await client.query('SELECT "is_enabled" as isEnabled, "is_deleted" as isDeleted FROM "variamos"."user" WHERE "email" = $1', [email]);
      if (!res.rows[0]) {
        return null;
      }
      return res.rows[0];
    } catch (error) {
      console.error('Failed to get user state:', error);
      throw error;
    } finally {
      await client.end();
    }
  },

  async cleanTestRoles() {
    const client = getDbClient();
    await client.connect();
    try {
      // 1. Delete associated role permissions
      await client.query(`
        DELETE FROM "variamos"."role_permission"
        WHERE "role_id" IN (SELECT "id" FROM "variamos"."role" WHERE "name" LIKE '%Test Custom Role%')
      `);
      // 2. Delete role mapping for users
      await client.query(`
        DELETE FROM "variamos"."user_role"
        WHERE "role_id" IN (SELECT "id" FROM "variamos"."role" WHERE "name" LIKE '%Test Custom Role%')
      `);
      // 3. Delete custom test roles
      await client.query(`
        DELETE FROM "variamos"."role"
        WHERE "name" LIKE '%Test Custom Role%'
      `);
      return { success: true };
    } catch (error) {
      console.error('Failed to clean test roles:', error);
      throw error;
    } finally {
      await client.end();
    }
  },

  async cleanTestLanguages() {
    const client = getDbClient();
    await client.connect();
    try {
      await client.query(`
        DELETE FROM "variamos"."user_language"
        WHERE "language_id" IN (SELECT "id" FROM "variamos"."language" WHERE "name" LIKE '%Test Custom Language%')
      `);
      await client.query(`
        DELETE FROM "variamos"."language"
        WHERE "name" LIKE '%Test Custom Language%'
      `);
      return { success: true };
    } catch (error) {
      console.error('Failed to clean test languages:', error);
      throw error;
    } finally {
      await client.end();
    }
  },

  async seedTestLanguages() {
    const client = getDbClient();
    await client.connect();
    try {
      await this.cleanTestLanguages();

      const userRes = await client.query('SELECT "id" FROM "variamos"."user" WHERE "email" = $1', ['admin@variamos-test.com']);
      const adminId = userRes.rows[0] ? userRes.rows[0].id : null;

      // Insert Active Language
      const activeRes = await client.query(`
        INSERT INTO "variamos"."language" ("name", "type", "stateAccept", "created_at", "updated_at")
        VALUES ('Test Custom Language Active', 'VariaMos', 'ACTIVE', NOW(), NOW())
        RETURNING "id"
      `);
      const activeLangId = activeRes.rows[0].id;

      // Insert Pending Language
      const pendingRes = await client.query(`
        INSERT INTO "variamos"."language" ("name", "type", "stateAccept", "created_at", "updated_at")
        VALUES ('Test Custom Language Pending', 'VariaMos', 'PENDING', NOW(), NOW())
        RETURNING "id"
      `);
      const pendingLangId = pendingRes.rows[0].id;

      // Link Active Language to owner
      if (adminId) {
        await client.query(`
          INSERT INTO "variamos"."user_language" ("user_id", "language_id", "access_level")
          VALUES ($1, $2, 'OWNER')
        `, [adminId, activeLangId]);
      }

      return { success: true, activeLangId, pendingLangId };
    } catch (error) {
      console.error('Failed to seed test languages:', error);
      throw error;
    } finally {
      await client.end();
    }
  },

  async cleanTestModels() {
    const client = getDbClient();
    await client.connect();
    try {
      await client.query(`
        DELETE FROM "variamos"."model"
        WHERE "name" LIKE '%Test Custom Model%'
      `);
      await client.query(`
        DELETE FROM "variamos"."user_project"
        WHERE "project_id" IN (SELECT "id" FROM "variamos"."project" WHERE "name" LIKE '%Test Custom Project%')
      `);
      await client.query(`
        DELETE FROM "variamos"."project"
        WHERE "name" LIKE '%Test Custom Project%'
      `);
      return { success: true };
    } catch (error) {
      console.error('Failed to clean test models:', error);
      throw error;
    } finally {
      await client.end();
    }
  },

  async seedTestModels() {
    const client = getDbClient();
    await client.connect();
    try {
      await this.cleanTestModels();
      // Ensure we have languages seeded
      const langRes = await client.query('SELECT "id" FROM "variamos"."language" WHERE "name" = $1', ['Test Custom Language Active']);
      let langId;
      if (langRes.rows[0]) {
        langId = langRes.rows[0].id;
      } else {
        const seedLangRes = await this.seedTestLanguages();
        langId = seedLangRes.activeLangId;
      }

      const userRes = await client.query('SELECT "id" FROM "variamos"."user" WHERE "email" = $1', ['admin@variamos-test.com']);
      const adminId = userRes.rows[0] ? userRes.rows[0].id : null;

      if (!adminId) {
        throw new Error('Admin user admin@variamos-test.com not found for seeding projects');
      }

      const projectId = crypto.randomUUID();
      const modelId = crypto.randomUUID();

      // Insert Project
      await client.query(`
        INSERT INTO "variamos"."project" ("id", "owner_id", "name", "project", "template", "is_collaborative", "date")
        VALUES ($1, $2, 'Test Custom Project', '{}', false, true, NOW())
      `, [projectId, adminId]);

      // Link User Project
      await client.query(`
        INSERT INTO "variamos"."user_project" ("user_id", "project_id", "role")
        VALUES ($1, $2, 'OWNER')
      `, [adminId, projectId]);

      // Insert Model
      await client.query(`
        INSERT INTO "variamos"."model" ("id", "project_id", "product_line_id", "engineering_type", "name", "type", "language_id", "model")
        VALUES ($1, $2, 'pl1', 'domain', 'Test Custom Model', 'VariaMos', $3, '{}')
      `, [modelId, projectId, langId]);

      return { success: true, projectId, modelId };
    } catch (error) {
      console.error('Failed to seed test models:', error);
      throw error;
    } finally {
      await client.end();
    }
  },

  async cleanTestVisits() {
    const client = getDbClient();
    await client.connect();
    try {
      await client.query(`DELETE FROM "variamos"."visits_summary" WHERE "page_id" LIKE 'test_%'`);
      await client.query(`DELETE FROM "variamos"."yearly_visits_summary" WHERE "country_code" = 'ZZ'`);
      return { success: true };
    } catch (error) {
      console.error('Failed to clean test visits:', error);
      throw error;
    } finally {
      await client.end();
    }
  },

  async seedTestVisits() {
    const client = getDbClient();
    await client.connect();
    try {
      await this.cleanTestVisits();

      // Insert into visits_summary
      await client.query(`
        INSERT INTO "variamos"."visits_summary" ("page_id", "unique_visits", "visits", "visits_date") VALUES
        ('test_dashboard', 5, 12, CURRENT_DATE - INTERVAL '2 days'),
        ('test_dashboard', 8, 20, CURRENT_DATE - INTERVAL '1 days'),
        ('test_dashboard', 15, 35, CURRENT_DATE)
      `);

      // Insert into yearly_visits_summary
      await client.query(`
        INSERT INTO "variamos"."yearly_visits_summary" ("count", "visit_year", "country_code") VALUES
        (9999, (DATE_TRUNC('year', CURRENT_DATE) - INTERVAL '1 years')::date, 'ZZ')
      `);

      return { success: true };
    } catch (error) {
      console.error('Failed to seed test visits:', error);
      throw error;
    } finally {
      await client.end();
    }
  }
};

