import * as SQLite from 'expo-sqlite';
import { Alert } from'react-native';

// 数据库名称及当前版本（用于迁移）
const DB_NAME = 'coalMineDB.db';
const DB_VERSION = 2; // 版本号递增：1→2（示例：新增字段）

// 打开数据库连接
const db = SQLite.openDatabaseSync(DB_NAME);

/**
 * 初始化数据库：创建表、索引、执行迁移
 * @returns {Promise<void>}
 */
export const initDatabase = async () => {
    return new Promise((resolve, reject) => {
        // 事务包裹所有初始化操作
        db.withTransactionSync(
            (tx) => {
                // 1. 检查并设置数据库版本
                tx.executeSql(
                    'PRAGMA user_version;',
                    [],
                    (_, result) => {
                        const currentVersion = result.rows._array[0].user_version;
                        console.log(`当前数据库版本：${currentVersion}，目标版本：${DB_VERSION}`);
                    }
                );

                // 2. 创建核心表结构（若不存在）
                // 工单表
                tx.executeSql(`
          CREATE TABLE IF NOT EXISTS work_orders (
            id TEXT PRIMARY KEY NOT NULL,
            device_id TEXT NOT NULL,
            status TEXT NOT NULL,
            create_time TEXT NOT NULL,
            priority INTEGER DEFAULT 1,
            -- v2版本新增字段
            handler TEXT -- 处理人ID（版本2新增）
          );
        `);

                // 操作日志表
                tx.executeSql(`
          CREATE TABLE IF NOT EXISTS operation_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT NOT NULL,
            action TEXT NOT NULL,
            operator TEXT NOT NULL, -- 操作人
            time TEXT NOT NULL,
            FOREIGN KEY (order_id) REFERENCES work_orders(id) ON DELETE CASCADE
          );
        `);

                // 3. 创建索引（优化查询性能）
                // 工单表：按设备ID+状态查询（高频场景）
                tx.executeSql(`
          CREATE INDEX IF NOT EXISTS idx_orders_device_status 
          ON work_orders (device_id, status);
        `);
                // 日志表：按工单ID查询
                tx.executeSql(`
          CREATE INDEX IF NOT EXISTS idx_logs_order_id 
          ON operation_logs (order_id);
        `);

                // 4. 数据库迁移（版本升级逻辑）
                tx.executeSql(
                    'PRAGMA user_version;',
                    [],
                    (_, result) => {
                        const currentVersion = result.rows._array[0].user_version;
                        // 从v1升级到v2：新增handler字段
                        if (currentVersion < 2) {
                            tx.executeSql('ALTER TABLE work_orders ADD COLUMN handler TEXT;');
                            console.log('数据库已从v1迁移至v2');
                        }
                        // 后续版本升级可在此添加逻辑（如v2→v3）
                    }
                );

                // 5. 更新数据库版本号
                tx.executeSql(`PRAGMA user_version = ${DB_VERSION};`);
            },
            // 事务失败回调
            (error) => {
                console.error('数据库初始化失败：', error);
                Alert.alert('初始化错误', '数据库加载失败，请重启App重试');
                reject(error);
            },
            // 事务成功回调
            () => {
                console.log('数据库初始化完成（版本：', DB_VERSION, '）');
                resolve();
            }
        );
    });
};

// 关闭数据库连接（可选：在App退出时调用）
export const closeDatabase = async () => {
    return new Promise((resolve) => {
        db.closeAsync().then(() => {
            console.log('数据库已关闭');
            resolve();
        });
    });
};
