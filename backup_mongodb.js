// MongoDB Atlas 備份腳本
// 使用 Node.js 和 MongoDB 驅動程式來備份資料

const fs = require('fs');
const path = require('path');

// 嘗試從 server/node_modules 載入 mongodb
let MongoClient;
try {
    // 先嘗試從當前目錄的 node_modules
    MongoClient = require('mongodb').MongoClient;
} catch (e) {
    try {
        // 再嘗試從 server/node_modules
        const serverNodeModules = path.join(__dirname, 'server', 'node_modules');
        const mongodbPath = path.join(serverNodeModules, 'mongodb');
        MongoClient = require(mongodbPath).MongoClient;
    } catch (e2) {
        console.error('錯誤：找不到 mongodb 模組');
        console.error('請執行: cd server && npm install mongodb');
        process.exit(1);
    }
}

// 從環境變數或命令列參數取得連接字串
const MONGODB_URI = process.env.MONGODB_URI || process.argv[2];
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'coupon_radar';

if (!MONGODB_URI) {
    console.error('錯誤：請提供 MONGODB_URI');
    console.error('使用方法：');
    console.error('  1. 設定環境變數: $env:MONGODB_URI="mongodb+srv://..."');
    console.error('  2. 或作為參數: node backup_mongodb.js "mongodb+srv://..."');
    process.exit(1);
}

// 產生備份目錄名稱
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const backupDir = path.join(__dirname, `mongodb_backup_${timestamp}`);

async function backupMongoDB() {
    let client;
    
    try {
        console.log('');
        console.log('========================================');
        console.log('  MongoDB Atlas 備份工具');
        console.log('========================================');
        console.log('');
        console.log(`資料庫: ${MONGODB_DB_NAME}`);
        console.log(`備份目錄: ${backupDir}`);
        console.log('');
        
        // 連接到 MongoDB
        console.log('正在連接到 MongoDB Atlas...');
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('✓ 連接成功');
        
        const db = client.db(MONGODB_DB_NAME);
        
        // 取得所有 collections
        const collections = await db.listCollections().toArray();
        console.log(`\n找到 ${collections.length} 個 collections:`);
        collections.forEach(col => console.log(`  - ${col.name}`));
        
        // 建立備份目錄
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }
        
        // 備份每個 collection
        let totalDocuments = 0;
        for (const collectionInfo of collections) {
            const collectionName = collectionInfo.name;
            console.log(`\n正在備份 collection: ${collectionName}...`);
            
            const collection = db.collection(collectionName);
            const documents = await collection.find({}).toArray();
            const count = documents.length;
            totalDocuments += count;
            
            // 儲存為 JSON 檔案
            const backupFile = path.join(backupDir, `${collectionName}.json`);
            fs.writeFileSync(
                backupFile,
                JSON.stringify(documents, null, 2),
                'utf8'
            );
            
            console.log(`  ✓ 已備份 ${count} 筆文件`);
            console.log(`  檔案: ${backupFile}`);
            
            // 計算檔案大小
            const fileSize = fs.statSync(backupFile).size / 1024;
            console.log(`  大小: ${fileSize.toFixed(2)} KB`);
        }
        
        // 建立備份資訊檔案
        const backupInfo = {
            timestamp: new Date().toISOString(),
            database: MONGODB_DB_NAME,
            mongodb_uri: MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'), // 隱藏密碼
            collections: collections.map(c => c.name),
            totalDocuments: totalDocuments,
            collectionsCount: collections.length
        };
        
        fs.writeFileSync(
            path.join(backupDir, 'backup_info.json'),
            JSON.stringify(backupInfo, null, 2),
            'utf8'
        );
        
        console.log('');
        console.log('========================================');
        console.log('  備份完成！');
        console.log('========================================');
        console.log('');
        console.log(`備份目錄: ${backupDir}`);
        console.log(`總文件數: ${totalDocuments}`);
        console.log(`Collections: ${collections.length}`);
        console.log('');
        console.log('備份內容：');
        collections.forEach(col => {
            console.log(`  - ${col.name}.json`);
        });
        console.log('  - backup_info.json');
        console.log('');
        
    } catch (error) {
        console.error('');
        console.error('❌ 備份失敗！');
        console.error('錯誤訊息:', error.message);
        console.error('');
        if (error.stack) {
            console.error('詳細錯誤:');
            console.error(error.stack);
        }
        process.exit(1);
    } finally {
        if (client) {
            await client.close();
            console.log('✓ 已關閉 MongoDB 連接');
        }
    }
}

// 執行備份
backupMongoDB().catch(console.error);

