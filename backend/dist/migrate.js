"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const database_1 = __importDefault(require("./database"));
async function runMigrations() {
    try {
        console.log('Running database migrations...');
        const migrationsDir = path_1.default.join(__dirname, '../migrations');
        const migrationFiles = fs_1.default.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();
        for (const file of migrationFiles) {
            console.log(`Running migration: ${file}`);
            const migrationPath = path_1.default.join(migrationsDir, file);
            const sql = fs_1.default.readFileSync(migrationPath, 'utf8');
            await database_1.default.query(sql);
            console.log(`✓ Migration ${file} completed successfully`);
        }
        console.log('All migrations completed successfully!');
    }
    catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
    finally {
        await database_1.default.end();
    }
}
if (require.main === module) {
    runMigrations();
}
exports.default = runMigrations;
//# sourceMappingURL=migrate.js.map