/**
 * 同步本地数据到 Supabase
 * 将 src/data/devices.ts 中的数据导入到数据库
 */

const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const connectionString =
  "postgresql://postgres:Yxmsx123321.@sbp-a2e2xuudcasoe44t.supabase.opentrust.net:5432/postgres";

// 从 devices.ts 读取数据
function extractDevicesData() {
  const filePath = path.join(__dirname, "../src/data/devices.ts");
  const content = fs.readFileSync(filePath, "utf-8");

  // 提取 devices 数组
  const match = content.match(
    /export const devices: Device\[\] = (\[[\s\S]*?\]);/,
  );
  if (!match) {
    throw new Error("无法从 devices.ts 中提取数据");
  }

  // 将 TypeScript 代码转换为可执行的 JavaScript
  const devicesCode = match[1]
    .replace(/'/g, '"') // 单引号转双引号
    .replace(/(\w+):/g, '"$1":'); // 属性名加引号

  return JSON.parse(devicesCode);
}

async function syncData() {
  const client = new Client({ connectionString });

  try {
    console.log("📄 读取本地数据文件...");
    const devices = extractDevicesData();
    console.log(`✅ 成功读取 ${devices.length} 台设备\n`);

    console.log("🔌 正在连接到数据库...");
    await client.connect();
    console.log("✅ 连接成功！\n");

    // 1. 清空现有数据
    console.log("🗑️  清空现有数据...");
    await client.query("DELETE FROM issues");
    await client.query("DELETE FROM maintenance_logs");
    await client.query("DELETE FROM devices");
    console.log("✅ 已清空\n");

    // 2. 导入设备数据
    console.log("📥 导入设备数据...");
    for (const device of devices) {
      const coverImage = device.coverImage || null;
      const images = device.images ? JSON.stringify(device.images) : "[]";

      await client.query(
        `
        INSERT INTO devices (
          id, name, model, serial, printer_model_field, location, owner, status,
          cover_image, images, printer_model, printer_paper, printer_connect,
          printer_paper_stock, printer_ink_c, printer_ink_m, printer_ink_y, printer_ink_k,
          next_maintenance
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      `,
        [
          device.id,
          device.name,
          device.model,
          device.serial,
          device.printerModel,
          device.location,
          device.owner,
          device.status,
          coverImage,
          images,
          device.printer.model,
          device.printer.paper,
          device.printer.connect,
          device.printer.paperStock,
          device.printer.ink.C,
          device.printer.ink.M,
          device.printer.ink.Y,
          device.printer.ink.K,
          device.nextMaintenance,
        ],
      );

      console.log(`   ✅ ${device.name} - ${device.location}`);

      // 导入维护日志
      for (const log of device.logs) {
        await client.query(
          `
          INSERT INTO maintenance_logs (device_id, date, type, note, executor)
          VALUES ($1, $2, $3, $4, $5)
        `,
          [device.id, log.date, log.type, log.note, log.executor || null],
        );
      }

      // 导入故障记录
      for (const issue of device.issues) {
        await client.query(
          `
          INSERT INTO issues (device_id, date, description, status)
          VALUES ($1, $2, $3, $4)
        `,
          [device.id, issue.date, issue.desc, issue.status || null],
        );
      }
    }

    console.log("\n✅ 设备数据导入完成！");

    // 3. 验证数据
    console.log("\n🔍 验证数据...");
    const countResult = await client.query(
      "SELECT COUNT(*) as count FROM devices",
    );
    console.log(`   设备数量: ${countResult.rows[0].count}`);

    const logsResult = await client.query(
      "SELECT COUNT(*) as count FROM maintenance_logs",
    );
    console.log(`   维护日志: ${logsResult.rows[0].count}`);

    const issuesResult = await client.query(
      "SELECT COUNT(*) as count FROM issues",
    );
    console.log(`   故障记录: ${issuesResult.rows[0].count}`);

    // 显示所有设备
    console.log("\n📋 已导入的设备：");
    const devicesResult = await client.query(
      "SELECT id, name, location, status FROM devices ORDER BY name",
    );
    devicesResult.rows.forEach((d) => {
      console.log(`   ${d.name} - ${d.location} [${d.status}]`);
    });

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 同步完成！");
    console.log("\n📝 下一步：");
    console.log("   1. 本地刷新网站（Ctrl+F5）- 应该显示相同数据");
    console.log("   2. Vercel 刷新 - 也会显示相同数据");
    console.log("   3. 测试编辑、删除图片等功能");
    console.log("");
  } catch (error) {
    console.error("❌ 同步失败：", error.message);
    console.error("\n详细错误：", error);
    process.exit(1);
  } finally {
    await client.end();
    console.log("🔌 数据库连接已关闭");
  }
}

syncData();
