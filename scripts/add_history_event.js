const fs = require('fs').promises;
const path = require('path');
const db = require('../backend/database.js');

async function insertAndGetIds(tableName, items) {
    if (!items || items.length === 0) return [];

    const ids = [];
    for (const item of items) {
        const nameOrUrl = (tableName === 'sources') ? item : item;
        const columnName = (tableName === 'sources') ? 'url' : 'name';

        await new Promise((resolve, reject) => {
            db.run(`INSERT OR IGNORE INTO ${tableName} (${columnName}) VALUES (?)`, [nameOrUrl], function(err) {
                if (err) return reject(err);
                resolve();
            });
        });

        const row = await new Promise((resolve, reject) => {
            db.get(`SELECT id FROM ${tableName} WHERE ${columnName} = ?`, [nameOrUrl], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
        
        if (row) {
            ids.push(row.id);
        }
    }
    return ids;
}

/**
 * Bağlantı tablosuna verileri ekler. Hata bu fonksiyondaydı ve düzeltildi.
 */
async function linkItems(tableName, eventId, itemIds) {
    if (!itemIds || itemIds.length === 0) return;

    // HATA DÜZELTMESİ: Sütun adlarını programatik olarak türetmek yerine,
    // tablo adlarına göre doğru sütun adlarını doğrudan eşleştiriyoruz.
    const columnNameMap = {
        'event_people_link': 'person_id',
        'event_technologies_link': 'technology_id',
        'event_methods_link': 'method_id',
        'event_sources_link': 'source_id'
    };

    const linkedColumnName = columnNameMap[tableName];
    if (!linkedColumnName) {
        throw new Error(`'${tableName}' için sütun adı eşlemesi bulunamadı.`);
    }

    const stmt = db.prepare(`INSERT INTO ${tableName} (event_id, ${linkedColumnName}) VALUES (?, ?)`);
    for (const itemId of itemIds) {
        await new Promise((resolve, reject) => {
            stmt.run(eventId, itemId, function(err) {
                if (err) return reject(err);
                resolve();
            });
        });
    }
    stmt.finalize();
}

async function processEventFile(filePath) {
    console.log(`İşleniyor: ${filePath}`);
    
    try {
        const fileContent = await fs.readFile(filePath, 'utf8');
        const eventData = JSON.parse(fileContent);
        
        db.serialize(async () => {
            db.run('BEGIN TRANSACTION');

            try {
                const stmt = db.prepare(`
                    INSERT INTO historical_events 
                    (event_date, title_tr, title_en, narrative_tr, narrative_en, significance_tr, significance_en)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `);
                
                const eventId = await new Promise((resolve, reject) => {
                    stmt.run(
                        eventData.event_date,
                        eventData.title.tr,
                        eventData.title.en,
                        eventData.narrative.tr,
                        eventData.narrative.en,
                        eventData.metadata.significance.tr,
                        eventData.metadata.significance.en,
                        function(err) {
                            if (err) return reject(err);
                            resolve(this.lastID);
                        }
                    );
                    stmt.finalize();
                });
                console.log(`Ana olay eklendi. Olay ID: ${eventId}`);

                const peopleIds = await insertAndGetIds('people', eventData.metadata.key_people);
                const techIds = await insertAndGetIds('technologies', eventData.metadata.technologies_used);
                const methodIds = await insertAndGetIds('methods', eventData.metadata.methods_used);
                const sourceIds = await insertAndGetIds('sources', eventData.metadata.sources);

                await linkItems('event_people_link', eventId, peopleIds);
                await linkItems('event_technologies_link', eventId, techIds);
                await linkItems('event_methods_link', eventId, methodIds);
                await linkItems('event_sources_link', eventId, sourceIds);
                
                db.run('COMMIT');
                console.log(`✅ Olay ID ${eventId} ("${eventData.title.tr}") veritabanına başarıyla eklendi.`);

            } catch (error) {
                db.run('ROLLBACK');
                console.error('❌ Veritabanı hatası, işlem geri alındı:', error);
            }
        });
    } catch (error) {
        console.error(`Dosya işlenirken hata oluştu: ${filePath}`, error);
    }
}

const args = process.argv.slice(2);
if (args.length !== 1) {
    console.log('Kullanım: node scripts/add_history_event.js <path/to/event.json>');
    process.exit(1);
}

const filePath = path.resolve(args[0]);
processEventFile(filePath);