const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const crypto = require('crypto');

// Load environment variables from the backend development.env to avoid hardcoding credentials
const envPath = path.resolve(__dirname, '../../../../../variamos_ms_admin/env/development.env');
let dbConfig = {
  user: 'variamos_admin',
  host: 'localhost',
  database: 'variamos_db',
  password: 'mon_mot_de_passe_secret',
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
  }
};
